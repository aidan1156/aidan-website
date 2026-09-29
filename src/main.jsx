import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { initializeTheme } from './theme'
import './main.css'

initializeTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = resolve
    image.onerror = resolve
    image.src = src
  })
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen')
  const bar = loadingScreen?.querySelector('.loading-bar')
  if (!loadingScreen || !bar) {
    return
  }

  // Freeze the bar where it is, then stretch it to fill the whole track
  const { left, right } = getComputedStyle(bar)
  bar.style.left = left
  bar.style.right = right
  bar.style.animation = 'none'
  bar.getBoundingClientRect()
  bar.style.transition = 'left .3s ease-out, right .3s ease-out'
  bar.style.left = '0'
  bar.style.right = '0'

  setTimeout(() => {
    loadingScreen.classList.add('done')
    loadingScreen.addEventListener('transitionend', () => loadingScreen.remove(), { once: true })
  }, 300)
}

const assetsLoaded = Promise.all([
  document.fonts.load('1em NType82'),
  document.fonts.load('1em "Open Sans"'),
  loadImage('./images/header.jpeg'),
]).catch(() => {})

// Never leave someone stuck on the loading screen if something hangs
const timeout = new Promise((resolve) => setTimeout(resolve, 15000))

Promise.race([assetsLoaded, timeout]).then(hideLoadingScreen)
