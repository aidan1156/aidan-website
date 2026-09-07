import { useRef } from "react";
import { useGlassEffect } from "./GlassEffect";
import { resolveTheme, getSystemTheme, getStoredThemePreference } from "../theme";

export function GlassContainer({ children, className, style, updateKey, increaseBlur }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, updateKey?: string, increaseBlur?: boolean }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const glassEffect = useGlassEffect(ref, { increaseBlur, updateKey });

    const themePreference = getStoredThemePreference()
    const systemTheme = getSystemTheme()

    const theme = resolveTheme(themePreference, systemTheme)

    return (
        <div 
            className={`${theme} ${glassEffect?.classes} ${className}`} 
            style={{ '--glass-id': glassEffect?.id, ...style } as React.CSSProperties} 
            ref={ref}
        >
            {children}
            {glassEffect?.filterNode}
        </div>
    )
}
