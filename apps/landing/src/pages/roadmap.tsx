import clsx from 'clsx';
import Head from 'next/head';
import Link from 'next/link';
import { Fragment } from 'react';

import PageWrapper from '~/components/PageWrapper';

const items = [
	{
		when: 'Beginning',
		subtext: 'Q1 2022',
		completed: true,
		title: 'Initial Idea',
		description:
			'Started out as Ciate, main pages were created in HTML and app was created in Google Forms.'
	},
	{
		title: 'MVP Planning',
		completed: true,
		description: 'Switching landing pages to React during Web3.0 push, app was later developed in Low Code Bubble.'
	},
	{
		title: 'Statistics',
		completed: true,
		description: 'Discovering errors in Bubble and overall awful database. Back to the drawing-board.'
	},
	{
		title: 'Research',
		completed: true,
		description:
			'Decent app was tested with students on campus, learned that the process was manual, tedious, and extrmely time-consuming for each user.'
	},
	{
		when: 'Alpha',
		subtext: 'Q2 2022',
		completed: true,
		title: 'Explorer',
		description:
			'Browse online/offline apps and read everything we could on developing AI apps and machine learning algorithms.'
	},
	{
		completed: true,
		title: 'Self hosting',
		description:
			'Company was named to EduX. Incorporated and domains were bought.'
	},
	{
		completed: true,
		title: 'Tags',
		description:
			'Testing out different applications and learning more from our users.'
	},
	{
		completed: true,
		title: 'Key manager',
		description:
			'Deployed within Streamlit and Flask to demonstrate a viable MVP.'
	},
	{
		when: 'Present Day',
		title: 'Spacedrop',
		description: 'Incoporating GPT3.5, process is seamless and automated.'
	},
	{
		title: 'Search',
		description: 'Testing our current MVP with students across different universities with different majors.'
	},
	{
		title: 'Photos',
		description: 'Photos and video albums similar to Apple/Google photos.'
	},
	{
		when: '0.1.0 Beta',
		subtext: 'Q2 2023',
		title: 'Realtime library synchronization',
		description: 'Automatically synchronized libraries across devices via P2P connections.'
	},
	{
		title: 'Media encoder',
		description:
			'Encode video and audio into various formats, use Tags to automate. Built with FFmpeg.'
	},
	{
		title: 'Cloud integration',
		description:
			'Index & backup to Apple Photos, Google Drive, Dropbox, OneDrive & Mega + easy API for the community to add more.'
	},
	{
		title: 'Hosted Spaces',
		description: 'Host select Spaces on our cloud to share with friends or publish on the web.'
	},
	{
		when: '0.6.0 Beta',
		subtext: 'Q3 2023',
		title: 'Extensions',
		description:
			'Build tools on top of Spacedrive, extend functionality and integrate third party services. Extension directory on spacedrive.com/extensions.'
	},
	{
		title: 'Encrypted vault(s)',
		description:
			'Effortlessly manage & encrypt sensitive files. Encrypt individual files or create flexible-size vaults.'
	},
	{
		when: 'Release',
		subtext: 'Q4 2023',
		title: 'Timeline',
		description:
			'View a linear timeline of content, travel to any time and see media represented visually.'
	},
	{
		title: 'Redundancy',
		description:
			'Ensure a specific amount of copies exist for your important data, discover at-risk files and monitor device/drive health.'
	},
	{
		title: 'Workers',
		description:
			'Utilize the compute power of your devices in unison to encode and perform tasks at increased speeds.'
	}
];

export default function RoadmapPage() {
	return (
		<PageWrapper>
			<Head>
				<title>Roadmap - EduX</title>
				<meta name="description" content="What can EduX do?" />
			</Head>
			<div className="lg:prose-xs prose dark:prose-invert container m-auto mb-20 flex max-w-4xl flex-col gap-20 p-4 pt-32">
				<section className="flex flex-col items-center">
					{/* ??? why img tag */}
					<img className="pointer-events-none w-24" />
					<h1 className="fade-in-heading mb-0 text-center text-5xl leading-snug">
						What's next for EduX?
					</h1>
					<p className="animation-delay-2 fade-in-heading text-center text-gray-400">
						Here is a list of the features we are working on, and the progress we have
						made so far.
					</p>
				</section>
				<section className="grid auto-cols-auto grid-flow-row grid-cols-[auto_1fr] gap-x-4">
					{items.map((item, i) => (
						<Fragment key={i}>
							{/* Using span so i can use the group-last-of-type selector */}
							<span className="group flex max-w-[10rem] items-start justify-end gap-4 first:items-start">
								<div className="flex flex-col items-end">
									<h3
										className={
											`m-0 hidden text-right lg:block ` +
											(i === 0 ? '-translate-y-1/4' : '-translate-y-1/2')
										}
									>
										{item.when}
									</h3>
									{item?.subtext && (
										<span className="text-sm text-gray-300">
											{item?.subtext}
										</span>
									)}
								</div>
								<div className="flex h-full w-2 group-first:mt-2 group-first:rounded-t-full group-last-of-type:rounded-b-full lg:items-center">
									<div
										className={
											'flex h-full w-full ' +
											(item.completed ? 'z-10 bg-primary-500' : 'bg-gray-550')
										}
									>
										{item?.when !== undefined ? (
											<div
												className={clsx(
													'absolute z-20 mt-5 h-4 w-4 -translate-x-1/4 -translate-y-1/2 rounded-full border-2 border-gray-200 group-first:mt-0 group-first:self-start lg:mt-0',
													items[i - 1]?.completed || i === 0
														? 'z-10 bg-primary-500'
														: 'bg-gray-550'
												)}
											>
												&zwj;
											</div>
										) : (
											<div className="z-20">&zwj;</div>
										)}
									</div>
								</div>
							</span>
							<div className="group flex flex-col items-start justify-center gap-4">
								{item?.when && (
									<h3 className="mb-0 group-first-of-type:m-0 lg:hidden">
										{item.when}
									</h3>
								)}
								<div className="my-2 flex w-full flex-col space-y-2 rounded-xl border border-gray-500 p-4 group-last:mb-0 group-first-of-type:mt-0">
									<h3 className="m-0">{item.title}</h3>
									<p>{item.description}</p>
								</div>
							</div>
						</Fragment>
					))}
				</section>
				<section className="space-y-2 rounded-xl bg-gray-850 p-8">
					<h2 className="my-1">That's not all.</h2>
					<p>
						We're always open to ideas and feedback over{' '}
						<Link href="https://github.com/EduX/EduX/discussions">
							here
						</Link>{' '}
						and we have a <Link href="/blog">blog</Link> where you can find the latest
						news and updates.
					</p>
				</section>
			</div>
		</PageWrapper>
	);
}
