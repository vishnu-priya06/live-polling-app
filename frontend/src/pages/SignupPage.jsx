import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState({})

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const validationErrors = useMemo(() => {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Full name is required.'
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
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

    setTouched({ name: true, email: true, password: true, confirmPassword: true })
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    setApiError('')
    setSuccessMessage('')

    try {
      const response = await api.post('/api/auth/signup', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      setSession(response?.token, response?.user)

      setSuccessMessage('Signup successful! Redirecting you to your dashboard...')

      setTimeout(() => {
        navigate('/dashboard')
      }, 800)
    } catch (error) {
      setApiError(error.message || 'Unable to create your account right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell narrow">
      <section className="card-surface auth-panel">
        <div className="auth-copy">
          <div className="live-label"><span className="live-dot" /> LIVE NOW</div>
          <span className="eyebrow">JOIN THE PULSE</span>
          <h1 className="auth-headline" aria-label="Join the pulse.">
            <span>Join</span> <span>the</span> <span>pulse.</span>
          </h1>
          <p>Create your space in the conversation and start making your voice count.</p>

          <div className="signal-visual" aria-label="Live participation signal visualization">
            <div className="signal-line signal-line-one" />
            <div className="signal-line signal-line-two" />
            <div className="signal-node node-one" />
            <div className="signal-node node-two" />
            <div className="signal-node node-three" />
          </div>

          <div className="pulse-stats">
            <div><strong>LIVE NOW</strong><span>Opinions in motion</span></div>
            <div><strong>REAL-TIME VOTES</strong><span>Shared signals</span></div>
            <div><strong>SHARED SIGNALS</strong><span>One living conversation</span></div>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-heading">
            <span className="form-kicker">Create your access</span>
            <h2>Make your voice count.</h2>
            <p>Set up your profile and step into the conversation.</p>
          </div>

          <label className="field-label" htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Jane Doe"
            aria-invalid={Boolean(touched.name && errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {touched.name && errors.name && <p id="name-error" className="field-error">{errors.name}</p>}

          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            aria-invalid={Boolean(touched.email && errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {touched.email && errors.email && <p id="email-error" className="field-error">{errors.email}</p>}

          <label className="field-label" htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Minimum 6 characters"
              aria-invalid={Boolean(touched.password && errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
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
          {touched.password && errors.password && <p id="password-error" className="field-error">{errors.password}</p>}

          <label className="field-label" htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-wrap">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && <p id="confirm-password-error" className="field-error">{errors.confirmPassword}</p>}

          {apiError && <p className="form-error">{apiError}</p>}
          {successMessage && <p className="form-message">{successMessage}</p>}

          <button type="submit" className="primary-btn auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="auth-switch">
            Already part of the pulse? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  )
}
