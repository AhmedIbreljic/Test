import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';

import Markdown from '~/components/Markdown';
import PageWrapper from '~/components/PageWrapper';
import { TeamMember, TeamMemberProps } from '~/components/TeamMember';

export const teamMembers: Array<TeamMemberProps> = [
	{
		name: 'Ahmed I',
		role: 'Founder, Engineer & CEO',
		imageUrl: '/images/team/ahmed.jpg',
		socials: {
			twitter: 'https://x.com/AhmedIbreljic',
			twitch: 'https://twitch.tv/AhmedIbreljicLive',
			github: 'https://github.com/AhmedIbreljic'
		}
	},
	{
		name: 'Joseph N',
		role: 'Co-founder, ML SME',
		imageUrl: '/images/team/joseph.jpg',
		socials: {
			twitter: 'https://x.com/JosephNguyenXABCDE',
			twitch: 'https://twitch.tv/JosephNguyenLiveEduX',
			github: 'https://github.com/JosephNguyenYoSeple'
		}
	}
];

const aiteam: Array<TeamMemberProps> = [
	{
		name: 'AI: Robert',
		role: 'COO Agent',
		imageUrl: '/images/team/AIAgent.PNG',
	},
	{
		name: 'AI: Phillip',
		role: 'CFO Agent',
		imageUrl: '/images/team/AIAgent2.png',
	}
];
const investors: Array<TeamMemberProps> = [
	{
		name: 'Coming Soon',
		role: '',
		investmentRound: '',
		imageUrl: '/images/investors/black.jpg'
	}
];

export default function TeamPage() {
	return (
		<PageWrapper>
			<Markdown articleClassNames="mx-auto mt-32 prose-a:text-white">
				<Head>
					<title>Our Team - EduX</title>
					<meta name="description" content="Who's behind Spacedrive?" />
				</Head>
				<div className="team-page relative mx-auto">
					<div
						className="bloom subtle egg-bloom-one -top-60 right-[-400px]"
						style={{ transform: 'scale(2)' }}
					/>
					<div className="relative z-10">
						<h1 className="fade-in-heading text-5xl leading-tight sm:leading-snug ">
							We believe degree scheduling should be{' '}
							<span className="title-gradient">unified</span>.
						</h1>
						<p className="animation-delay-2 fade-in-heading text-white/50 ">
							We believe that your educational journey shouldn't be hindered by rigid scheduling constraints. It should be flexible, student-centered, and designed to empower you to graduate in under four years.
						</p>
						<p className="animation-delay-2 fade-in-heading text-white/50 ">
							The academic data we generate during our educational pursuits is a crucial part of our lifelong legacy. With our cutting-edge technology, we ensure that this data remains easily accessible, adaptable across various educational environments, and ultimately owned by you."
						</p>
						<p className="animation-delay-2 fade-in-heading text-white/50 ">
							Our commitment guarantees that you have complete control over your academic records and degree plans. We empower you to shape your educational destiny at any scale, making it easier than ever to achieve your academic goals efficiently and effectively."
						</p>
						<Link
							href="/docs/product/resources/faq"
							className="animation-delay-3 fade-in-heading text-underline flex flex-row items-center text-gray-400 underline-offset-4 duration-150 hover:text-white"
						>
							<ArrowRight className="mr-2" />
							Read more
						</Link>
						<div className="fade-in-heading animation-delay-5">
							<h2 className="mt-10 text-2xl leading-relaxed sm:mt-20 ">
								Meet the team
							</h2>
							<div className="my-10 grid grid-cols-2 gap-x-5 gap-y-10 xs:grid-cols-3 sm:grid-cols-4">
								{teamMembers.map((member) => (
									<TeamMember key={member.name} {...member} />
								))}
							</div>
							
							<h2
								id="aiteam"
								className="mb-2 mt-10 text-2xl leading-relaxed sm:mt-20 "
							>
								Our AI Agent Team
							</h2>
							<p className="text-sm text-gray-400 ">
								Our AI agent teams are specialized LLM agent models powered by ChatDev and ChatGPT 3.5 Turbo. Our agents work together accomplishing complex feats, leveraging their AI capabilities and collaborating effeciently.
							</p>
							<div className="my-10 grid grid-cols-3 gap-x-5 gap-y-10 sm:grid-cols-5">
								{aiteam.map((member) => (
									<TeamMember
										key={member.name + member.investmentRound}
										{...member}
									/>
								))}
							</div>
							<h2
								id="investors"
								className="mb-2 mt-10 text-2xl leading-relaxed sm:mt-20 "
							>
								Our investors
							</h2>
							<p className="text-sm text-gray-400 ">
								We're backed by some of the greatest universities in the United States.
							</p>
							<div className="my-10 grid grid-cols-3 gap-x-5 gap-y-10 sm:grid-cols-5">
								{investors.map((investor) => (
									<TeamMember
										key={investor.name + investor.investmentRound}
										{...investor}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</Markdown>
		</PageWrapper>
	);
}
