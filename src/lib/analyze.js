/**
 * Rule-based engagement analysis for social media posts.
 * Returns quick stats, platform fit, and concrete, prioritized improvement suggestions.
 *
 * IMPORTANT: This should be called on the user's curated post text,
 * not raw OCR output which may contain UI noise, comments, etc.
 */

const CTA_PATTERNS =
  /\b(comment|share|tag|follow|subscribe|sign up|learn more|link in bio|click|join|dm|save this|let (?:me|us) know|what do you think|tell (?:me|us))\b/i

const POWER_WORDS =
  /\b(free|new|proven|secret|instantly|exclusive|limited|easy|ultimate|guaranteed|discover|boost|grow|win)\b/i

const EMOJI_REGEX = /\p{Extended_Pictographic}/gu

/** Platform character limits and names */
const PLATFORMS = [
  { name: 'X / Twitter', limit: 280 },
  { name: 'LinkedIn', limit: 3000 },
  { name: 'Instagram', limit: 2200 },
  { name: 'Facebook', limit: 63206 },
  { name: 'TikTok', limit: 2200 },
]

function getPlatformFit(charCount) {
  return PLATFORMS.map((p) => {
    let fit
    if (charCount <= p.limit) {
      fit = charCount <= p.limit * 0.8 ? 'good' : 'ok'
    } else {
      fit = 'over'
    }
    return { name: p.name, limit: p.limit, fit }
  })
}

export function analyzePost(text) {
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.!?]+[\s\n]/).filter((s) => s.trim().length > 0)
  const hashtags = text.match(/#[\p{L}\p{N}_]+/gu) ?? []
  const mentions = text.match(/@[\w.]+/g) ?? []
  const emojis = text.match(EMOJI_REGEX) ?? []
  const questions = (text.match(/\?/g) ?? []).length
  const urls = text.match(/https?:\/\/\S+|www\.\S+/gi) ?? []

  const avgSentenceLength =
    sentences.length > 0 ? words.length / sentences.length : words.length

  const stats = {
    characters: text.length,
    words: words.length,
    sentences: sentences.length,
    hashtags: hashtags.length,
    mentions: mentions.length,
    emojis: emojis.length,
    links: urls.length,
  }

  const platformFit = getPlatformFit(text.length)

  const suggestions = []
  const add = (severity, title, detail) => suggestions.push({ severity, title, detail })

  // Length
  if (words.length < 5) {
    add('warn', 'Post is very short', 'Posts under ~5 words often lack context. Add a hook or a detail that gives readers a reason to engage.')
  } else if (text.length > 2200) {
    add('warn', 'Post is very long', `At ${text.length} characters this exceeds Instagram's caption limit (2,200) and will be truncated on most platforms. Front-load the key message.`)
  } else if (text.length > 280) {
    add('info', 'Too long for X/Twitter', `At ${text.length} characters this exceeds X's 280-character limit — fine for LinkedIn/Instagram, but it would need a thread or trim for X.`)
  } else {
    add('good', 'Good length', 'The post length fits comfortably within major platform limits.')
  }

  // Call to action
  if (CTA_PATTERNS.test(text)) {
    add('good', 'Call to action present', 'Inviting a response is one of the strongest engagement drivers.')
  } else {
    add('info', 'No call to action', 'End with a prompt — a question, "share your take", or "tag someone" — to invite comments and shares.')
  }

  // Questions
  if (questions === 0 && !CTA_PATTERNS.test(text)) {
    add('info', 'No questions asked', 'Posts that ask a direct question typically earn more comments.')
  }

  // Hashtags
  if (hashtags.length === 0) {
    add('info', 'No hashtags', 'Add 3–5 relevant hashtags to improve discoverability (fewer, targeted tags beat many generic ones).')
  } else if (hashtags.length > 10) {
    add('warn', 'Too many hashtags', `${hashtags.length} hashtags can read as spam. Keep the 3–5 most relevant.`)
  } else if (hashtags.length > 5) {
    add('info', 'Consider fewer hashtags', `${hashtags.length} hashtags is fine, but 3–5 targeted tags often outperform more generic ones.`)
  } else {
    add('good', 'Sensible hashtag use', `${hashtags.length} hashtag${hashtags.length === 1 ? '' : 's'} — within the recommended range.`)
  }

  // Emojis
  if (emojis.length === 0) {
    add('info', 'No emojis', 'One or two well-placed emojis can lift engagement and break up text — if it suits your brand voice.')
  } else if (emojis.length > 10) {
    add('info', 'Heavy emoji use', 'More than ~10 emojis can hurt readability. Consider trimming.')
  }

  // Readability
  if (avgSentenceLength > 25) {
    add('warn', 'Long sentences', `Average sentence length is ${Math.round(avgSentenceLength)} words. Short, punchy sentences perform better in feeds.`)
  }

  // Power words
  if (!POWER_WORDS.test(text)) {
    add('info', 'No power words', 'Words like "proven", "free", or "discover" in the opening line can increase click-through.')
  }

  // Links
  if (urls.length > 1) {
    add('info', 'Multiple links', 'More than one link splits attention (and some platforms downrank link-heavy posts). Keep a single clear destination.')
  }

  // Formatting for long posts
  if (text.length > 400 && !text.includes('\n')) {
    add('info', 'Wall of text', 'Break long posts into short paragraphs or a list — white space dramatically improves feed readability.')
  }

  const order = { warn: 0, info: 1, good: 2 }
  suggestions.sort((a, b) => order[a.severity] - order[b.severity])

  return { stats, suggestions, hashtags, mentions, platformFit }
}
