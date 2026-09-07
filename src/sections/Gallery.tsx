import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GlassContainer } from '../glass/GlassContainer'

import './gallery.css'

type ImageBox = {
    x: number
    y: number
    width: number
    height: number
}

export function Gallery() {
    const images = [
        "./gallery-images/IMG-20230422-WA0004.jpg", 
        "./gallery-images/PXL_20240524_004836502.jpg", 
        "./gallery-images/IMG-20240701-WA0006.jpg",
        "./gallery-images/notphotoshopped.jpg",
        "./gallery-images/IMG-20240701-WA0015.jpg",
        "./gallery-images/IMG_1613.jpg", 
        "./gallery-images/IMG-20240622-WA0018.jpg", 
        "./gallery-images/IMG-20240609-WA0005.jpg",
        "./gallery-images/IMG-20220826-WA0000.jpg", 
        "./gallery-images/PXL_20240602_154204182.jpg", 
        "./gallery-images/IMG-20240609-WA0001 (1).jpg",
        "./gallery-images/Snapchat-1889425769.jpg",
        "./gallery-images/DSC02966.JPG", 
        "./gallery-images/DSC03151.JPG", 
        "./gallery-images/IMG_3515.jpg", 
        "./gallery-images/IMG_6714.jpg", 
        "./gallery-images/IMG-20231127-WA0048.jpg", 
        "./gallery-images/IMG-20240325-WA0007.jpg", 
        "./gallery-images/jamin.jpg", 
        "./gallery-images/PXL_20231221_184302061.jpg", 
        "./gallery-images/PXL_20240201_123408700.jpg", 
        "./gallery-images/xi.jpg", 
        "./gallery-images/xi2.jpg", 
        "./gallery-images/rolzie.jpg", 
        "./gallery-images/pranav.jpg", 
        "./gallery-images/IMG-20240628-WA0024.jpg", 
        "./gallery-images/Snapchat-1886120257.jpg", 
        "./gallery-images/IMG-20240612-WA0163.jpg", 
        "./gallery-images/IMG-20240612-WA0147.jpg",
        "./gallery-images/IMG-20240609-WA0003.jpg",
        "./gallery-images/PXL_20240602_160054541.MP.jpg",
        "./gallery-images/PXL_20240517_203706070.jpg",
        "./gallery-images/PXL_20240331_100335271.jpg",
        "./gallery-images/IMG-20240624-WA0029.jpg",
        "./gallery-images/IMG-20240624-WA0012.jpg",
        "./gallery-images/91B5144D-6A0C-4402-99A2-1BC65B4F4CB5_1_105_c.jpeg",
        "./gallery-images/BBE2317B-0AD5-4DDB-A9AB-D0C77823AF9B_1_105_c.jpeg",
        "./gallery-images/PXL_20230223_150948900.MP.jpg"
    ]

    const containerRef = useRef<HTMLDivElement | null>(null)
    const imageRefs = useRef<Array<HTMLImageElement | null>>([])
    const [secondRowLastImageBox, setSecondRowLastImageBox] = useState<ImageBox | null>(null)
    const [galleryPopupOpen, setGalleryPopupOpen] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
    const [prevSelectedImageIndex, setPrevSelectedImageIndex] = useState<number | null>(null)

    useEffect(() => {
        if (selectedImageIndex !== null) {
            setPrevSelectedImageIndex(selectedImageIndex)
        }
    }, [selectedImageIndex])
    
    const measureSecondRowLastImage = () => {
        const container = containerRef.current
        if (!container) {
            setSecondRowLastImageBox(null)
            return
        }

        const imagesInGrid = imageRefs.current.filter((imageElement): imageElement is HTMLImageElement => Boolean(imageElement))
        if (imagesInGrid.length === 0) {
            setSecondRowLastImageBox(null)
            return
        }

        const containerRect = container.getBoundingClientRect()
        const rowTops = Array.from(
            new Set(
                imagesInGrid
                    .map((imageElement) => Math.round(imageElement.getBoundingClientRect().top))
            )
        ).sort((leftTop, rightTop) => leftTop - rightTop)

        if (rowTops.length < 2) {
            setSecondRowLastImageBox(null)
            return
        }

        const secondRowTop = rowTops[1]
        const secondRowImages = imagesInGrid
            .map((imageElement) => ({
                element: imageElement,
                rect: imageElement.getBoundingClientRect(),
            }))
            .filter(({ rect }) => Math.abs(Math.round(rect.top) - secondRowTop) <= 1)
            .sort((leftImage, rightImage) => leftImage.rect.left - rightImage.rect.left)

        const lastImageInSecondRow = secondRowImages.at(-1)
        if (!lastImageInSecondRow) {
            setSecondRowLastImageBox(null)
            return
        }

        const { rect } = lastImageInSecondRow
        setSecondRowLastImageBox({
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
        })
    }

    useLayoutEffect(() => {
        measureSecondRowLastImage()
    }, [images.length])

    useEffect(() => {
        const container = containerRef.current
        if (!container || typeof ResizeObserver === 'undefined') {
            return
        }

        const observer = new ResizeObserver(() => {
            measureSecondRowLastImage()
        })

        observer.observe(container)

        window.addEventListener('resize', measureSecondRowLastImage)

        return () => {
            observer.disconnect()
            window.removeEventListener('resize', measureSecondRowLastImage)
        }
    }, [images.length])

    useEffect(() => {
        if (!galleryPopupOpen) {
            return
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setGalleryPopupOpen(false)
                setSelectedImageIndex(null)
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [galleryPopupOpen])

    useEffect(() => {
        if (selectedImageIndex === null) return
        if (selectedImageIndex < 0) {
            setSelectedImageIndex(images.length - 1)
        } else if (selectedImageIndex >= images.length) {
            setSelectedImageIndex(0)
        }
    }, [selectedImageIndex])

    return (
        <div className="gallery section">
            <h2>Gallery</h2>
            <p>Photos of the people who support me/I am grateful for.</p>
            <div className="gallery-photo-preview-grid" ref={containerRef} data-second-row-box={JSON.stringify(secondRowLastImageBox)}>
                {images.map((image, index) => (
                    <img
                        key={index}
                        ref={(imageElement) => {
                            imageRefs.current[index] = imageElement
                        }}
                        src={image}
                        alt={`Gallery image ${index + 1}`}
                        className="gallery-image"
                        onLoad={measureSecondRowLastImage}
                        onClick={() => {
                            setGalleryPopupOpen(true)
                            setSelectedImageIndex(index)
                        }}
                    />
                ))}
                <button style={{
                        left: secondRowLastImageBox ? secondRowLastImageBox.x : 0,
                        top: secondRowLastImageBox ? secondRowLastImageBox.y : 0,
                        width: secondRowLastImageBox ? secondRowLastImageBox.width : 0,
                        height: secondRowLastImageBox ? secondRowLastImageBox.height : 0,
                    }}
                    className='gallery-view-all'
                    onClick={() => setGalleryPopupOpen(true)}
                >
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
                        <div>View All</div>
                    </div>
                </button>
            </div>

            <div
                className={`gallery-popup ${galleryPopupOpen ? 'open' : ''}`}
                role="dialog"
                aria-modal="true"
                onClick={() => {
                    setGalleryPopupOpen(false)
                    setSelectedImageIndex(null)
                }}
            >
                <div className={`gallery-popup-panel ${selectedImageIndex !== null ? 'image-open' : ''}`} onClick={(event) => event.stopPropagation()}>
                    <div className="full-gallery-grid">
                        {images.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt={`Gallery image ${index + 1}`}
                                className="gallery-image"
                                onClick={() => setSelectedImageIndex(index)}
                            />
                        ))}
                        <div></div>
                    </div>
                    <div className={`photo-wrapper ${selectedImageIndex !== null ? 'open' : ''}`}>
                        {prevSelectedImageIndex !== null && <img src={images[prevSelectedImageIndex]} alt="" />}
                    </div>
                    <div className="gallery-controls">
                        <GlassContainer className="close button-group increase-clarity">
                            <button onClick={() => {setGalleryPopupOpen(false); setSelectedImageIndex(null);}} className='hover-on-glass' title='Close'>
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                            </button>
                        </GlassContainer>

                        <GlassContainer className="back button-group increase-clarity">
                            <button onClick={() => setSelectedImageIndex(null)} className='hover-on-glass' title='Back to Gallery'>
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>
                            </button>
                        </GlassContainer>

                        <GlassContainer className="next-prev-image button-group increase-clarity">
                            <button onClick={() => setSelectedImageIndex(selectedImageIndex !== null ? selectedImageIndex - 1 : null)} className='hover-on-glass' title='Previous Image'>
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>
                            </button>

                            <button onClick={() => setSelectedImageIndex(selectedImageIndex !== null ? selectedImageIndex + 1 : null)} className='hover-on-glass' title='Next Image'>
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
                            </button>
                        </GlassContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}