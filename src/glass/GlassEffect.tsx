
import { JSX, RefObject, useEffect, useId, useRef, useState } from "react";
import './glass-effect.css';

export type GlassData = {
    id: string;
    filterNode: JSX.Element;
    classes: string;
    mode: GlassMode;
    radius: number;
};

type GlassModifiers = {
    increaseBlur?: boolean;
}

type GlassMeasurement = {
    width: number | undefined;
    height: number | undefined;
    radius: number;
}

export type GlassOptions = {
    increaseBlur?: boolean;
    // bump this whenever the element's layout changes for a reason we can't observe
    updateKey?: string;
}

export enum GlassMode {
    Liquid,
    Blurred,
}

// Owns the glass filter for one element: re-measures on mount, on resize and once a
// second, and only rebuilds the filter when the measurement actually changed.
export function useGlassEffect(ref: RefObject<HTMLDivElement | null>, options?: GlassOptions): GlassData | undefined {
    // useId is stable across renders and unique per element; strip the punctuation
    // React wraps it in so the result is safe inside an SVG url(#...) reference.
    const id = 'glass-distortion-' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const signatureRef = useRef<string | undefined>(undefined);
    const [glassEffect, setGlassEffect] = useState<GlassData | undefined>(undefined);

    const increaseBlur = options?.increaseBlur;
    const updateKey = options?.updateKey;

    useEffect(() => {
        const update = () => {
            const measurement = measureGlass(ref);
            const signature = `${measurement.width}x${measurement.height}@${measurement.radius}:${increaseBlur}`;

            if (signature === signatureRef.current) return;
            signatureRef.current = signature;

            setGlassEffect(generateSvg(id, measurement, { increaseBlur }));
        };

        // measureGlass forces a layout, and scroll can fire several times per frame,
        // so coalesce bursts of events down to a single measurement per frame.
        let frame: number | null = null;
        const scheduleUpdate = () => {
            if (frame !== null) return;

            frame = requestAnimationFrame(() => {
                frame = null;
                update();
            });
        };

        update();

        // the element keeps settling for a few frames after a layout change
        const timeouts = [100, 200, 300, 400, 500].map(delay => setTimeout(update, delay));
        const interval = setInterval(update, 2000);

        window.addEventListener('resize', scheduleUpdate, { passive: true });
        window.addEventListener('scroll', scheduleUpdate, { passive: true });

        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            timeouts.forEach(clearTimeout);
            clearInterval(interval);
            window.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
        };
    }, [ref, id, increaseBlur, updateKey]);

    return glassEffect;
}

export function supportsLiquidGlass(): boolean {
    const navigatorWithUserAgent = navigator as Navigator & {
        userAgentData?: {
            brands: Array<{ brand: string; version: string }>;
        };
    };
    
    return !!navigatorWithUserAgent.userAgentData && 
        navigatorWithUserAgent.userAgentData.brands.some(brand => brand.brand === 'Chromium')
}

function measureGlass(ref: RefObject<HTMLDivElement | null>): GlassMeasurement {
    const element = ref.current
    const rect = element?.getBoundingClientRect()

    let radius = 15
    if (element !== null && element !== undefined && typeof window !== 'undefined') {
        radius = parseInt(window.getComputedStyle(element).getPropertyValue('border-top-left-radius').slice(0, -2), 10)
    }

    if (!Number.isFinite(radius)) {
        radius = 15
    }

    return { width: rect?.width, height: rect?.height, radius }
}

function generateSvg(id: string, measurement: GlassMeasurement, modifiers?: GlassModifiers): GlassData {
    const filter = calculateFilter(measurement.width, measurement.height, measurement.radius)

    const isChromium = supportsLiquidGlass()

    return {
        id: `url(#${id})`,
        classes: isChromium ? 'glass-effect' : 'blurred-effect',
        mode: isChromium ? GlassMode.Liquid : GlassMode.Blurred,
        radius: measurement.radius,
        filterNode: (
            <svg className="effect-svg" xmlns="http://www.w3.org/2000/svg" >
                <defs>
                <filter id={id} colorInterpolationFilters="sRGB"  x="0%" y="0%" width="100%" height="100%">
                    <feImage x="0" y="0" width="100%" height="100%" result="map" href={filter} ></feImage>
                    <feDisplacementMap in="SourceGraphic" in2="map" id="redchannel" xChannelSelector="R" yChannelSelector="B" result="dispRed" scale="-180" ></feDisplacementMap>
                    <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 1 0" result="red" ></feColorMatrix>

                    <feDisplacementMap in="SourceGraphic" in2="map" id="greenchannel" xChannelSelector="R" yChannelSelector="B" result="dispGreen" scale="-180" ></feDisplacementMap>
                    <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0
                            0 1 0 0 0
                            0 0 0 0 0
                            0 0 0 1 0" result="green" ></feColorMatrix>
                    <feDisplacementMap in="SourceGraphic" in2="map" id="bluechannel" xChannelSelector="R" yChannelSelector="B" result="dispBlue" scale="-180" ></feDisplacementMap>
                    <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0
                            0 0 0 0 0
                            0 0 1 0 0
                            0 0 0 1 0" result="blue" ></feColorMatrix>
                    <feBlend in="red" in2="green" mode="screen" result="rg" ></feBlend>
                    <feBlend in="rg" in2="blue" mode="screen" result="output" ></feBlend>
                    <feGaussianBlur in="output" stdDeviation={modifiers?.increaseBlur ? "3.5" : "1.2"} ></feGaussianBlur>
                </filter>
                </defs>
            </svg>
        )
    }
}


