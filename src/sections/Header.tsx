import { supportsLiquidGlass } from "../glass/GlassEffect";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { useIsDarkTheme } from '../useIsDarkTheme';

import './header.css';


const socials = [
    {
        label: "LineupsValorant",
        link: "https://lineupsvalorant.com/profile/lineupsval",
        icon: "./images/lineupsval.png",
        darkModeIcon: "./images/lineupsval-dark.png",
    },
    {
        label: "LinkedIn",
        link: "https://www.linkedin.com/in/aidan-baker-b9928b235/",
        icon: "./images/linkedin.png",
        darkModeIcon: "./images/linkedin-dark.png",
    },
    {
        label: "GitHub",
        link: "https://github.com/aidan1156",
        icon: "./images/github.png",
        darkModeIcon: "./images/github-dark.png",
    },
];


// Owns its own playback state so it starts clean on every mount and dies with the
// element it controls.
function EpicModePlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);
    // Mirrors the audio element's own play/pause events - reading audioRef.current.paused
    // during render doesn't re-render when playback state changes.
    const [isPaused, setIsPaused] = useState(true);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        const updateProgress = () => {
            if (!audio.duration || Number.isNaN(audio.duration)) {
                setProgress(0);
                return;
            }

            setProgress((audio.currentTime / audio.duration) * 1000);
        };

        const handlePlay = () => setIsPaused(false);
        const handlePause = () => setIsPaused(true);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateProgress);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, []);

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration || Number.isNaN(audio.duration)) {
            return;
        }

        const value = Number(e.target.value);
        audio.currentTime = (value / 1000) * audio.duration;
        const video = videoRef.current;
        if (video) {
            video.currentTime = (value / 1000) * video.duration;
        }
        setProgress(value);
    }

    const togglePlayback = () => {
        const audio = audioRef.current;
        const video = videoRef.current;
        if (!audio || !video) {
            return;
        }
        if (audio.paused) {
            audio.play();
            video.play();
        } else {
            audio.pause();
            video.pause();
        } 
    }

    return (
        <div className="epic-mode-player">
            <video src="./images/epic-gaming.mp4" autoPlay loop muted ref={videoRef}></video>
            <audio src="./images/aidandubstep.mp3" loop autoPlay ref={audioRef}></audio>
            <div className="epic-mode-player-controls">
                <div>
                    We Live, We Love, We Lie
                    <div className="music-progress" style={{'--progress': String(Math.floor(progress / 10)) + '%'} as CSSProperties}>
                        <input type="range" min="0" max="1000" value={progress} onChange={handleProgressChange} />
                        <div></div>
                    </div>
                </div>
                <button onClick={togglePlayback} className={`playback-button ${isPaused ? 'paused' : ''}`}>
                    {isPaused ? (
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/></svg>
                    )}
                </button>
            </div>
        </div>
    )
}


export function Header({setEpicMode, epicMode}: {setEpicMode: (value: boolean) => void, epicMode: boolean}) {
    const isDarkTheme = useIsDarkTheme();

    const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.detail === 3) {
            setEpicMode(!epicMode);
        }
    }

    return (
        <div className="header-container">
            <div className="header" onClick={handleHeaderClick}>
                <img src="./images/header.jpeg" alt="" />
                <h1>Aidan Baker</h1>
            </div>
            <div className="header-intro">
                <p>
                    I am an undergraduate at Imperial College London studying Computing. Sometimes I build stuff, when I do I try and add it here.
                </p>
                <div className="header-socials">
                    {socials.map((social) => (
                        <a
                            key={social.label}
                            href={social.link}
                            aria-label={social.label}
                            title={social.label}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <img src={isDarkTheme && social.darkModeIcon ? social.darkModeIcon : social.icon} alt="" />
                        </a>
                    ))}
                </div>
            </div>
            {!supportsLiquidGlass() && <p>
                P.S. I love you for supporting a non Chromium browser, but Chromium just supports more, including the liquid ass effect I use, switch to Chrome or any non Firefox/Safari browser for a better effect.    
            </p>}
            {epicMode && <EpicModePlayer />}
        </div>
    )
}