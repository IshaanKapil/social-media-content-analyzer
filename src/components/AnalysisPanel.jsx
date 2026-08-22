const SEVERITY_ICON = { warn: '⚠️', info: '💡', good: '✅' }

export default function AnalysisPanel({ analysis }) {
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
      {/* Platform fit badges */}
      {platformFit && platformFit.length > 0 && (
        <div className="platform-fit">
          <h3 className="platform-fit__title">Platform fit</h3>
          <div className="platform-fit__list">
            {platformFit.map((p) => (
              <div key={p.name} className={`platform-badge platform-badge--${p.fit}`}>
                <span className="platform-badge__name">{p.name}</span>
                <span className="platform-badge__status">
                  {p.fit === 'good' ? '✓ Great fit' : p.fit === 'ok' ? '~ Acceptable' : '✗ Too long'}
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
