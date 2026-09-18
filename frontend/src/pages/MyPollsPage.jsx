import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import useCreatorPollAnalytics from '../hooks/useCreatorPollAnalytics'

function formatCreatedDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function MyPollsPage() {
  const {
    polls,
    setPolls,
    pollAnalytics,
    setPollAnalytics,
    isLoading,
    error,
  } = useCreatorPollAnalytics()
  const [closingPollId, setClosingPollId] = useState(null)
  const [closeError, setCloseError] = useState('')
  const [deletingPollId, setDeletingPollId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')

  const handleClosePoll = async (pollId) => {
    setCloseError('')

    try {
      const closedPoll = await api.patch(`/api/polls/${pollId}/close`)
      setPolls((current) => current.map((poll) => (
        poll.id === pollId ? { ...poll, ...closedPoll, isActive: false } : poll
      )))
      setClosingPollId(null)
    } catch (requestError) {
      setCloseError(requestError.message || 'Unable to close this poll right now.')
    }
  }

  const handleDeletePoll = async (pollId) => {
    setDeleteError('')

    try {
      await api.del(`/api/polls/${pollId}`)
      setPolls((current) => current.filter((poll) => poll.id !== pollId))
      setPollAnalytics((current) => {
        const next = { ...current }
        delete next[pollId]
        return next
      })
      setDeletingPollId(null)
      setDeleteSuccess('Poll deleted successfully.')
    } catch (requestError) {
      setDeleteError(requestError.message || 'Unable to delete this poll right now.')
    }
  }

  if (isLoading) {
    return (
      <div className="page-shell narrow management-page">
        <section className="card-surface dashboard-loading" aria-live="polite">
          <span className="eyebrow">My polls</span>
          <h1>Loading your polls</h1>
          <p>Gathering your polls, responses, and activity.</p>
          <div className="loading-bar" aria-hidden="true" />
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell narrow management-page">
        <section className="card-surface dashboard-error" role="alert">
          <span className="eyebrow">My polls</span>
          <h1>We could not load your polls.</h1>
          <p>{error}</p>
          <Link to="/polls/new" className="primary-btn compact">Create a new poll</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page-shell dashboard-page management-page">
      <section className="dashboard-list" aria-label="Polls created by you">
        <div className="dashboard-list-heading">
          <div>
            <span className="eyebrow">My polls</span>
            <h1>Your polls</h1>
            <p>Open, review, and manage the polls you have created.</p>
          </div>
          <Link to="/polls/new" className="primary-btn compact">Create Poll</Link>
        </div>

        {polls.length === 0 ? (
        <section className="card-surface dashboard-empty">
          <div className="empty-signal" aria-hidden="true">+</div>
          <span className="eyebrow">Ready to launch</span>
          <h2>No polls yet</h2>
          <p>Create your first live poll and start collecting responses from your audience.</p>
          <Link to="/polls/new" className="primary-btn">Create Your First Poll</Link>
        </section>
      ) : (
        <>
            <div className="dashboard-list-heading">
              <h2>Active and recent polls</h2>
              <span className="creation-count">{polls.length} {polls.length === 1 ? 'poll' : 'polls'}</span>
            </div>
            {deleteSuccess && <p className="form-message" role="status">{deleteSuccess}</p>}

            <div className="poll-card-grid">
              {polls.map((poll) => {
                const votes = pollAnalytics[poll.id]?.totalVotes || 0

                return (
                  <article className="poll-card card-surface" key={poll.id}>
                    <div className="poll-card-topline">
                      <span className={`status-pill ${poll.isActive ? 'success' : 'amber'}`}>
                        {poll.isActive ? 'Active' : 'Closed'}
                      </span>
                      <span className="poll-date">{formatCreatedDate(poll.createdAt)}</span>
                    </div>

                    <h3>{poll.question}</h3>

                    <div className="poll-card-meta">
                      <span>{votes} votes</span>
                      <span>{poll.options?.length || 0} options</span>
                    </div>

                    <div className="poll-card-options">
                      {poll.options?.slice(0, 3).map((option) => (
                        <span className="poll-card-option" key={option.id}>
                          <span className="option-badge" data-tone="violet">{option.id}</span>
                          {option.text}
                        </span>
                      ))}
                      {poll.options?.length > 3 && <span className="poll-card-more">+{poll.options.length - 3} more</span>}
                    </div>

                    <div className="poll-card-actions">
                      <Link to={`/polls/${poll.id}`} className="secondary-btn compact">View Poll</Link>
                      <Link to={`/polls/${poll.id}/results`} className="secondary-btn compact">Results</Link>
                      {poll.isActive && closingPollId !== poll.id && (
                        <button
                          type="button"
                          className="close-poll-btn"
                          onClick={() => {
                            setClosingPollId(poll.id)
                            setCloseError('')
                          }}
                        >
                          Close Poll
                        </button>
                      )}
                      {deletingPollId !== poll.id && (
                        <button
                          type="button"
                          className="delete-poll-btn"
                          onClick={() => {
                            setDeletingPollId(poll.id)
                            setDeleteError('')
                          }}
                        >
                          Delete Poll
                        </button>
                      )}
                    </div>

                    {closingPollId === poll.id && (
                      <div className="close-confirmation" role="alertdialog" aria-label={`Close ${poll.question}`}>
                        <strong>Close this poll?</strong>
                        <span>New votes will no longer be accepted.</span>
                        <div className="close-confirmation-actions">
                          <button type="button" className="primary-btn compact" onClick={() => handleClosePoll(poll.id)}>
                            Confirm close
                          </button>
                          <button type="button" className="secondary-btn compact" onClick={() => setClosingPollId(null)}>
                            Keep open
                          </button>
                        </div>
                      </div>
                    )}
                    {closeError && closingPollId === poll.id && <p className="form-error">{closeError}</p>}
                    {deletingPollId === poll.id && (
                      <div className="delete-confirmation" role="alertdialog" aria-label={`Delete ${poll.question}`}>
                        <strong>Delete this poll?</strong>
                        <span>This action cannot be undone.</span>
                        <div className="close-confirmation-actions">
                          <button type="button" className="delete-poll-btn confirm" onClick={() => handleDeletePoll(poll.id)}>
                            Delete Poll
                          </button>
                          <button type="button" className="secondary-btn compact" onClick={() => setDeletingPollId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {deleteError && deletingPollId === poll.id && <p className="form-error">{deleteError}</p>}
                  </article>
                )
              })}
            </div>
        </>
        )}
      </section>
    </div>
  )
}
