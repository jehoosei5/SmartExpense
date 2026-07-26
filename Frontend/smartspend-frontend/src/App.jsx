import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import AIChat from './pages/AIChat'
import Sync from './pages/Sync'
import Profile from './pages/Profile'

// Protected route — redirects to login if no token
function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><AIChat /></PrivateRoute>} />
        <Route path="/sync" element={<PrivateRoute><Sync /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App