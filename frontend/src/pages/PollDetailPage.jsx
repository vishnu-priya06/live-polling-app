import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000]
const VOTER_FINGERPRINT_KEY = 'live-polling-voter-fingerprint'
const VOTED_POLLS_KEY = 'live-polling-voted-polls'

function getVoterFingerprint() {
  const storedFingerprint = localStorage.getItem(VOTER_FINGERPRINT_KEY)
  if (storedFingerprint) {
    return storedFingerprint
  }

  const fingerprint = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `browser-${Date.now()}-${Math.random().toString(36).slice(2)}`

  localStorage.setItem(VOTER_FINGERPRINT_KEY, fingerprint)
  return fingerprint
}

function readStoredVote(pollId) {
  try {
    const storedVotes = JSON.parse(localStorage.getItem(VOTED_POLLS_KEY) || '{}')
    return storedVotes[pollId] || null
  } catch {
    return null
  }
}

function rememberVote(pollId, optionId = null) {
  try {
    const storedVotes = JSON.parse(localStorage.getItem(VOTED_POLLS_KEY) || '{}')
    storedVotes[pollId] = { optionId }
    localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(storedVotes))
  } catch {
    // The backend remains the source of truth if browser storage is unavailable.
  }
}

function getWebSocketUrl(pollId) {
  const configuredBase = import.meta.env.VITE_WS_BASE_URL

  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, '')}/ws/polls/${pollId}`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws/polls/${pollId}`
}

function parseRealtimeMessage(message) {
  try {
    const parsed = JSON.parse(message)

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { kind: 'unknown' }
    }

    if (parsed.type === 'poll_closed') {
      return { kind: 'closed', pollId: parsed.pollId }
    }

    const entries = Object.entries(parsed)
    if (entries.some(([, count]) => typeof count !== 'number' || !Number.isFinite(count))) {
      return { kind: 'unknown' }
    }

    return { kind: 'counts', counts: Object.fromEntries(entries) }
  } catch {
    return { kind: 'unknown' }
  }
}

