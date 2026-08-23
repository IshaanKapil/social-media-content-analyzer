import { useMemo, useState } from 'react'

const CTA_PATTERNS =
  /\b(comment|share|tag|follow|subscribe|sign up|learn more|link in bio|click|join|dm|save this|let (?:me|us) know|what do you think|tell (?:me|us))\b/gi

const POWER_WORDS =
  /\b(free|new|proven|secret|instantly|exclusive|limited|easy|ultimate|guaranteed|discover|boost|grow|win)\b/gi

const EMOJI_REGEX = /\p{Extended_Pictographic}/gu

const WARN_COLOR = '#fb7185'
const WARN_BG = 'rgba(251, 113, 133, 0.12)'

function extractExcess(text, regex, limit) {
  const ranges = []
  const re = new RegExp(regex.source, regex.flags)
  let m
  let count = 0
  while ((m = re.exec(text)) !== null) {
    count++
    if (count > limit) {
      ranges.push({ start: m.index, end: m.index + m[0].length })
    }
    if (m[0].length === 0) re.lastIndex++
  }
  return ranges
}

function extractLongSentences(text) {
  const ranges = []
  const re = /([^\.!\?]+[\.!\?]*)/g
  let m
  while ((m = re.exec(text)) !== null) {
    const sentence = m[0]
    if (sentence.trim().length === 0) continue
    const words = sentence.trim().split(/\s+/).filter(Boolean)
    if (words.length > 25) {
      ranges.push({ start: m.index, end: m.index + m[0].length })
    }
  }
  return ranges
}

/** Each highlight type with its color, label, and pattern */
const HIGHLIGHT_TYPES = [
  { key: 'long_sentence', label: 'Long Sentences (>25 words)', color: WARN_COLOR, bgColor: WARN_BG, extract: extractLongSentences },
  { key: 'excess_hashtag', label: 'Excess Hashtags (>5)', color: WARN_COLOR, bgColor: WARN_BG, extract: (text) => extractExcess(text, /#[\p{L}\p{N}_]+/gu, 5) },
  { key: 'excess_emoji', label: 'Excess Emojis (>10)', color: WARN_COLOR, bgColor: WARN_BG, extract: (text) => extractExcess(text, EMOJI_REGEX, 10) },
  { key: 'excess_link', label: 'Multiple Links', color: WARN_COLOR, bgColor: WARN_BG, extract: (text) => extractExcess(text, /https?:\/\/\S+|www\.\S+/gi, 1) },
  
  { key: 'hashtag',   label: 'Good Hashtags', color: '#a882ff', bgColor: 'rgba(168, 130, 255, 0.12)', pattern: /#[\p{L}\p{N}_]+/gu },
  { key: 'mention',   label: 'Mentions',      color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.12)',  pattern: /@[\w.]+/g },
  { key: 'url',       label: 'Links',         color: '#f472b6', bgColor: 'rgba(244, 114, 182, 0.12)', pattern: /https?:\/\/\S+|www\.\S+/gi },
  { key: 'cta',       label: 'Call to Action', color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.12)', pattern: CTA_PATTERNS },
  { key: 'power',     label: 'Power Words',   color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.12)',  pattern: POWER_WORDS },
  { key: 'emoji',     label: 'Emojis',        color: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.12)', pattern: EMOJI_REGEX },
]

/**
 * Build a list of { start, end, type } spans for every match, then
 * merge overlapping ranges giving priority to the first-defined type.
 */
function buildHighlightRanges(text, activeTypes) {
  const ranges = []

  const typePriority = {}
  HIGHLIGHT_TYPES.forEach((ht, i) => { typePriority[ht.key] = i })

  for (const ht of HIGHLIGHT_TYPES) {
    if (!activeTypes.has(ht.key)) continue
    
    if (ht.extract) {
      const extracted = ht.extract(text)
      for (const r of extracted) {
        ranges.push({ ...r, type: ht.key })
      }
    } else if (ht.pattern) {
      // Clone the regex so lastIndex resets
      const re = new RegExp(ht.pattern.source, ht.pattern.flags)
      let m
      while ((m = re.exec(text)) !== null) {
        ranges.push({ start: m.index, end: m.index + m[0].length, type: ht.key })
        // Prevent infinite loops on zero-width matches
        if (m[0].length === 0) re.lastIndex++
      }
    }
  }

  // Sort by start position, then by length (longest first), then priority
  ranges.sort((a, b) => 
    a.start - b.start || 
    (b.end - b.start) - (a.end - a.start) ||
    typePriority[a.type] - typePriority[b.type]
  )

  // Remove overlapping ranges (first match wins)
  const merged = []
  let lastEnd = 0
  for (const r of ranges) {
    if (r.start < lastEnd) continue
    merged.push(r)
    lastEnd = r.end
  }

  return merged
}

/** Split text into highlighted and plain segments */
function segmentText(text, ranges) {
  const segments = []
  let cursor = 0

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start), type: null })
    }
    segments.push({ text: text.slice(range.start, range.end), type: range.type })
    cursor = range.end
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), type: null })
  }

  return segments
}

