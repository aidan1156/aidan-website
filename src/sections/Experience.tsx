
import { InfoCard } from "../cards/InfoCard"

export function Experience() {
    const experience = [
        {
            title: "LineupsValorant",
            description: "I built LineupsValorant to help players find and share their favorite Valorant lineups. Since launch we have gained 70k monthly active users as well as 1000's of community uploaded lineups",
            link: "https://lineupsvalorant.com",
            icon: "./images/lineups.svg",
            startDate: "Jan 2021",
            endDate: "present",
        },
        {
            title: "Optiver",
            description: "Only placement intern at Optiver summer 2026 as a software engineer, worked on dev infrastructure and data ingestion.",
            link: "https://www.optiver.com",
            icon: "./images/optiver.png",
            startDate: "April",
            endDate: "Sept 2026",
        },
        {
            title: "theTradeDesk",
            description: "Worked at the Trade Desk on their summer internship program in 2025, as a software engineer.",
            link: "https://www.thetradedesk.com",
            icon: "./images/ttd.png",
            darkModeIcon: "./images/ttd-dark.png",
            startDate: "June",
            endDate: "Sept 2025"
        },
        {
            title: "Newcastle University",
            description: "Worked as a freelance software engineer to create bespoke software for various trials.",
            icon: "./images/newcastle-uni.svg",
            link: "https://www.ncl.ac.uk/",
            startDate: "Dec 2021",
            endDate: "Sep 2024",
        }
    ]

    return (
        <div className="experience section" id='experience-section'>
            <h2>Experience</h2>
            <div className="experience-list section-list">
                {experience.map((exp, index) => (
                    <InfoCard
                        key={index}
                        title={exp.title}
                        description={exp.description}
                        link={exp.link}
                        icon={exp.icon}
                        darkModeIcon={exp.darkModeIcon}
                        startDate={exp.startDate}
                        endDate={exp.endDate}
                    />
                ))}
            </div>
        </div>
    )
}