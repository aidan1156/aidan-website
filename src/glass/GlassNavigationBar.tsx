import React, { ReactNode, forwardRef, useCallback, useEffect, useRef, useState } from "react"
import { useGlassEffect } from './GlassEffect';
import './glass-navigation-bar.css';
type Props = {
    children: ReactNode,
    floatingTheme: string,
    fixedTheme: string,
    setTheme?: (theme: string) => void,
    className?: string,
    innerClassName?: string,
    placeholder?: boolean,
}

export const GlassNavigationBar = forwardRef<HTMLDivElement, Props>(function GlassNavigationBar(props, ref) {
    // local default ref we always use inside the component
    const localRef = useRef<HTMLDivElement | null>(null);

    // callback ref mirrors node to localRef and to the forwarded ref (if provided)
    const handleRef = useCallback((node: HTMLDivElement | null) => {
        localRef.current = node;
        if (!ref) return;
        if (typeof ref === 'function') {
            ref(node);
        } else {
            try {
                // forwarded object ref
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            } catch (e) {
                // ignore if ref can't be assigned
            }
        }
    }, [ref]);
    const [floatingNav, setFloatingNav] = useState(false);
    const glassEffect = useGlassEffect(localRef, { updateKey: String(floatingNav) });
    const theme = floatingNav ? props.floatingTheme : props.fixedTheme;

    const handleScroll = () => {
        setFloatingNav(window.scrollY > 0);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);

        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        props.setTheme?.(theme);
    }, [floatingNav, props.floatingTheme, props.fixedTheme])

    return (
        <div className={`glass-nav-wrapper ${theme} ${props.placeholder ? 'placeholder' : ''} ${props.className || ''}`}>
            <nav ref={handleRef}
                className={`${theme} ${floatingNav ? `floating ${glassEffect?.classes}` : ''} increase-clarity ${props.innerClassName || ''}`}
                style={{ '--glass-id': glassEffect?.id } as React.CSSProperties}
            >
                {props.children}
                {glassEffect?.filterNode}
            </nav>
        </div>
    )
});

GlassNavigationBar.displayName = 'GlassNavigationBar';