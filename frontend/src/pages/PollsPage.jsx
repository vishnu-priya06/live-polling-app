import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const SAMPLE_POLL_ID = '6aaba9be415d31293c3d04af'

export default function PollsPage() {
  const navigate = useNavigate()
  const [pollId, setPollId] = useState(SAMPLE_POLL_ID)
  const [poll, setPoll] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSamplePoll = async () => {
      try {
        const data = await api.get(`/api/polls/${SAMPLE_POLL_ID}`)
        setPoll(data)
      } catch (err) {
        setError('The sample poll could not be loaded yet. Enter a poll ID to try a different route.')
      }
    }

    loadSamplePoll()
  }, [])

  const openPoll = () => {
    if (!pollId.trim()) {
      setError('Enter a valid poll ID to continue.')
      return
    }

    navigate(`/polls/${pollId.trim()}`)
  }

  return (
    <div className="page-shell narrow">
      <section className="card-surface panel-header">
        <div>
          <span className="eyebrow">Poll directory</span>
          <h1>Browse live polls</h1>
        </div>
        <Link to="/polls/new" className="primary-btn compact">
          New poll
        </Link>
      </section>

      <section className="card-surface form-panel">
        <label className="field-label" htmlFor="pollId">Poll ID</label>
        <div className="inline-form">
          <input
            id="pollId"
            value={pollId}
            onChange={(event) => setPollId(event.target.value)}
            placeholder="Enter a poll id"
          />
          <button type="button" className="primary-btn" onClick={openPoll}>
            Open poll
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
      </section>

      {poll ? (
        <section className="card-surface poll-summary">
          <div className="summary-row">
            <div>
              <span className="eyebrow">Featured poll</span>
              <h2>{poll.question}</h2>
            </div>
            <span className="status-pill success">{poll.isActive ? 'Active' : 'Closed'}</span>
          </div>

          <div className="option-list compact-list">
            {poll.options?.map((option) => (
              <div className="option-item" key={option.id}>
                <span className="option-badge" data-tone="violet">{option.id}</span>
                <span>{option.text}</span>
              </div>
            ))}
          </div>

          <div className="inline-actions">
            <Link to={`/polls/${poll.id}`} className="primary-btn compact">
              Vote now
            </Link>
            <Link to={`/polls/${poll.id}/results`} className="secondary-btn compact">
              Results
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
