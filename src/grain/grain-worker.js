import { render } from './grain-material'

// Each message renders one full surface and hands the pixels back by transfer,
// so nothing large is copied across the boundary.
self.onmessage = (event) => {
    const { id, width, height, cssWidth, theme } = event.data
    try {
        const pixels = render(width, height, cssWidth, theme)
        self.postMessage({ id, theme, width, height, pixels }, [pixels.buffer])
    } catch (error) {
        self.postMessage({ id, theme, error: String(error) })
    }
}
