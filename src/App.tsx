import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { User } from './types'

// Import Halaman yang sudah dipecah
import LandingPage from './pages/Landing'
import DocsPage from './pages/Docs'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'

import './App.css'

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('clawmanager_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="/app" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}