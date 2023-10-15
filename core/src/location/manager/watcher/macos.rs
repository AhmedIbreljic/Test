//! On MacOS, we use the FSEvents backend of notify-rs and Rename events are pretty complicated;
//! There are just (ModifyKind::Name(RenameMode::Any) events and nothing else.
//! This means that we have to link the old path with the new path to know which file was renamed.
//! But you can't forget that renames events aren't always the case that I file name was modified,
//! but its path was modified. So we have to check if the file was moved. When a file is moved
//! inside the same location, we received 2 events: one for the old path and one for the new path.
//! But when a file is moved to another location, we only receive the old path event... This
//! way we have to handle like a file deletion, and the same applies for when a file is moved to our
//! current location from anywhere else, we just receive the new path rename event, which means a
//! creation.

use crate::{
	invalidate_query,
	library::Library,
	location::{
		file_path_helper::{
			check_file_path_exists, get_inode_and_device, FilePathError, IsolatedFilePathData,
		},
		manager::LocationManagerError,
	},
	prisma::location,
	util::error::FileIOError,
	Node,
};

use std::{collections::HashMap, path::PathBuf, sync::Arc};

use async_trait::async_trait;
use notify::{
	event::{CreateKind, DataChange, MetadataKind, ModifyKind, RenameMode},
	Event, EventKind,
};
use tokio::{fs, io, time::Instant};
use tracing::{error, trace, warn};

use super::{
	utils::{
		create_dir, create_dir_or_file, extract_inode_and_device_from_path, extract_location_path,
		remove, rename, update_file,
	},
	EventHandler, INodeAndDevice, InstantAndPath, HUNDRED_MILLIS, ONE_SECOND,
};

#[derive(Debug)]
pub(super) struct MacOsEventHandler<'lib> {
	location_id: location::id::Type,
	library: &'lib Arc<Library>,
	node: &'lib Arc<Node>,
	files_to_update: HashMap<PathBuf, Instant>,
	files_to_update_buffer: Vec<(PathBuf, Instant)>,
	reincident_to_update_files: HashMap<PathBuf, Instant>,
	last_events_eviction_check: Instant,
	latest_created_dir: Option<PathBuf>,
	old_paths_map: HashMap<INodeAndDevice, InstantAndPath>,
	new_paths_map: HashMap<INodeAndDevice, InstantAndPath>,
	paths_map_buffer: Vec<(INodeAndDevice, InstantAndPath)>,
}

