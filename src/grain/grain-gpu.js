// Draws the band on the GPU. The coarse field goes up as two textures and the
// fragment shader generates the grain per pixel, which takes a full-page
// surface from a couple of hundred milliseconds to well under a frame.
//
// The noise here is hash-based rather than the CPU renderer's row buffers, so
// the two paths do not produce identical speckle - only the same character.

import { GAIN_SCALE } from './grain-material'

const VERTEX = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 resolution;
uniform sampler2D colours;
uniform sampler2D gains;

out vec4 outColour;

float hash(uvec2 p, uint seed) {
    uint n = p.x * 1973u + p.y * 9277u + seed * 26699u;
    n = (n ^ (n >> 15u)) * 2246822519u;
    n = (n ^ (n >> 13u)) * 3266489917u;
    return float(n ^ (n >> 16u)) / 4294967295.0;
}

// Four samples over a 2x2 window, matching how the CPU renderer shares randoms
// between neighbouring rows so the grain clumps very slightly.
float fleck(uvec2 p, uint seed) {
    return (hash(p, seed) + hash(p + uvec2(1u, 0u), seed)
        + hash(p + uvec2(0u, 1u), seed) + hash(p + uvec2(1u, 1u), seed) - 2.0) * 1.732050808;
}

void main() {
    vec2 uv = vec2(gl_FragCoord.x / resolution.x, 1.0 - gl_FragCoord.y / resolution.y);
    vec4 field = texture(colours, uv);
    vec2 gain = texture(gains, uv).rg * (255.0 / ${GAIN_SCALE}.0);
    uvec2 p = uvec2(gl_FragCoord.xy);

    float t = tanh(0.52 * fleck(p, 71u));
    float grain = (t - 0.215 * t * t + 0.040760815) / 0.434222832;
    float chroma = fleck(p, 293u);

    vec3 rgb = field.rgb * 255.0
        + gain.x * grain * vec3(1.0, 0.92, 0.86)
        + gain.y * chroma * vec3(0.6, 0.0, -0.5);

    // The drawing buffer is premultiplied, so fold alpha in after clamping.
    float alpha = field.a;
    outColour = vec4(clamp(rgb / 255.0, 0.0, 1.0) * alpha, alpha);
}`

export function createGrainGpu(canvas) {
    let gl
    try {
        gl = canvas.getContext('webgl2', {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: 'low-power',
        })
    } catch {
        return null
    }
    if (!gl) {
        return null
    }

    const compile = (type, source) => {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader) ?? 'shader failed to compile')
        }
        return shader
    }

    const createTexture = () => {
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        return texture
    }

    let program
    let vertexArray
    let buffer
    let colourTexture
    let gainTexture
    let resolutionLocation

    try {
        const vertexShader = compile(gl.VERTEX_SHADER, VERTEX)
        const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT)
        program = gl.createProgram()
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program) ?? 'program failed to link')
        }

        // One oversized triangle covers the viewport without an index buffer.
        vertexArray = gl.createVertexArray()
        gl.bindVertexArray(vertexArray)
        buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const position = gl.getAttribLocation(program, 'position')
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
        gl.bindVertexArray(null)

        colourTexture = createTexture()
        gainTexture = createTexture()

        gl.useProgram(program)
        gl.uniform1i(gl.getUniformLocation(program, 'colours'), 0)
        gl.uniform1i(gl.getUniformLocation(program, 'gains'), 1)
        resolutionLocation = gl.getUniformLocation(program, 'resolution')
    } catch {
        return null
    }

    return {
        maxSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),

        draw(width, height, packed) {
            canvas.width = width
            canvas.height = height
            gl.viewport(0, 0, width, height)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, colourTexture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, packed.cols, packed.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, packed.colours)

            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, gainTexture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, packed.cols, packed.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, packed.gains)

            gl.useProgram(program)
            gl.uniform2f(resolutionLocation, width, height)
            gl.bindVertexArray(vertexArray)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
            gl.bindVertexArray(null)
        },

        dispose() {
            gl.deleteTexture(colourTexture)
            gl.deleteTexture(gainTexture)
            gl.deleteBuffer(buffer)
            gl.deleteVertexArray(vertexArray)
            gl.deleteProgram(program)
        },
    }
}
