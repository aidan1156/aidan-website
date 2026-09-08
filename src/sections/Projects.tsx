import { InfoCard } from '../cards/InfoCard';
import './sections.css';

export function Projects() {
    const projects = [
        {
            title: "Nerve",
            description: "Worked on Nerve, a no code biological neural network IDE, allowing users to deploy their models to robots.",
            link: "https://nervelabs.co.uk",
            icon: "./images/nerve.svg",
            darkModeIcon: "./images/nerve-dark.png",
        },
        {
            title: "Characterdle",
            description: "Made a better Wordle, you guess the daily character as you would in Wordle. 26 possible options instead of 2300 words, much easier!",
            link: "./characterdle.html",
            icon: "./images/wordle.png",
            darkModeIcon: "./images/wordle-dark.png",
        },
        {
            title: "Lmao Soundboard",
            description: "Created an AI big data soundboard which automatically plays relevant sound effects, I made it for a hackathon so its scrappily done.",
            link: "https://github.com/aidan1156/lmao-soundboard",
            icon: "./images/megaphone.png",
            darkModeIcon: "./images/megaphone-dark.png",
        }
    ]

    return (
        <div className="projects section" id='projects-section'>
            <h2>Projects</h2>
            <div className="project-list section-list">
                {projects.map((project, index) => (
                    <InfoCard 
                        key={index} 
                        title={project.title} 
                        description={project.description} 
                        link={project.link} 
                        icon={project.icon} 
                        darkModeIcon={project.darkModeIcon} 
                    />
                ))}
            </div>
        </div>
    )
}