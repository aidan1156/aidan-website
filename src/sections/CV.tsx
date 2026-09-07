import { FileCard } from "../cards/FileCard"

export function CVSection() {
    return (
        <div className="cv-section section" id='cv-section'>
            <h2>CV</h2>
            <p>If you like all these projects and think they are cool, please take a look at my proper CV and hire me!</p>
            <FileCard
                title={"CV.pdf"}
                link={"./cv.pdf"}
                type={"pdf"}
            />
        </div>
    )
}