export default function PollDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [poll, setPoll] = useState(null)
  const [selectedOption, setSelectedOption] = useState(() => readStoredVote(id)?.optionId || '')
  const [voteRecord, setVoteRecord] = useState(() => readStoredVote(id))
  const [resultCounts, setResultCounts] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const socketRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectAttemptRef = useRef(0)
  const hasVoted = Boolean(voteRecord)
  const isOwner = Boolean(user?.id && poll?.createdBy === user.id)
  const totalVotes = Object.values(resultCounts).reduce((sum, value) => sum + value, 0)

  useEffect(() => {
    const storedVote = readStoredVote(id)
    setSelectedOption(storedVote?.optionId || '')
    setVoteRecord(storedVote)
    setError('')
    setSuccess('')
  }, [id])

  useEffect(() => {
    let disposed = false

    const loadPoll = async () => {
      try {
        const data = await api.get(`/api/polls/${id}`)

        if (disposed) {
          return
        }

        setPoll(data)

        try {
          const results = await api.get(`/api/polls/${id}/results`)
          if (!disposed) {
            setResultCounts(results.counts || {})
          }
        } catch {
          // The poll remains usable when its initial counts are unavailable.
        }

        const connectRealtime = () => {
          if (disposed) {
            return
          }

          const attempt = reconnectAttemptRef.current
          setRealtimeStatus(attempt === 0 ? 'connecting' : 'reconnecting')

          const socket = new WebSocket(getWebSocketUrl(id))
          socketRef.current = socket

          socket.onopen = () => {
            reconnectAttemptRef.current = 0
            setRealtimeStatus('connected')
          }

          socket.onmessage = (event) => {
            const realtimeMessage = parseRealtimeMessage(event.data)

            if (realtimeMessage.kind === 'counts') {
              setResultCounts(realtimeMessage.counts)
            }

            if (realtimeMessage.kind === 'closed' && realtimeMessage.pollId === id) {
              setPoll((current) => current ? { ...current, isActive: false } : current)
              setSelectedOption('')
              setError('')
              setSuccess('This poll has been closed. Existing results remain available.')
            }
          }

          socket.onerror = () => {
            setRealtimeStatus('error')
          }

          socket.onclose = () => {
            if (disposed) {
              return
            }

            socketRef.current = null

            if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
              setRealtimeStatus('offline')
              return
            }

            const delay = RECONNECT_DELAYS[reconnectAttemptRef.current]
            reconnectAttemptRef.current += 1
            setRealtimeStatus('reconnecting')
            reconnectTimerRef.current = window.setTimeout(connectRealtime, delay)
          }
        }

        connectRealtime()
      } catch (err) {
        if (!disposed) {
          setError('This poll could not be loaded. Check the poll ID and try again.')
          setRealtimeStatus('offline')
        }
      }
    }

    loadPoll()

    return () => {
      disposed = true
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null

      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [id])

  const handleVote = async () => {
    if (!selectedOption && !hasVoted) {
      setError('Choose an option before voting.')
      return
    }

    if (hasVoted || isSubmitting || !poll?.isActive) {
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post(`/api/polls/${id}/vote`, {
        optionId: selectedOption,
        voterFingerprint: getVoterFingerprint(),
      })

      const votedOption = response?.optionId || selectedOption
      rememberVote(id, votedOption)
      setVoteRecord({ optionId: votedOption })
      setSuccess('Vote submitted. Live results will update shortly.')
      setError('')
    } catch (err) {
      if (err.message.toLowerCase().includes('already voted')) {
        rememberVote(id)
        setVoteRecord({ optionId: null })
        setSelectedOption('')
        setError('')
        setSuccess('Your vote for this poll has already been recorded.')
      } else {
        setError(err.message || 'Vote submission failed. Please try again.')
        setSuccess('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePoll = async () => {
    setIsDeleting(true)
    setError('')

    try {
      await api.del(`/api/polls/${id}`)
      navigate('/polls/mine', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to delete this poll right now.')
      setIsDeleting(false)
    }
  }

  if (!poll) {
    return (
      <div className="page-shell narrow">
        <div className="card-surface loading-panel">
          {error ? <p className="form-error">{error}</p> : <p>Loading poll…</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell narrow">
      <section className="card-surface panel-header">
        <div>
          <span className="eyebrow">Poll details</span>
          <h1>{poll.question}</h1>
        </div>
        <div className="poll-status-group">
          <span className={`status-pill ${poll.isActive ? 'success' : 'amber'}`}>
            {poll.isActive ? 'Active' : 'Poll Closed'}
          </span>
          <span className={`realtime-status ${realtimeStatus}`} role="status">
            <span className="realtime-dot" />
            {realtimeStatus === 'connected' && 'Live'}
            {realtimeStatus === 'connecting' && 'Connecting'}
            {realtimeStatus === 'reconnecting' && 'Reconnecting'}
            {realtimeStatus === 'error' && 'Realtime error'}
            {realtimeStatus === 'offline' && 'Offline'}
          </span>
        </div>
      </section>

      <section className="card-surface form-panel">
        {!poll.isActive && (
          <div className="closed-poll-banner" role="status">
            <strong>Poll Closed</strong>
            <span>New votes are no longer accepted. You can still view the live results.</span>
          </div>
        )}

        <div className="option-list">
          {poll.options?.map((option) => (
            <label className={`option-card ${selectedOption === option.id ? 'selected' : ''}`} key={option.id}>
              <input
                type="radio"
                name="pollOption"
                value={option.id}
                checked={selectedOption === option.id}
                disabled={hasVoted || isSubmitting || !poll.isActive}
                onChange={() => setSelectedOption(option.id)}
              />
              <span className="option-badge" data-tone="indigo">{option.id}</span>
              <span>{option.text}</span>
              {selectedOption === option.id && !hasVoted && <span className="selection-label">Selected</span>}
            </label>
          ))}
        </div>

        <div className="live-results" aria-live="polite">
          <div className="form-section-header">
            <span className="field-label">Live responses</span>
            <span className="results-caption">Updates in real time</span>
          </div>
          {poll.options?.map((option) => {
            const count = resultCounts[option.id] || 0
            const percentage = totalVotes ? Math.round((count / totalVotes) * 100) : 0

            return (
              <div className="live-result-row" key={option.id}>
                <span className="live-result-label">{option.text}</span>
                <div className="result-progress-wrap">
                  <div className="result-progress" style={{ width: `${percentage}%` }} />
                </div>
                <strong>{count}</strong>
              </div>
            )
          })}
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={handleVote}
            disabled={isSubmitting || hasVoted || !poll.isActive}
          >
            {isSubmitting ? 'Submitting vote...' : hasVoted ? 'Vote recorded' : 'Submit vote'}
          </button>
          <Link to={`/polls/${id}/results`} className="secondary-btn">
            View results
          </Link>
          {isOwner && !showDeleteConfirmation && (
            <button type="button" className="delete-poll-btn" onClick={() => setShowDeleteConfirmation(true)}>
              Delete Poll
            </button>
          )}
        </div>

        {isOwner && showDeleteConfirmation && (
          <div className="delete-confirmation" role="alertdialog" aria-label={`Delete ${poll.question}`}>
            <strong>Delete this poll?</strong>
            <span>This action cannot be undone.</span>
            <div className="close-confirmation-actions">
              <button type="button" className="delete-poll-btn confirm" onClick={handleDeletePoll} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Poll'}
              </button>
              <button type="button" className="secondary-btn compact" onClick={() => setShowDeleteConfirmation(false)} disabled={isDeleting}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {hasVoted && <p className="vote-state">Your response is recorded for this poll.</p>}
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-message">{success}</p>}
      </section>
    </div>
  )
}