#[async_trait]
impl<'lib> EventHandler<'lib> for MacOsEventHandler<'lib> {
	fn new(
		location_id: location::id::Type,
		library: &'lib Arc<Library>,
		node: &'lib Arc<Node>,
	) -> Self
	where
		Self: Sized,
	{
		Self {
			location_id,
			library,
			node,
			files_to_update: HashMap::new(),
			files_to_update_buffer: Vec::new(),
			reincident_to_update_files: HashMap::new(),
			last_events_eviction_check: Instant::now(),
			latest_created_dir: None,
			old_paths_map: HashMap::new(),
			new_paths_map: HashMap::new(),
			paths_map_buffer: Vec::new(),
		}
	}

	async fn handle_event(&mut self, event: Event) -> Result<(), LocationManagerError> {
		trace!("Received MacOS event: {:#?}", event);

		let Event {
			kind, mut paths, ..
		} = event;

		match kind {
			EventKind::Create(CreateKind::Folder) => {
				let path = &paths[0];
				if let Some(ref latest_created_dir) = self.latest_created_dir.take() {
					if path == latest_created_dir {
						// NOTE: This is a MacOS specific event that happens when a folder is created
						// trough Finder. It creates a folder but 2 events are triggered in
						// FSEvents. So we store and check the latest created folder to avoid
						// hiting a unique constraint in the database
						return Ok(());
					}
				}

				create_dir(
					self.location_id,
					path,
					&fs::metadata(path)
						.await
						.map_err(|e| FileIOError::from((path, e)))?,
					self.node,
					self.library,
				)
				.await?;
				self.latest_created_dir = Some(paths.remove(0));
			}
			EventKind::Create(CreateKind::File)
			| EventKind::Modify(ModifyKind::Data(DataChange::Content))
			| EventKind::Modify(ModifyKind::Metadata(
				MetadataKind::WriteTime | MetadataKind::Extended,
			)) => {
				// When we receive a create, modify data or metadata events of the abore kinds
				// we just mark the file to be updated in a near future
				// each consecutive event of these kinds that we receive for the same file
				// we just store the path again in the map below, with a new instant
				// that effectively resets the timer for the file to be updated
				let path = paths.remove(0);
				if self.files_to_update.contains_key(&path) {
					if let Some(old_instant) =
						self.files_to_update.insert(path.clone(), Instant::now())
					{
						self.reincident_to_update_files
							.entry(path)
							.or_insert(old_instant);
					}
				} else {
					self.files_to_update.insert(path, Instant::now());
				}
			}
			EventKind::Modify(ModifyKind::Name(RenameMode::Any)) => {
				self.handle_single_rename_event(paths.remove(0)).await?;
			}

			EventKind::Remove(_) => {
				remove(self.location_id, &paths[0], self.library).await?;
			}
			other_event_kind => {
				trace!("Other MacOS event that we don't handle for now: {other_event_kind:#?}");
			}
		}

		Ok(())
	}

	async fn tick(&mut self) {
		if self.last_events_eviction_check.elapsed() > HUNDRED_MILLIS {
			if let Err(e) = self.handle_to_update_eviction().await {
				error!("Error while handling recently created or update files eviction: {e:#?}");
			}

			// Cleaning out recently renamed files that are older than 100 milliseconds
			if let Err(e) = self.handle_rename_create_eviction().await {
				error!("Failed to create file_path on MacOS : {e:#?}");
			}

			if let Err(e) = self.handle_rename_remove_eviction().await {
				error!("Failed to remove file_path: {e:#?}");
			}

			self.last_events_eviction_check = Instant::now();
		}
	}
}

