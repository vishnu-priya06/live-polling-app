import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'

const initialForm = {
  email: '',
  password: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validationErrors = useMemo(() => {
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    }

    return nextErrors
  }, [form])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setApiError('')
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
    setErrors((current) => ({ ...current, [name]: validationErrors[name] || '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setTouched({ email: true, password: true })
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0 || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setApiError('')

    try {
      const response = await api.post('/api/auth/login', {
        email: form.email.trim(),
        password: form.password,
      })

      setSession(response?.token, response?.user)

      const destination = location.state?.from
      const returnPath = destination
        ? `${destination.pathname}${destination.search || ''}${destination.hash || ''}`
        : '/dashboard'

      navigate(returnPath, { replace: true })
    } catch (error) {
      setApiError(error.message || 'Unable to sign in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell narrow">
      <section className="card-surface auth-panel">
        <div className="auth-copy">
          <div className="live-label"><span className="live-dot" /> LIVE NOW</div>
          <span className="eyebrow">WELCOME BACK</span>
          <h1 className="auth-headline" aria-label="Back to the pulse.">
            <span>Back</span> <span>to</span> <span>the</span> <span>pulse.</span>
          </h1>
          <p>Your live conversations are waiting.</p>

          <div className="signal-visual" aria-label="Live participation signal visualization">
            <div className="signal-line signal-line-one" />
            <div className="signal-line signal-line-two" />
            <div className="signal-node node-one" />
            <div className="signal-node node-two" />
            <div className="signal-node node-three" />
          </div>

          <div className="pulse-stats">
            <div><strong>LIVE NOW</strong><span>Signals moving</span></div>
            <div><strong>REAL-TIME VOTES</strong><span>Ready when you are</span></div>
            <div><strong>SHARED SIGNALS</strong><span>One living conversation</span></div>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-heading">
            <span className="form-kicker">Sign in</span>
            <h2>Pick up where you left off.</h2>
            <p>Your live conversations are waiting.</p>
          </div>

          <label className="field-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(touched.email && errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {touched.email && errors.email && <p id="login-email-error" className="field-error">{errors.email}</p>}

          <label className="field-label" htmlFor="login-password">Password</label>
          <div className="password-wrap">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(touched.password && errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {touched.password && errors.password && <p id="login-password-error" className="field-error">{errors.password}</p>}

          {apiError && <p className="form-error" role="alert">{apiError}</p>}

          <button type="submit" className="primary-btn auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="auth-switch">
            New to the pulse? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </section>
    </div>
  )
}