function calculateFilter(width: number | undefined, height: number | undefined, radius: number | undefined): string {
    const config = {
        width: width ?? 1152,
        height: height ?? 1000,
        radius: radius ?? 16,
        border: 0.07,
        lightness: 50,
        alpha: 0.93,
        blur: 11,
        blend: 'difference'
    }

    const border = Math.min(config.width, config.height) * (config.border * 0.5)
    const kids = `
        <svg class="displacement-image" viewBox="0 0 ${config.width} ${
            config.height
        }" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#0000"/>
                <stop offset="100%" stop-color="red"/>
                </linearGradient>
                <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0000"/>
                <stop offset="100%" stop-color="blue"/>
                </linearGradient>
            </defs>
            <!-- backdrop -->
            <rect x="0" y="0" width="${config.width}" height="${
            config.height
        }" fill="black"></rect>
            <!-- red linear -->
            <rect x="0" y="0" width="${config.width}" height="${config.height}" rx="${
            config.radius
        }" fill="url(#red)" />
            <!-- blue linear -->
            <rect x="0" y="0" width="${config.width}" height="${config.height}" rx="${
            config.radius
        }" fill="url(#blue)" style="mix-blend-mode: ${config.blend}" />
            <!-- block out distortion -->
            <rect x="${border}" y="${
            Math.min(config.width, config.height) * (config.border * 0.5)
        }" width="${config.width - border * 2}" height="${
            config.height - border * 2
        }" rx="${config.radius}" fill="hsl(0 0% ${config.lightness}% / ${
            config.alpha
        }" style="filter:blur(${config.blur}px)" />
            </svg>
            <div class="label">
            <span>displacement image</span>
            <svg viewBox="0 0 97 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M74.568 0.553803C74.0753 0.881909 73.6295 1.4678 73.3713 2.12401C73.1367 2.70991 72.3858 4.67856 71.6584 6.50658C70.9544 8.35803 69.4526 11.8031 68.3498 14.1936C66.1441 19.0214 65.839 20.2167 66.543 21.576C67.4581 23.3337 69.4527 23.9196 71.3064 22.9821C72.4797 22.3728 74.8965 19.5839 76.9615 16.4435C78.8387 13.5843 78.8387 13.6077 78.1113 18.3418C77.3369 23.4275 76.4687 26.2866 74.5915 30.0364C73.254 32.7316 71.8461 34.6299 69.218 37.3485C65.9563 40.6999 62.2254 42.9732 57.4385 44.4965C53.8718 45.6449 52.3935 45.8324 47.2546 45.8324C43.3594 45.8324 42.1158 45.7386 39.9805 45.2933C32.2604 43.7466 25.3382 40.9577 19.4015 36.9735C15.0839 34.0909 12.5028 31.7004 9.80427 27.9975C6.80073 23.9196 4.36038 17.2403 3.72682 11.475C3.37485 8.1471 3.1402 7.32683 2.43624 7.13934C0.770217 6.71749 0.183578 7.77211 0.0193217 11.5219C-0.26226 18.5996 2.55356 27.1304 7.17619 33.1066C13.8403 41.7545 25.432 48.4103 38.901 51.2696C41.6465 51.8555 42.2566 51.9023 47.4893 51.9023C52.3935 51.9023 53.426 51.832 55.5144 51.3867C62.2723 49.9337 68.5375 46.6292 72.949 42.1998C76.0464 39.1296 78.1113 36.2939 79.8946 32.7081C82.1942 28.0912 83.5317 23.3103 84.2591 17.17C84.3999 15.8576 84.6111 14.7795 84.7284 14.7795C84.8223 14.7795 85.4559 15.1311 86.1364 15.5763C88.037 16.7716 90.3835 17.8965 93.5748 19.0918C96.813 20.3339 97.3996 20.287 96.4141 18.9512C94.9123 16.9122 90.055 11.5219 87.1219 8.63926C84.0949 5.66288 83.8368 5.33477 83.5552 4.1864C83.3909 3.48332 83.0155 2.68649 82.6401 2.31151C82.0065 1.6553 80.4109 1.04595 79.9885 1.30375C79.8712 1.37406 79.2845 1.11626 78.6744 0.717845C77.2431 -0.172727 75.7413 -0.243024 74.568 0.553803Z" fill="currentColor"></path>
            </svg>
        </div>
    `

    if (typeof document !== 'undefined') {
        const debugPen = document.createElement('div');
        debugPen.innerHTML = kids

        const svgEl = debugPen.querySelector('.displacement-image')!
        const serialized = new XMLSerializer().serializeToString(svgEl)
        const encoded = encodeURIComponent(serialized)
        const dataUri = `data:image/svg+xml,${encoded}`

        return dataUri
    }
    
    // Fallback pro server-side rendering
    return 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E'
}