impl MacOsEventHandler<'_> {
	async fn handle_to_update_eviction(&mut self) -> Result<(), LocationManagerError> {
		self.files_to_update_buffer.clear();
		let mut should_invalidate = false;

		for (path, created_at) in self.files_to_update.drain() {
			if created_at.elapsed() < HUNDRED_MILLIS * 5 {
				self.files_to_update_buffer.push((path, created_at));
			} else {
				self.reincident_to_update_files.remove(&path);
				update_file(self.location_id, &path, self.node, self.library).await?;
				should_invalidate = true;
			}
		}

		self.files_to_update
			.extend(self.files_to_update_buffer.drain(..));

		self.files_to_update_buffer.clear();

		// We have to check if we have any reincident files to update and update them after a bigger
		// timeout, this way we keep track of files being update frequently enough to bypass our
		// eviction check above
		for (path, created_at) in self.reincident_to_update_files.drain() {
			if created_at.elapsed() < ONE_SECOND * 10 {
				self.files_to_update_buffer.push((path, created_at));
			} else {
				self.files_to_update.remove(&path);
				update_file(self.location_id, &path, self.node, self.library).await?;
				should_invalidate = true;
			}
		}

		if should_invalidate {
			invalidate_query!(self.library, "search.paths");
		}

		self.reincident_to_update_files
			.extend(self.files_to_update_buffer.drain(..));

		Ok(())
	}

	async fn handle_rename_create_eviction(&mut self) -> Result<(), LocationManagerError> {
		// Just to make sure that our buffer is clean
		self.paths_map_buffer.clear();
		let mut should_invalidate = false;

		for (inode_and_device, (instant, path)) in self.new_paths_map.drain() {
			if instant.elapsed() > HUNDRED_MILLIS {
				if !self.files_to_update.contains_key(&path) {
					create_dir_or_file(self.location_id, &path, self.node, self.library).await?;
					trace!("Created file_path due timeout: {}", path.display());
					should_invalidate = true;
				}
			} else {
				self.paths_map_buffer
					.push((inode_and_device, (instant, path)));
			}
		}

		if should_invalidate {
			invalidate_query!(self.library, "search.paths");
		}

		self.new_paths_map.extend(self.paths_map_buffer.drain(..));

		Ok(())
	}

	async fn handle_rename_remove_eviction(&mut self) -> Result<(), LocationManagerError> {
		// Just to make sure that our buffer is clean
		self.paths_map_buffer.clear();
		let mut should_invalidate = false;

		for (inode_and_device, (instant, path)) in self.old_paths_map.drain() {
			if instant.elapsed() > HUNDRED_MILLIS {
				remove(self.location_id, &path, self.library).await?;
				trace!("Removed file_path due timeout: {}", path.display());
				should_invalidate = true;
			} else {
				self.paths_map_buffer
					.push((inode_and_device, (instant, path)));
			}
		}

		if should_invalidate {
			invalidate_query!(self.library, "search.paths");
		}

		self.old_paths_map.extend(self.paths_map_buffer.drain(..));

		Ok(())
	}

	async fn handle_single_rename_event(
		&mut self,
		path: PathBuf, // this is used internally only once, so we can use just PathBuf
	) -> Result<(), LocationManagerError> {
		match fs::metadata(&path).await {
			Ok(meta) => {
				// File or directory exists, so this can be a "new path" to an actual rename/move or a creation
				trace!("Path exists: {}", path.display());

				let inode_and_device = get_inode_and_device(&meta)?;
				let location_path = extract_location_path(self.location_id, self.library).await?;

				if !check_file_path_exists::<FilePathError>(
					&IsolatedFilePathData::new(
						self.location_id,
						&location_path,
						&path,
						meta.is_dir(),
					)?,
					&self.library.db,
				)
				.await?
				{
					if let Some((_, old_path)) = self.old_paths_map.remove(&inode_and_device) {
						trace!(
							"Got a match new -> old: {} -> {}",
							path.display(),
							old_path.display()
						);

						// We found a new path for this old path, so we can rename it
						rename(self.location_id, &path, &old_path, meta, self.library).await?;
					} else {
						trace!("No match for new path yet: {}", path.display());
						self.new_paths_map
							.insert(inode_and_device, (Instant::now(), path));
					}
				} else {
					warn!(
						"Received rename event for a file that already exists in the database: {}",
						path.display()
					);
				}
			}
			Err(e) if e.kind() == io::ErrorKind::NotFound => {
				// File or directory does not exist in the filesystem, if it exists in the database,
				// then we try pairing it with the old path from our map

				trace!("Path doesn't exists: {}", path.display());

				let inode_and_device =
					match extract_inode_and_device_from_path(self.location_id, &path, self.library)
						.await
					{
						Ok(inode_and_device) => inode_and_device,
						Err(LocationManagerError::FilePath(FilePathError::NotFound(_))) => {
							// temporary file, we can ignore it
							return Ok(());
						}
						Err(e) => return Err(e),
					};

				if let Some((_, new_path)) = self.new_paths_map.remove(&inode_and_device) {
					trace!(
						"Got a match old -> new: {} -> {}",
						path.display(),
						new_path.display()
					);

					// We found a new path for this old path, so we can rename it
					rename(
						self.location_id,
						&new_path,
						&path,
						fs::metadata(&new_path)
							.await
							.map_err(|e| FileIOError::from((&new_path, e)))?,
						self.library,
					)
					.await?;
				} else {
					trace!("No match for old path yet: {}", path.display());
					// We didn't find a new path for this old path, so we store ir for later
					self.old_paths_map
						.insert(inode_and_device, (Instant::now(), path));
				}
			}
			Err(e) => return Err(FileIOError::from((path, e)).into()),
		}

		Ok(())
	}
}