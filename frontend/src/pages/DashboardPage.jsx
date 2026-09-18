import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import useCreatorPollAnalytics from '../hooks/useCreatorPollAnalytics'

function getGreeting(userName) {
	const hour = new Date().getHours()

	if (hour < 12) return `Good morning${userName ? `, ${userName}` : ''} 👋`
	if (hour < 18) return `Good afternoon${userName ? `, ${userName}` : ''} 👋`
	return `Good evening${userName ? `, ${userName}` : ''} 👋`
}

export default function DashboardPage() {
	const { user } = useAuth()
	const { polls, analytics, isLoading, error } = useCreatorPollAnalytics()
	const closedPolls = analytics.totalPolls - analytics.activePolls

	if (isLoading) {
		return <div className="page-shell narrow"><section className="card-surface dashboard-loading" aria-live="polite"><span className="eyebrow">Creator dashboard</span><h1>Loading your workspace</h1><p>Gathering your polls, responses, and activity.</p><div className="loading-bar" aria-hidden="true" /></section></div>
	}

	if (error) {
		return <div className="page-shell narrow"><section className="card-surface dashboard-error" role="alert"><span className="eyebrow">Creator dashboard</span><h1>We could not load your dashboard.</h1><p>{error}</p><Link to="/polls/new" className="primary-btn compact">Create a new poll</Link></section></div>
	}

	return (
		<div className="page-shell dashboard-page">
			<section className="dashboard-hero card-surface">
				<div className="dashboard-hero-copy">
					<span className="eyebrow">Creator dashboard</span>
					<h1>{getGreeting(user?.name || user?.email || 'Creator')}</h1>
					<p>Create, manage, and understand your live polls from one place.</p>
					<span className="dashboard-live-mark"><span className="live-dot" /> Live workspace</span>
				</div>
				<Link to="/polls/new" className="primary-btn"><span aria-hidden="true">+</span> Create Poll</Link>
			</section>

			<section className="stat-grid" aria-label="Poll summary">
				<article className="stat-card card-surface"><div className="stat-icon indigo" aria-hidden="true">◔</div><div className="stat-value">{analytics.totalPolls}</div><div className="stat-label">Total Polls</div><div className="stat-meta">Created by you</div></article>
				<article className="stat-card card-surface"><div className="stat-icon emerald" aria-hidden="true">◉</div><div className="stat-value">{analytics.activePolls}</div><div className="stat-label">Active Polls</div><div className="stat-meta">Currently open for votes</div></article>
				<article className="stat-card card-surface"><div className="stat-icon amber" aria-hidden="true">◌</div><div className="stat-value">{closedPolls}</div><div className="stat-label">Closed Polls</div><div className="stat-meta">No longer accepting votes</div></article>
				<article className="stat-card card-surface"><div className="stat-icon violet" aria-hidden="true">▣</div><div className="stat-value">{analytics.totalVotes}</div><div className="stat-label">Total Votes</div><div className="stat-meta">Collected across your polls</div></article>
			</section>

			{polls.length === 0 ? (
				<section className="card-surface dashboard-empty"><div className="empty-signal" aria-hidden="true">+</div><span className="eyebrow">Ready to launch</span><h2>No polls yet</h2><p>Create your first live poll and start collecting responses from your audience.</p><Link to="/polls/new" className="primary-btn">Create Your First Poll</Link></section>
			) : (
				<>
					<section className="dashboard-panel card-surface" aria-label="Poll performance"><div className="panel-header-row"><div><span className="eyebrow">Performance</span><h2>High-level poll performance</h2></div><Link to="/analytics" className="secondary-btn compact">View analytics</Link></div><div className="performance-list">{analytics.performance.slice(0, 4).map((metric) => <div className="performance-item" key={metric.id}><div className="performance-topline"><span className="performance-name">{metric.question}</span><span className="performance-value">{metric.votes} votes</span></div><div className="performance-bar-track"><span className="performance-bar" style={{ width: `${Math.max((metric.votes / analytics.maxVotes) * 100, 8)}%` }} /></div></div>)}</div></section>
					<section className="dashboard-list" aria-label="Recent polls"><div className="dashboard-list-heading"><div><span className="eyebrow">Recent activity</span><h2>Recent polls</h2></div><Link to="/polls/mine" className="secondary-btn compact">View all polls</Link></div><div className="poll-card-grid">{polls.slice(0, 2).map((poll) => <article className="poll-card card-surface" key={poll.id}><div className="poll-card-topline"><span className={`status-pill ${poll.isActive ? 'success' : 'amber'}`}>{poll.isActive ? 'Active' : 'Closed'}</span><span className="poll-date">{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(poll.createdAt))}</span></div><h3>{poll.question}</h3><div className="poll-card-meta"><span>{analytics.performance.find((metric) => metric.id === poll.id)?.votes || 0} votes</span><span>{poll.options?.length || 0} options</span></div><div className="poll-card-actions"><Link to={`/polls/${poll.id}`} className="secondary-btn compact">View Poll</Link><Link to={`/polls/${poll.id}/results`} className="secondary-btn compact">Results</Link></div></article>)}</div></section>
				</>
			)}
		</div>
	)
}