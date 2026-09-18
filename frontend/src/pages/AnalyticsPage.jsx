import useCreatorPollAnalytics from '../hooks/useCreatorPollAnalytics'

export default function AnalyticsPage() {
  const { analytics, isLoading, error } = useCreatorPollAnalytics()

  if (isLoading) return <div className="page-shell narrow"><section className="card-surface dashboard-loading"><span className="eyebrow">Analytics</span><h1>Loading analytics</h1><p>Calculating results from your polls.</p></section></div>
  if (error) return <div className="page-shell narrow"><section className="card-surface dashboard-error" role="alert"><span className="eyebrow">Analytics</span><h1>We could not load analytics.</h1><p>{error}</p></section></div>

  return (
    <div className="page-shell dashboard-page">
      <section className="dashboard-hero card-surface"><div className="dashboard-hero-copy"><span className="eyebrow">Analytics</span><h1>Poll performance</h1><p>Real vote counts calculated from your current polls.</p></div></section>
      <section className="stat-grid" aria-label="Analytics summary">
        <article className="stat-card card-surface"><div className="stat-value">{analytics.totalPolls}</div><div className="stat-label">Total Polls</div></article>
        <article className="stat-card card-surface"><div className="stat-value">{analytics.totalVotes}</div><div className="stat-label">Total Votes</div></article>
        <article className="stat-card card-surface"><div className="stat-value">{analytics.activePolls}</div><div className="stat-label">Active Polls</div></article>
      </section>
      <section className="dashboard-panel card-surface" aria-label="Votes per poll"><div className="panel-header-row"><div><span className="eyebrow">Votes per poll</span><h2>Top-performing polls</h2></div></div><div className="performance-list">{analytics.performance.length === 0 ? <p>No poll results are available yet.</p> : analytics.performance.map((metric) => <div className="performance-item" key={metric.id}><div className="performance-topline"><span className="performance-name">{metric.question}</span><span className="performance-value">{metric.votes} votes</span></div><div className="performance-bar-track"><span className="performance-bar" style={{ width: `${Math.max((metric.votes / analytics.maxVotes) * 100, 8)}%` }} /></div></div>)}</div></section>
    </div>
  )
}