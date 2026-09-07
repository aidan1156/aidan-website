const STORAGE_KEY = 'theme-preference'

export function getSystemTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getStoredThemePreference() {
  if (typeof window === 'undefined') {
    return 'device'
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)

  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'device' ? storedTheme : 'device'
}

export function saveThemePreference(themePreference) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, themePreference)
}

export function resolveTheme(themePreference, systemTheme = 'light') {
  if (themePreference === 'dark' || themePreference === 'light') {
    return themePreference
  }

  return systemTheme
}

export function applyThemeToBody(themePreference, systemTheme = 'light') {
  if (typeof document === 'undefined') {
    return
  }

  const resolvedTheme = resolveTheme(themePreference, systemTheme)

  document.body.classList.toggle('dark', resolvedTheme === 'dark')
}

export function initializeTheme() {
  const storedThemePreference = getStoredThemePreference()
  applyThemeToBody(storedThemePreference, getSystemTheme())
}