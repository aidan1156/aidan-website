import { useSyncExternalStore } from 'react';
import { getStoredThemePreference, getSystemTheme, resolveTheme } from './theme';


function subscribe(onStoreChange: () => void) {
    if (typeof document === 'undefined') {
        return () => {};
    }

    const bodyObserver = new MutationObserver(onStoreChange);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
        bodyObserver.disconnect();
    };
}

const getSnapshot = () => document.body.classList.contains('dark');

const getServerSnapshot = () => resolveTheme(getStoredThemePreference(), getSystemTheme()) === 'dark';

export function useIsDarkTheme() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
