import './info-card.css';
import { useIsDarkTheme } from '../useIsDarkTheme';


export function InfoCard({ title, description, link, icon, darkModeIcon, image, startDate, endDate }: { title: string; description: string; link?: string | null; icon?: string | null; darkModeIcon?: string | null; image?: string | null; startDate?: string, endDate?: string }) {
    const isDarkTheme = useIsDarkTheme();

    const visibleIcon = isDarkTheme && darkModeIcon ? darkModeIcon : icon;

    return (
        <a
            className={`info-card ${image ? 'has-image' : ''}`}
            href={link || undefined}
            onClick={(event) => {
                if (!link) {
                    event.preventDefault();
                }
            }}
        >
            {image && <img src={image} alt="" className="info-card-image" />}
            <div>
                <div className="card-title">
                    <h3>{title}</h3>
                    <span>
                        {startDate}
                        {(startDate && endDate) && " - "}
                        {endDate}
                    </span>
                </div>
                <p>{description}</p>
            </div>
            <div className={'icon-wrapper ' + (visibleIcon && link ? 'switch-on-hover' : '')}>
                {visibleIcon && <img src={visibleIcon} alt="" />}
                {link && <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>}
            </div>
        </a>
    )
}