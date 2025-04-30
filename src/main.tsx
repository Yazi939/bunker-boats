import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { authService, vehicleService, shiftService, fuelService } from './services/api'

// Initialize web API services globally
if (typeof window !== 'undefined') {
  window.api = {
    authService,
    vehicleService,
    shiftService,
    fuelService
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 