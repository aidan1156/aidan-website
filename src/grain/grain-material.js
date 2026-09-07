// Renders the noisy gradient that sits behind the top of the page.
//
// The picture is a single soft band of colour laid across a wavy contour line.
// Distance from that contour drives two things at once: how far along a colour
// ramp we sample (blue above, amber below) and how much of the colour survives
// a gaussian falloff. Everything outside the band stays transparent so the page
// background shows through untouched.
//
// Colour is mixed with the page background in linear light, which keeps the
// band vivid rather than muddy. Because the browser composites a canvas in
// sRGB, the pixels written here are the pre-composite values that land on the
// intended linear-light result once drawn over the background - see solve().

const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value))
const mix = (a, b, t) => a + (b - a) * t

const toLinear = (value) => {
    const x = value / 255
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

const toSrgb = (x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)

// Vertical colour ramps, sampled by distance from the contour. Stops are
// [position, r, g, b]. Only roughly 0.37..0.93 is ever visible - outside that
// the gaussian has already faded the band away - so the interesting colours are
// packed into that window.
const RAMPS = {
    light: [
        [0.00, 40, 92, 176],
        [0.30, 50, 108, 190],
        [0.42, 64, 124, 200],
        [0.54, 96, 138, 200],
        [0.63, 132, 142, 190],
        [0.70, 176, 140, 168],
        [0.78, 216, 138, 114],
        [0.86, 234, 138, 80],
        [0.93, 236, 112, 56],
        [1.00, 234, 96, 46],
    ],
    dark: [
        [0.00, 16, 40, 84],
        [0.30, 24, 66, 118],
        [0.42, 34, 92, 152],
        [0.54, 58, 112, 168],
        [0.63, 104, 128, 168],
        [0.70, 152, 140, 150],
        [0.78, 198, 142, 118],
        [0.86, 228, 148, 90],
        [0.93, 238, 122, 56],
        [1.00, 240, 100, 42],
    ],
}

// paper must track --primary in main.css: it is the colour the band is mixed
// against. amountBase/amountEdge weight the band across the viewport, dimmest
// behind the centred content column and strongest out at the edges.
const THEMES = {
    light: { paper: [249, 245, 239], amountBase: 0.32, amountEdge: 0.56, grain: 32, chroma: 13 },
    dark: { paper: [23, 26, 32], amountBase: 0.20, amountEdge: 0.58, grain: 40, chroma: 16 },
}

// Band geometry, in CSS pixels from the top of the document.
export const BAND = {
    height: 900,
    center: 455,
    wave: 34,
    falloff: 112,
    spread: 1.9,
}

function sampleRamp(ramp, t) {
    const position = clamp(t)
    let index = 1
    while (index < ramp.length - 1 && ramp[index][0] < position) index++
    const [aPos, ar, ag, ab] = ramp[index - 1]
    const [bPos, br, bg, bb] = ramp[index]
    const span = bPos - aPos
    const local = span > 0 ? (position - aPos) / span : 0
    const eased = local * local * (3 - 2 * local)
    return [mix(ar, br, eased), mix(ag, bg, eased), mix(ab, bb, eased)]
}

// The smallest alpha at which target is still reachable by compositing some
// in-gamut colour over paper. Below it the colour would have to sit outside
// 0..255 and the band would clip instead of glow.
function minimumAlpha(target, paper) {
    let required = 0
    for (let i = 0; i < 3; i++) {
        const needed = target[i] > paper[i]
            ? (target[i] - paper[i]) / Math.max(1e-6, 255 - paper[i])
            : (paper[i] - target[i]) / Math.max(1e-6, paper[i])
        if (needed > required) required = needed
    }
    return required
}

// One point of the band, resolved all the way to what the canvas must store.
function solve(x, y, theme, cssWidth) {
    const ramp = RAMPS[theme] ?? RAMPS.dark
    const settings = THEMES[theme] ?? THEMES.dark
    const paper = settings.paper

    const worldY = y * BAND.height
    const contour = BAND.center + Math.sin((x + 0.15) * Math.PI * 2) * BAND.wave
    const delta = (worldY - contour) / BAND.falloff

    // Narrow viewports have no room either side of the content column, so the
    // edge bias is flattened out and the band lifted to stay visible.
    const narrow = clamp((760 - cssWidth) / 360)
    const edge = Math.pow(Math.abs(x * 2 - 1), 1.5) * (1 - 0.55 * narrow)
    const lift = 1 + 0.3 * narrow

    const amount = clamp(
        Math.exp(-delta * delta * BAND.spread)
        * (settings.amountBase + settings.amountEdge * edge)
        * lift,
    )
    if (amount <= 0.002) {
        return null
    }

    // The edges run a little warmer than the middle, so the band does not read
    // as one flat ribbon of colour stretched across the page.
    const colour = sampleRamp(ramp, 0.65 + delta * 0.24 + 0.055 * (edge - 0.45))
    // Where the band should land once mixed with the page in linear light.
    const target = colour.map((channel, i) => toSrgb(mix(toLinear(paper[i]), toLinear(channel), amount)))

    // Grain rides on top of the mix, so the alpha has to leave room for its
    // full excursion or the speckle flattens against the gamut edge.
    const swing = settings.grain * amount * 1.3
    const alpha = clamp(Math.max(
        amount,
        minimumAlpha(target.map((v) => v + swing), paper),
        minimumAlpha(target.map((v) => v - swing), paper),
    ), 0.002, 1)

    // final = paper*(1-alpha) + base*alpha, so invert for the stored colour.
    const base = target.map((channel, i) => (channel - paper[i] * (1 - alpha)) / alpha)

    return {
        base,
        alpha,
        // Grain is attenuated where the band is faint, then divided out of the
        // alpha so the amplitude that survives compositing is what we asked for.
        grainGain: (settings.grain * amount) / alpha,
        chromaGain: (settings.chroma * amount) / alpha,
    }
}

// The band is smooth, so it is evaluated once on a coarse grid and bilinearly
// interpolated per pixel. That keeps the expensive sin/pow/exp work off the hot
// loop and turns a ~1s full-page render into a couple of hundred ms.
const FIELD_COLS = 256
const FIELD_ROWS = 256
const FIELD_STRIDE = 6

export function buildField(cssWidth, theme) {
    const field = new Float32Array(FIELD_COLS * FIELD_ROWS * FIELD_STRIDE)
    for (let row = 0; row < FIELD_ROWS; row++) {
        for (let col = 0; col < FIELD_COLS; col++) {
            const sample = solve(col / (FIELD_COLS - 1), row / (FIELD_ROWS - 1), theme, cssWidth)
            if (!sample) {
                continue
            }
            const k = (row * FIELD_COLS + col) * FIELD_STRIDE
            field[k] = sample.base[0]
            field[k + 1] = sample.base[1]
            field[k + 2] = sample.base[2]
            field[k + 3] = sample.alpha * 255
            field[k + 4] = sample.grainGain
            field[k + 5] = sample.chromaGain
        }
    }
    return field
}

// Progressive renderer: step() fills a slice of rows so a large surface can be
// produced without blocking for the whole frame. Grain is built from a 2x2
// window of uniform randoms shared between adjacent rows, which clumps it very
// slightly instead of leaving it pixel-independent, then shaped by tanh so the
// highlights roll off like film rather than clipping.
export function createRenderer(width, height, cssWidth, theme) {
    const field = buildField(cssWidth, theme)

    let seed = 721391
    const random = () => {
        seed ^= seed << 13
        seed ^= seed >>> 17
        seed ^= seed << 5
        return (seed >>> 0) / 4294967296
    }

    let previous = new Float32Array((width + 1) * 3)
    let current = new Float32Array((width + 1) * 3)
    for (let i = 0; i < previous.length; i++) previous[i] = random()

    const pixels = new Uint8ClampedArray(width * height * 4)
    let nextRow = 0

    function step(rowCount = 16) {
        const end = Math.min(height, nextRow + rowCount)
        for (let y = nextRow; y < end; y++) {
            for (let i = 0; i < current.length; i++) current[i] = random()

            const fy = (y * (FIELD_ROWS - 1)) / Math.max(1, height - 1)
            const row0 = Math.min(FIELD_ROWS - 2, Math.floor(fy))
            const ty = fy - row0

            for (let x = 0; x < width; x++) {
                const fx = (x * (FIELD_COLS - 1)) / Math.max(1, width - 1)
                const col0 = Math.min(FIELD_COLS - 2, Math.floor(fx))
                const tx = fx - col0

                const a = (row0 * FIELD_COLS + col0) * FIELD_STRIDE
                const b = a + FIELD_STRIDE
                const c = a + FIELD_COLS * FIELD_STRIDE
                const d = c + FIELD_STRIDE
                const p = (y * width + x) * 4

                const alpha = mix(mix(field[a + 3], field[b + 3], tx), mix(field[c + 3], field[d + 3], tx), ty)
                if (alpha <= 0.5) {
                    pixels[p] = 0
                    pixels[p + 1] = 0
                    pixels[p + 2] = 0
                    pixels[p + 3] = 0
                    continue
                }

                const red = mix(mix(field[a], field[b], tx), mix(field[c], field[d], tx), ty)
                const green = mix(mix(field[a + 1], field[b + 1], tx), mix(field[c + 1], field[d + 1], tx), ty)
                const blue = mix(mix(field[a + 2], field[b + 2], tx), mix(field[c + 2], field[d + 2], tx), ty)
                const grainGain = mix(mix(field[a + 4], field[b + 4], tx), mix(field[c + 4], field[d + 4], tx), ty)
                const chromaGain = mix(mix(field[a + 5], field[b + 5], tx), mix(field[c + 5], field[d + 5], tx), ty)

                const k = x * 3
                const luma = (previous[k] + previous[k + 3] + current[k] + current[k + 3] - 2) * 1.7320508075688772
                const shaped = Math.tanh(0.52 * luma)
                const grain = (shaped - 0.215 * shaped * shaped + 0.040760815) / 0.434222832
                const chroma = (previous[k + 1] + previous[k + 4] + current[k + 1] + current[k + 4] - 2) * 1.7320508075688772

                const light = grainGain * grain
                const tint = chromaGain * chroma

                pixels[p] = red + light + tint * 0.6
                pixels[p + 1] = green + light * 0.92
                pixels[p + 2] = blue + light * 0.86 - tint * 0.5
                pixels[p + 3] = alpha
            }
            const swap = previous
            previous = current
            current = swap
        }
        nextRow = end
        return nextRow === height
    }

    return { pixels, step }
}

export function render(width, height, cssWidth, theme) {
    const renderer = createRenderer(width, height, cssWidth, theme)
    renderer.step(height)
    return renderer.pixels
}
