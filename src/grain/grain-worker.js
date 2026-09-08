import { packField, render } from './grain-material'

// Two kinds of job. "field" is the coarse grid the GPU shader expands into
// grain; "pixels" is the whole surface rendered on the CPU for machines
// without WebGL2. Both hand their buffers back by transfer.
self.onmessage = (event) => {
    const { id, theme, kind, width, height, cssWidth } = event.data
    try {
        if (kind === 'field') {
            const packed = packField(cssWidth, theme)
            self.postMessage(
                { id, theme, kind, width, height, packed },
                [packed.colours.buffer, packed.gains.buffer],
            )
            return
        }
        const pixels = render(width, height, cssWidth, theme)
        self.postMessage({ id, theme, kind, width, height, pixels }, [pixels.buffer])
    } catch (error) {
        self.postMessage({ id, theme, kind, error: String(error) })
    }
}
