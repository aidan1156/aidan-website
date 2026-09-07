import { useEffect, useState } from 'react'
import './file-card.css'

function formatFileSize(sizeInBytes: number) {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes}B`
    }

    const units = ['KB', 'MB', 'GB']
    let size = sizeInBytes / 1024
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex += 1
    }

    return `${size.toFixed(size >= 10 ? 0 : 1)}${units[unitIndex]}`
}

export function FileCard({ title, link, type }: { title: string; link: string; type: "pdf" }) {
    const [size, setSize] = useState('-')

    useEffect(() => {
        let isActive = true

        async function loadFileSize() {
            try {
                const response = await fetch(link)

                if (!response.ok) {
                    throw new Error(`Failed to fetch file: ${response.status}`)
                }

                const blob = await response.blob()

                if (isActive) {
                    setSize(formatFileSize(blob.size))
                }
            } catch {
                if (isActive) {
                    setSize('Unknown size')
                }
            }
        }

        loadFileSize()

        return () => {
            isActive = false
        }
    }, [link])

    return (
        <a className="file-card" href={link} target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>
            <div className='file-card-text'>
                <h3>{title}</h3>
                <span>{size}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>
        </a>
    )
}