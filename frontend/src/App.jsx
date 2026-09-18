import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import HomePage from './pages/HomePage'
import PollsPage from './pages/PollsPage'
import CreatePollPage from './pages/CreatePollPage'
import PollDetailPage from './pages/PollDetailPage'
import ResultsPage from './pages/ResultsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MyPollsPage from './pages/MyPollsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

function App() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">LP</div>
          <div>
            <span className="brand-name">Live Polling</span>
            <small>Realtime community feedback</small>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/polls/mine">My Polls</NavLink>
              <NavLink to="/polls/new">Create Poll</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
              <div className="nav-user-block" title={user?.email || 'Authenticated user'}>
                <span className="nav-user-avatar">{(user?.name || user?.email || 'M').charAt(0).toUpperCase()}</span>
                <span className="nav-user-name">{user?.name || user?.email || 'Member'}</span>
              </div>
              <button type="button" className="nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/polls">Polls</NavLink>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup">Sign up</NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/polls/new"
            element={(
              <ProtectedRoute>
                <CreatePollPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/polls/mine"
            element={(
              <ProtectedRoute>
                <MyPollsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/analytics"
            element={(
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            )}
          />
          <Route path="/polls/:id" element={<PollDetailPage />} />
          <Route path="/polls/:id/results" element={<ResultsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
