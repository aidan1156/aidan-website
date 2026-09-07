
import { InfoCard } from "../cards/InfoCard"

export function Achievements() {
    const achievements = [
        {
            title: "4th Place Kotlin Pawn Race",
            description: "4th place in the Imperial Kotlin Pawn Race. I promise I would've come 2nd if I didnt forget ONE line of code in a section that was impossible to test >:/ (my clout </3).",
            link: null,
            icon: null,
        },
        {
            title: "Participation Award in SMC",
            description: "Achieved a certificate of participation in the UK Senior Maths Challenge while in Y12. I got a gold in the next year but promised my teacher I'd mention my certificate of participation in UCAS etc.",
            link: null,
            icon: "./images/smc.webp",
        },
        {
            title: "Bought a Boosted Board",
            description: "Managed to get a Boosted Mini X, best decision ever. I have since put over 800 miles on it saving me time and money. Its my baby and I love it.",
            link: null,
            image: "./images/boosted-mini.jpg",
            icon: "./images/boosted.png",
            darkModeIcon: "./images/boosted-dark.png",
        },
        {
            title: "Bought a Second Boosted Board",
            description: "Bought a Boosted Stealth because they're amazing, love both of them.",
            link: null,
            image: "./images/boosted-stealth.jpg",
            icon: "./images/boosted.png",
            darkModeIcon: "./images/boosted-dark.png",
        },
        {
            title: "Went to YC AI Start up School",
            description: "Went to YC AI SUS 2025, was a lot of fun, met some really cool people and heard from the founders of modern AI.",
            link: "https://events.ycombinator.com/ai-sus",
            image: "./images/sf.jpg",
            icon: "./images/yc.svg",
        }
    ]

    return (
        <div className="achievements section">
            <h2>Achievements</h2>
            <div className="achievements-list section-list">
                {achievements.map((achievement, index) => (
                    <InfoCard
                        key={index}
                        title={achievement.title}
                        description={achievement.description}
                        link={achievement.link}
                        icon={achievement.icon}
                        image={achievement.image}
                        darkModeIcon={achievement.darkModeIcon}
                    />
                ))}
            </div>
        </div>
    )
}