/** Get styles for a highlight type */
function getHighlightStyle(typeKey) {
  const ht = HIGHLIGHT_TYPES.find((h) => h.key === typeKey)
  if (!ht) return {}
  return {
    color: ht.color,
    backgroundColor: ht.bgColor,
    borderRadius: '3px',
    padding: '1px 3px',
    fontWeight: 600,
    borderBottom: `2px solid ${ht.color}`,
  }
}

/** Count matches per type */
function countMatches(text) {
  const counts = {}
  for (const ht of HIGHLIGHT_TYPES) {
    if (ht.extract) {
      counts[ht.key] = ht.extract(text).length
    } else if (ht.pattern) {
      const re = new RegExp(ht.pattern.source, ht.pattern.flags)
      const matches = text.match(re)
      counts[ht.key] = matches ? matches.length : 0
    }
  }
  return counts
}

export default function HighlightedText({ text }) {
  const [activeTypes, setActiveTypes] = useState(
    () => new Set(HIGHLIGHT_TYPES.map((h) => h.key))
  )

  const counts = useMemo(() => countMatches(text), [text])

  const toggle = (key) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const ranges = useMemo(() => buildHighlightRanges(text, activeTypes), [text, activeTypes])
  const segments = useMemo(() => segmentText(text, ranges), [text, ranges])

  return (
    <div className="highlighted">
      {/* Legend / toggles */}
      <div className="highlighted__legend">
        <span className="highlighted__legend-label">Highlight:</span>
        {HIGHLIGHT_TYPES.map((ht) => (
          <button
            key={ht.key}
            className={`highlight-toggle${activeTypes.has(ht.key) ? ' highlight-toggle--active' : ''}`}
            onClick={() => toggle(ht.key)}
            style={activeTypes.has(ht.key) ? { borderColor: ht.color, color: ht.color } : {}}
            title={`Toggle ${ht.label} highlighting`}
          >
            <span
              className="highlight-toggle__dot"
              style={{ backgroundColor: activeTypes.has(ht.key) ? ht.color : 'var(--text-muted)' }}
            />
            {ht.label}
            {counts[ht.key] > 0 && (
              <span
                className="highlight-toggle__count"
                style={activeTypes.has(ht.key) ? { backgroundColor: ht.bgColor, color: ht.color } : {}}
              >
                {counts[ht.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Highlighted text display */}
      <div className="highlighted__text">
        {segments.map((seg, i) =>
          seg.type ? (
            <span key={i} style={getHighlightStyle(seg.type)} title={
              HIGHLIGHT_TYPES.find((h) => h.key === seg.type)?.label
            }>
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </div>
    </div>
  )
}
