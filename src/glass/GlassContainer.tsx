import { useEffect, useRef, useState } from "react";
import { GlassData, RegisterGlassEffect, UpdateGlassEffect } from "./GlassEffect";
import { resolveTheme, getSystemTheme, getStoredThemePreference } from "../theme";

export function GlassContainer({ children, className, style, updateKey, increaseBlur }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, updateKey?: string, increaseBlur?: boolean }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [glassEffect, setGlassEffect] = useState<GlassData | undefined>(undefined);

    // const { resolvedTheme } = useTheme()
    // const theme = resolvedTheme ?? 'light'

    const themePreference = getStoredThemePreference()
    const systemTheme = getSystemTheme()

    const theme = resolveTheme(themePreference, systemTheme)

    const updateGlass = () => {
        setGlassEffect(UpdateGlassEffect(ref, glassEffect, increaseBlur));
    };

    useEffect(() => {
        updateGlass();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                updateGlass();
            }, i * 100);
        }
    }, [updateKey]);

    useEffect(() => {
        setGlassEffect(RegisterGlassEffect(ref));
        window.addEventListener('resize', updateGlass);

        return () => {
            window.removeEventListener('resize', updateGlass);
        };
    }, []);

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