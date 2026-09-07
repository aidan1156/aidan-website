import { useEffect, useState } from "react"
import { flushSync } from 'react-dom'
import { GlassNavigationBar } from "./glass/GlassNavigationBar"
import { ThemeSwitcher } from "./ThemeSwitcher"
import { applyThemeToBody, getStoredThemePreference, getSystemTheme, resolveTheme, saveThemePreference } from "./theme"
import { Header } from "./sections/Header"
import { Projects } from "./sections/Projects"
import { Experience } from "./sections/Experience"
import { CVSection } from "./sections/CV"
import { Achievements } from "./sections/Achievements"
import { Gallery } from "./sections/Gallery"

import './app.css'


function App() {
  const [themePreference, setThemePreference] = useState(getStoredThemePreference)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  const resolvedTheme = resolveTheme(themePreference, systemTheme)

  const [epicMode, setEpicMode] = useState(false)

  const updateThemePreference = (nextPreference, triggerElement) => {
    const commitThemePreference = () => {
      setThemePreference(nextPreference)
      applyThemeToBody(nextPreference, systemTheme)
    }

    const canAnimateTheme = typeof document.startViewTransition === 'function' && triggerElement instanceof HTMLElement

    if (!canAnimateTheme) {
      commitThemePreference()
      return
    }

    const elementRect = triggerElement.getBoundingClientRect()
    const originX = elementRect.left + elementRect.width / 2
    const originY = elementRect.top + elementRect.height / 2
    const radius = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(window.innerWidth - originX, originY),
      Math.hypot(originX, window.innerHeight - originY),
      Math.hypot(window.innerWidth - originX, window.innerHeight - originY),
    )

    document.documentElement.style.setProperty('--theme-transition-x', `${originX}px`)
    document.documentElement.style.setProperty('--theme-transition-y', `${originY}px`)
    document.documentElement.style.setProperty('--theme-transition-radius', `${radius}px`)

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        commitThemePreference()
      })
    })

    transition.finished.finally(() => {
      document.documentElement.style.removeProperty('--theme-transition-x')
      document.documentElement.style.removeProperty('--theme-transition-y')
      document.documentElement.style.removeProperty('--theme-transition-radius')
    })
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateSystemTheme = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    updateSystemTheme(mediaQuery)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemTheme)

      return () => {
        mediaQuery.removeEventListener('change', updateSystemTheme)
      }
    }

    mediaQuery.addListener(updateSystemTheme)

    return () => {
      mediaQuery.removeListener(updateSystemTheme)
    }
  }, [])

  useEffect(() => {
    saveThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    applyThemeToBody(themePreference, systemTheme)
  }, [themePreference, systemTheme])

  useEffect(() => {
    document.body.classList.toggle('epic-mode', epicMode)
  }, [epicMode])

  return (
    <div>
      <GlassNavigationBar floatingTheme={resolvedTheme} fixedTheme={resolvedTheme} className="navigation-bar" innerClassName="navigation-bar-inner">
        <h2>Aidan Baker</h2>
        <div className="navigation-links">
          <a href="#experience-section" className="hover-on-glass">Experience</a>
          <a href="#projects-section" className="hover-on-glass">Projects</a>
          <a href="#cv-section" className="hover-on-glass">CV</a>
        </div>
        <ThemeSwitcher value={themePreference} onChange={updateThemePreference} />
      </GlassNavigationBar>
      <div style={{opacity: 0}}>bruh</div>
      <main>
        <Header epicMode={epicMode} setEpicMode={(v) => {setEpicMode(v)}} />
        <Experience />
        <Projects />
        <Achievements />
        <CVSection />
        <Gallery />
      </main>
    </div>
  )
}

export default App
