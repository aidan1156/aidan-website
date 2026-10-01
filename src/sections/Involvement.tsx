import { InfoCard } from '../cards/InfoCard';
import './sections.css';

export function Involvement() {
    const involvements = [
        {
            title: "[Craft]",
            description: "Co-hosted [Craft], a passion project building society, designed to help people build the things they love",
            link: "https://www.craftedu.org/",
            startDate: "Nov 2023",
            endDate: "Dec 2025",
        },
        {
            title: "DoCSoc Events Officer",
            description: "Elected as DoCSoc events officer, in charge of organising regular society socials.",
            link: "https://docsoc.co.uk/",
            icon: "./images/docsoc.png",
            darkModeIcon: "./images/docsoc-dark.png",
            startDate: "Aug 2026",
            endDate: "Aug 2027",
        },
    ]

    return (
        <div className="involvement section" id='involvement-section'>
            <h2>Involvement</h2>
            <div className="project-list section-list">
                {involvements.map((involvement, index) => (
                    <InfoCard 
                        key={index} 
                        title={involvement.title} 
                        description={involvement.description} 
                        link={involvement.link}
                        icon={involvement.icon}
                        darkModeIcon={involvement.darkModeIcon}
                        startDate={involvement.startDate}
                        endDate={involvement.endDate}
                    />
                ))}
            </div>
        </div>
    )
}