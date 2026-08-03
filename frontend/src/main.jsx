import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import BookingPage from './pages/BookingPage.jsx'
import { captureAttribution } from './lib/attribution'
import './styles/index.css'

// First paint is the only moment the ad params are guaranteed present, and both
// pages can be the landing page — capture before either renders.
captureAttribution()

// Two pages, no router dependency: /book is the standalone scheduler, anything
// else is the marketing page.
const isBookingPage = /^\/book\/?$/.test(window.location.pathname)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isBookingPage ? <BookingPage /> : <App />}</React.StrictMode>,
)
