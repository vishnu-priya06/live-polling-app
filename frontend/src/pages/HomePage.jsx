import { Link } from 'react-router-dom'

const featureCards = [
  {
    title: 'Launch a live poll',
    text: 'Create instant, engaging questions and collect real-time responses from your audience.',
    tone: 'indigo',
  },
  {
    title: 'Track reactions',
    text: 'Watch live updates and share the current momentum on the results view in real time.',
    tone: 'violet',
  },
  {
    title: 'Keep it simple',
    text: 'A clean polling flow for events, product feedback, classroom polls, and team decisions.',
    tone: 'coral',
  },
]

export default function HomePage() {
  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Live Polling</span>
          <h1>Turn every decision into a shared moment.</h1>
          <p>
            Spark engagement with fast, polished polls that update in real time and let
            your audience vote without friction.
          </p>

          <div className="cta-row">
            <Link to="/polls" className="primary-btn">
              Explore polls
            </Link>
            <Link to="/polls/new" className="secondary-btn">
              Create a poll
            </Link>
          </div>

          <div className="status-strip">
            <span className="status-pill success">Live updates</span>
            <span className="status-pill amber">Realtime voting</span>
            <span className="status-pill violet">Responsive UI</span>
          </div>
        </div>

        <div className="hero-preview card-surface">
          <div className="mini-card">
            <span className="mini-label">Audience pulse</span>
            <strong>82% engagement</strong>
            <div className="bar-chart">
              <span style={{ width: '68%' }} className="bar bar-indigo" />
              <span style={{ width: '54%' }} className="bar bar-violet" />
              <span style={{ width: '88%' }} className="bar bar-coral" />
            </div>
          </div>

          <div className="poll-preview">
            <div className="poll-header">
              <span className="dot dot-emerald" />
              <span>Open poll</span>
            </div>
            <h3>What should we launch next?</h3>
            <ul>
              <li><span className="option-badge violet">A</span> Mobile app refresh</li>
              <li><span className="option-badge emerald">B</span> New live dashboard</li>
              <li><span className="option-badge coral">C</span> Community beta</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {featureCards.map((feature) => (
          <article className="feature-card card-surface" key={feature.title}>
            <div className={`feature-icon ${feature.tone}`} aria-hidden="true">
              ✦
            </div>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
