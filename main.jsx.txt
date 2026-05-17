import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { initializeOfflineSync } from './services/offlineSyncService.js'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import App from './App.jsx'

// Initialize offline sync capabilities
initializeOfflineSync()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('App is ready to work offline.')
  },
  onNeedRefresh() {
    console.info('New version available. Refresh the page to update.')
  },
})
