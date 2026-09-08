import React, { ReactNode, forwardRef, useCallback, useEffect, useRef, useSyncExternalStore } from "react"
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

function subscribeToScroll(onStoreChange: () => void) {
    window.addEventListener('scroll', onStoreChange);

    return () => {
        window.removeEventListener('scroll', onStoreChange);
    };
}

const isScrolled = () => window.scrollY > 0;

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
            } catch {
                // ignore if ref can't be assigned
            }
        }
    }, [ref]);
    const floatingNav = useSyncExternalStore(subscribeToScroll, isScrolled, () => false);
    const glassEffect = useGlassEffect(localRef, { updateKey: String(floatingNav) });
    const theme = floatingNav ? props.floatingTheme : props.fixedTheme;

    const { setTheme } = props;

    useEffect(() => {
        setTheme?.(theme);
    }, [setTheme, theme])

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