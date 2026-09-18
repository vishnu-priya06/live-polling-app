import useCreatorPollAnalytics from '../hooks/useCreatorPollAnalytics'

export default function AnalyticsPage() {
  const { analytics, isLoading, error } = useCreatorPollAnalytics()

  if (isLoading) return <div className="page-shell narrow analytics-page"><section className="card-surface dashboard-loading"><span className="eyebrow">Analytics</span><h1>Loading analytics</h1><p>Calculating results from your polls.</p><div className="loading-bar" aria-hidden="true" /></section></div>
  if (error) return <div className="page-shell narrow analytics-page"><section className="card-surface dashboard-error" role="alert"><span className="eyebrow">Analytics</span><h1>We could not load analytics.</h1><p>{error}</p></section></div>

  return (
    <div className="page-shell dashboard-page analytics-page">
      <section className="dashboard-hero card-surface"><div className="dashboard-hero-copy"><span className="eyebrow">Analytics</span><h1>Poll performance</h1><p>Real vote counts calculated from your current polls.</p></div></section>
      <section className="stat-grid" aria-label="Analytics summary">
        <article className="stat-card card-surface"><div className="stat-icon indigo" aria-hidden="true">◔</div><div className="stat-value">{analytics.totalPolls}</div><div className="stat-label">Total Polls</div><div className="stat-meta">Created by you</div></article>
        <article className="stat-card card-surface"><div className="stat-icon emerald" aria-hidden="true">◉</div><div className="stat-value">{analytics.activePolls}</div><div className="stat-label">Active Polls</div><div className="stat-meta">Currently open</div></article>
        <article className="stat-card card-surface"><div className="stat-icon amber" aria-hidden="true">◌</div><div className="stat-value">{analytics.totalPolls - analytics.activePolls}</div><div className="stat-label">Closed Polls</div><div className="stat-meta">No longer open</div></article>
        <article className="stat-card card-surface"><div className="stat-icon violet" aria-hidden="true">▣</div><div className="stat-value">{analytics.totalVotes}</div><div className="stat-label">Total Votes</div><div className="stat-meta">Across your polls</div></article>
      </section>
      <section className="dashboard-panel card-surface analytics-panel" aria-label="Votes per poll"><div className="panel-header-row"><div><span className="eyebrow">Votes per poll</span><h2>Top-performing polls</h2></div><span className="panel-note">Sorted by total votes</span></div><div className="performance-list">{analytics.performance.length === 0 ? <div className="analytics-empty"><div className="empty-signal" aria-hidden="true">◌</div><h3>No results yet</h3><p>Results will appear here after your polls receive votes.</p></div> : analytics.performance.map((metric) => <div className="performance-item" key={metric.id}><div className="performance-topline"><span className="performance-name">{metric.question}</span><span className="performance-value">{metric.votes} votes</span></div><div className="performance-bar-track"><span className="performance-bar" style={{ width: `${Math.max((metric.votes / analytics.maxVotes) * 100, 8)}%` }} /></div></div>)}</div></section>
    </div>
  )
}