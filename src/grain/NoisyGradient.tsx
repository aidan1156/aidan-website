import { useEffect, useRef, useState } from 'react'
import { BAND, createRenderer } from './grain-material'

import './noisy-gradient.css'

const THEMES = ['light', 'dark'] as const

type Theme = (typeof THEMES)[number]

type WorkerReply = {
    id: number
    theme: Theme
    width: number
    height: number
    pixels?: Uint8ClampedArray
    error?: string
}

// Grain wants to sit on device pixels rather than CSS pixels, so the surface is
// always oversampled at least 2x and then scaled back down by the browser.
const surfaceScale = () => Math.min(Math.max(2, window.devicePixelRatio || 1), 2.5)

export function NoisyGradient() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRefs = useRef<Record<Theme, HTMLCanvasElement | null>>({ light: null, dark: null })
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) {
            return
        }

        let cancelled = false
        let worker: Worker | null = null
        let generation = 0
        let painted = 0
        let resizeTimer: number | undefined
        let idleHandle: number | undefined

        const paint = (theme: Theme, width: number, height: number, pixels: Uint8ClampedArray) => {
            const canvas = canvasRefs.current[theme]
            if (!canvas) {
                return
            }
            canvas.width = width
            canvas.height = height
            canvas.getContext('2d')?.putImageData(new ImageData(pixels, width, height), 0, 0)
            painted++
            if (painted >= THEMES.length) {
                setReady(true)
            }
        }

        // Without a worker the render is sliced across idle callbacks so a slow
        // device never drops a long frame on the main thread.
        const paintOnMainThread = (theme: Theme, width: number, height: number, cssWidth: number, id: number) => {
            const renderer = createRenderer(width, height, cssWidth, theme)
            const advance = () => {
                if (cancelled || id !== generation) {
                    return
                }
                if (renderer.step(64)) {
                    paint(theme, width, height, renderer.pixels)
                    return
                }
                idleHandle = window.setTimeout(advance, 0)
            }
            advance()
        }

        const draw = () => {
            const cssWidth = container.clientWidth
            if (!cssWidth) {
                return
            }
            const scale = surfaceScale()
            const width = Math.max(1, Math.round(cssWidth * scale))
            const height = Math.max(1, Math.round(BAND.height * scale))
            const id = ++generation
            painted = 0

            for (const theme of THEMES) {
                if (worker) {
                    worker.postMessage({ id, theme, width, height, cssWidth })
                } else {
                    paintOnMainThread(theme, width, height, cssWidth, id)
                }
            }
        }

        try {
            worker = new Worker(new URL('./grain-worker.js', import.meta.url), { type: 'module' })
            worker.onmessage = (event: MessageEvent<WorkerReply>) => {
                const reply = event.data
                if (cancelled || reply.id !== generation || !reply.pixels) {
                    return
                }
                paint(reply.theme, reply.width, reply.height, reply.pixels)
            }
            worker.onerror = () => {
                worker?.terminate()
                worker = null
                draw()
            }
        } catch {
            worker = null
        }

        draw()

        // Only width changes the picture — the band height is fixed — so mobile
        // browsers collapsing their toolbar do not trigger a re-render.
        let lastWidth = container.clientWidth
        const scheduleRedraw = () => {
            const width = container.clientWidth
            if (width === lastWidth) {
                return
            }
            lastWidth = width
            window.clearTimeout(resizeTimer)
            resizeTimer = window.setTimeout(draw, 150)
        }

        window.addEventListener('resize', scheduleRedraw, { passive: true })

        return () => {
            cancelled = true
            window.removeEventListener('resize', scheduleRedraw)
            window.clearTimeout(resizeTimer)
            window.clearTimeout(idleHandle)
            worker?.terminate()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={`noisy-gradient${ready ? ' is-ready' : ''}`}
            style={{ height: `${BAND.height}px` }}
            aria-hidden="true"
        >
            {THEMES.map((theme) => (
                <canvas
                    key={theme}
                    data-theme={theme}
                    ref={(element) => {
                        canvasRefs.current[theme] = element
                    }}
                />
            ))}
        </div>
    )
}
