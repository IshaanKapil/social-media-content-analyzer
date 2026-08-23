import { useCallback, useState } from 'react'
import FileDropzone from './components/FileDropzone.jsx'
import ResultCard from './components/ResultCard.jsx'
import { extractText } from './lib/extract.js'
import { analyzePost } from './lib/analyze.js'

let nextId = 0

export default function App() {
  const [jobs, setJobs] = useState([])

  const updateJob = (id, patch) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))

  const handleFiles = useCallback((files) => {
    for (const file of files) {
      const id = ++nextId
      setJobs((prev) => [
        {
          id,
          fileName: file.name,
          fileSize: file.size,
          status: 'processing',
          progress: { stage: 'Starting…', ratio: null },
          rawText: null,
          editedText: null,
          analysis: null,
          error: null,
        },
        ...prev,
      ])

      extractText(file, (progress) => updateJob(id, { progress }))
        .then((text) =>
          updateJob(id, { status: 'extracted', rawText: text, editedText: text }),
        )
        .catch((err) =>
          updateJob(id, { status: 'error', error: err.message ?? 'Something went wrong.' }),
        )
    }
  }, [])

  const handleTextEdit = useCallback((id, newText) => {
    updateJob(id, { editedText: newText })
  }, [])

  const handleAnalyze = useCallback((id) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j
        const analysis = analyzePost(j.editedText)
        return { ...j, status: 'done', analysis }
      }),
    )
  }, [])

  const removeJob = (id) => setJobs((prev) => prev.filter((j) => j.id !== id))

  const hasJobs = jobs.length > 0

  return (
    <div className="app">
      {/* Top navigation bar */}
      <nav className="topbar">
        <div className="topbar__brand">
          <div className="topbar__logo">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="white" aria-hidden="true">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          Post Analyzer
        </div>
        <div className="topbar__badge">
          <span className="topbar__badge-dot" />
          Runs locally in your browser
        </div>
      </nav>

      {/* Hero: split layout */}
      <section className="hero">
        <div className="hero__left">
          <header className="header">
            <h1>
              Make every<br />
              <span className="gradient-text">post count.</span>
            </h1>
            <p>
              Drop a screenshot or PDF of any social media post — we'll pull out the text, 
              let you clean it up, and show you exactly how to boost engagement.
            </p>
          </header>

          <div className="features">
            <div className="feature">
              <div className="feature__icon feature__icon--purple">🔍</div>
              <div className="feature__text">
                <h3>Smart Text Extraction</h3>
                <p>OCR-powered extraction from screenshots and PDFs using Tesseract.js</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature__icon feature__icon--blue">📊</div>
              <div className="feature__text">
                <h3>Engagement Analysis</h3>
                <p>Get word count, hashtag usage, platform fit, and actionable tips</p>
              </div>
            </div>
            <div className="feature">
              <div className="feature__icon feature__icon--green">🔒</div>
              <div className="feature__text">
                <h3>100% Private</h3>
                <p>Everything runs locally — no servers, no uploads, no tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero__right">
          <FileDropzone onFiles={handleFiles} />
        </div>
      </section>

      {/* Results */}
      {hasJobs && (
        <section className="results-section">
          <div className="results">
            {jobs.map((job) => (
              <ResultCard
                key={job.id}
                job={job}
                onRemove={() => removeJob(job.id)}
                onTextEdit={(newText) => handleTextEdit(job.id, newText)}
                onAnalyze={() => handleAnalyze(job.id)}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <svg className="footer__icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        Everything stays on your device. We use Tesseract.js for OCR and PDF.js for parsing — no servers, no uploads, no tracking.
      </footer>
    </div>
  )
}
