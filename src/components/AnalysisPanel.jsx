import HighlightedText from './HighlightedText.jsx'

const SEVERITY_ICON = { warn: '⚠️', info: '💡', good: '✅' }

export default function AnalysisPanel({ analysis, text }) {
  const { stats, suggestions, platformFit } = analysis

  const statItems = [
    ['Words', stats.words],
    ['Characters', stats.characters],
    ['Sentences', stats.sentences],
    ['Hashtags', stats.hashtags],
    ['Mentions', stats.mentions],
    ['Emojis', stats.emojis],
  ]

  return (
    <div className="analysis">
      {/* Highlighted text breakdown */}
      {text && (
        <div className="analysis__section">
          <h3 className="analysis__section-title">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2.121 2.121 0 00-3-3L7 11.243V14h2.757z" clipRule="evenodd" />
            </svg>
            Text Breakdown
          </h3>
          <HighlightedText text={text} />
        </div>
      )}

      {/* Platform fit badges */}
      {platformFit && platformFit.length > 0 && (
        <div className="platform-fit">
          <h3 className="platform-fit__title">Where this post fits</h3>
          <div className="platform-fit__list">
            {platformFit.map((p) => (
              <div key={p.name} className={`platform-badge platform-badge--${p.fit}`}>
                <span className="platform-badge__name">{p.name}</span>
                <span className="platform-badge__status">
                  {p.fit === 'good' ? '✓ Perfect' : p.fit === 'ok' ? '~ Tight fit' : '✗ Over limit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <dl className="stats">
        {statItems.map(([label, value]) => (
          <div className="stats__item" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <ul className="suggestions">
        {suggestions.map((s, i) => (
          <li key={i} className={`suggestion suggestion--${s.severity}`}>
            <span className="suggestion__icon" aria-hidden="true">
              {SEVERITY_ICON[s.severity]}
            </span>
            <div>
              <strong>{s.title}</strong>
              <p>{s.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
