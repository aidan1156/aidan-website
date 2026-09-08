import { useEffect, useRef, useState } from 'react'
import { BAND, createRenderer, packField } from './grain-material'
import { createGrainGpu } from './grain-gpu'

import './noisy-gradient.css'

const THEMES = ['light', 'dark'] as const

type Theme = (typeof THEMES)[number]

// "field" hands a coarse grid to the GPU shader; "pixels" renders the whole
// surface on the CPU. Chosen once, for both surfaces, from WebGL2 support.
type Mode = 'field' | 'pixels'

type PackedField = {
    colours: Uint8Array
    gains: Uint8Array
    cols: number
    rows: number
}

type WorkerReply = {
    id: number
    theme: Theme
    kind: Mode
    width: number
    height: number
    packed?: PackedField
    pixels?: Uint8ClampedArray
    error?: string
}

type Surface = {
    theme: Theme
    canvas: HTMLCanvasElement
    gpu: ReturnType<typeof createGrainGpu>
    context: CanvasRenderingContext2D | null
}

// Theme lives on the body, set before React mounts, so it can be read straight
// from the DOM rather than threaded through as a prop.
const activeTheme = (): Theme => (document.body.classList.contains('dark') ? 'dark' : 'light')

// Grain wants device pixels, so the surface is oversampled. On the CPU path the
// cost is quadratic in scale, so anything below a 2x display settles for less.
const surfaceScale = (accelerated: boolean) => {
    const ratio = window.devicePixelRatio || 1
    return accelerated ? Math.min(Math.max(2, ratio), 2.5) : (ratio >= 2 ? 2 : 1.5)
}

export function NoisyGradient() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) {
            return
        }

        let cancelled = false
        let worker: Worker | null = null
        let generation = 0
        let resizeTimer: number | undefined
        let idleHandle: number | undefined

        // The canvases are created here rather than rendered by React. A surface
        // that has held a WebGL context can never hand out a 2d one, so falling
        // back means swapping the element - which is only safe on elements React
        // is not also trying to manage.
        const addCanvas = (theme: Theme) => {
            const canvas = document.createElement('canvas')
            canvas.dataset.theme = theme
            container.appendChild(canvas)
            return canvas
        }

        const surfaces: Surface[] = THEMES.map((theme) => ({
            theme,
            canvas: addCanvas(theme),
            gpu: null,
            context: null,
        }))

        // WebGL2 is all-or-nothing across the two surfaces: mixing a shader
        // surface with a CPU one would show two different grains side by side.
        let mode: Mode = 'field'
        for (const surface of surfaces) {
            surface.gpu = createGrainGpu(surface.canvas)
            if (!surface.gpu) {
                mode = 'pixels'
            }
        }
        if (mode === 'pixels') {
            for (const surface of surfaces) {
                surface.gpu?.dispose()
                surface.gpu = null
                surface.canvas.remove()
                surface.canvas = addCanvas(surface.theme)
                surface.context = surface.canvas.getContext('2d')
            }
        }
        container.dataset.backend = mode === 'field' ? 'webgl2' : 'canvas2d'

        // The page reveals its gradient as soon as the theme on screen has one,
        // without waiting for the surface nobody is looking at.
        const reveal = (theme: Theme) => {
            if (theme === activeTheme()) {
                setReady(true)
            }
        }

        const paintField = (surface: Surface, width: number, height: number, packed: PackedField) => {
            surface.gpu?.draw(width, height, packed)
            reveal(surface.theme)
        }

        const paintPixels = (surface: Surface, width: number, height: number, pixels: Uint8ClampedArray) => {
            surface.canvas.width = width
            surface.canvas.height = height
            surface.context?.putImageData(new ImageData(pixels, width, height), 0, 0)
            reveal(surface.theme)
        }

        // Without a worker the CPU render is sliced across timeouts so a slow
        // device never drops a long frame on the main thread.
        const renderHere = (surface: Surface, width: number, height: number, cssWidth: number, id: number) => {
            if (mode === 'field') {
                paintField(surface, width, height, packField(cssWidth, surface.theme))
                return
            }
            const renderer = createRenderer(width, height, cssWidth, surface.theme)
            const advance = () => {
                if (cancelled || id !== generation) {
                    return
                }
                if (renderer.step(64)) {
                    paintPixels(surface, width, height, renderer.pixels)
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
            const scale = surfaceScale(mode === 'field')
            const limit = surfaces[0].gpu?.maxSize ?? 16384
            const width = Math.min(limit, Math.max(1, Math.round(cssWidth * scale)))
            const height = Math.min(limit, Math.max(1, Math.round(BAND.height * scale)))
            const id = ++generation

            // The theme on screen is rendered first so nothing waits on the other.
            const visible = activeTheme()
            const ordered = [...surfaces].sort(
                (a, b) => Number(b.theme === visible) - Number(a.theme === visible),
            )

            for (const surface of ordered) {
                if (worker) {
                    worker.postMessage({ id, theme: surface.theme, kind: mode, width, height, cssWidth })
                } else {
                    renderHere(surface, width, height, cssWidth, id)
                }
            }
        }

        try {
            worker = new Worker(new URL('./grain-worker.js', import.meta.url), { type: 'module' })
            worker.onmessage = (event: MessageEvent<WorkerReply>) => {
                const reply = event.data
                if (cancelled || reply.id !== generation) {
                    return
                }
                const surface = surfaces.find((candidate) => candidate.theme === reply.theme)
                if (!surface) {
                    return
                }
                if (reply.kind === 'field' && reply.packed) {
                    paintField(surface, reply.width, reply.height, reply.packed)
                } else if (reply.pixels) {
                    paintPixels(surface, reply.width, reply.height, reply.pixels)
                }
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

        // Losing the context blanks a surface, so rebuild and repaint once the
        // browser hands it back.
        const onLost = (event: Event) => event.preventDefault()
        const onRestored = () => {
            for (const surface of surfaces) {
                surface.gpu?.dispose()
                surface.gpu = createGrainGpu(surface.canvas)
            }
            draw()
        }
        for (const surface of surfaces) {
            surface.canvas.addEventListener('webglcontextlost', onLost)
            surface.canvas.addEventListener('webglcontextrestored', onRestored)
        }

        // Only width changes the picture - the band height is fixed - so mobile
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
            for (const surface of surfaces) {
                surface.canvas.removeEventListener('webglcontextlost', onLost)
                surface.canvas.removeEventListener('webglcontextrestored', onRestored)
                surface.gpu?.dispose()
                surface.canvas.remove()
            }
            delete container.dataset.backend
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={`noisy-gradient${ready ? ' is-ready' : ''}`}
            style={{ height: `${BAND.height}px` }}
            aria-hidden="true"
        />
    )
}
