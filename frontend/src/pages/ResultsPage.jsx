import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'

export default function ResultsPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await api.get(`/api/polls/${id}/results`)
        setResult(data)
      } catch (err) {
        setError('Results are not available for this poll yet.')
      }
    }

    loadResults()
  }, [id])

  return (
    <div className="page-shell narrow">
      <section className="card-surface panel-header">
        <div>
          <span className="eyebrow">Results</span>
          <h1>Live outcome</h1>
        </div>
        <Link to={`/polls/${id}`} className="secondary-btn compact">
          Back to poll
        </Link>
      </section>

      <section className="card-surface form-panel">
        {error ? (
          <p className="form-error">{error}</p>
        ) : result ? (
          <>
            <div className="results-summary">
              <div>
                <span className="eyebrow">Live results</span>
                <p className="field-label">Current vote distribution</p>
              </div>
              <strong>{Object.values(result.counts || {}).reduce((sum, count) => sum + (Number(count) || 0), 0)} total votes</strong>
            </div>
            <div className="result-list">
              {Object.entries(result.counts || {}).map(([optionId, count], index, entries) => {
                const totalVotes = entries.reduce((sum, [, value]) => sum + (Number(value) || 0), 0)
                const percentage = totalVotes ? Math.round((Number(count) / totalVotes) * 100) : 0

                return (
                <div className="result-row" key={optionId}>
                  <div className="result-meta">
                    <span className="option-badge" data-tone={index % 2 ? 'violet' : 'emerald'}>{optionId}</span>
                    <span>Option {optionId}</span>
                  </div>
                  <div className="result-progress-wrap">
                    <div className="result-progress" style={{ width: `${percentage}%` }} />
                  </div>
                  <strong>{count} <small>{percentage}%</small></strong>
                </div>
                )
              })}
            </div>
          </>
        ) : (
          <p>Loading results…</p>
        )}
      </section>
    </div>
  )
}
