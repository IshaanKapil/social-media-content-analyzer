import { useState } from 'react'
import AnalysisPanel from './AnalysisPanel.jsx'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResultCard({ job, onRemove, onTextEdit, onAnalyze }) {
  const [tab, setTab] = useState('analysis')
  const [copied, setCopied] = useState(false)

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(job.editedText ?? job.rawText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const isExtracted = job.status === 'extracted'
  const isDone = job.status === 'done'
  const showContent = isExtracted || isDone

  // Auto-switch to analysis tab when analysis completes
  const activeTab = isDone ? tab : 'text'

  return (
    <section className={`card card--${job.status}`}>
      <div className="card__header">
        <div>
          <h2 className="card__title">{job.fileName}</h2>
          <span className="card__meta">{formatSize(job.fileSize)}</span>
        </div>
        <button className="card__remove" onClick={onRemove} aria-label="Remove result">
          ✕
        </button>
      </div>

      {/* Step indicator */}
      {showContent && (
        <div className="stepper">
          <div className={`stepper__step stepper__step--done`}>
            <span className="stepper__dot">✓</span>
            <span className="stepper__label">Upload</span>
          </div>
          <div className="stepper__connector stepper__connector--done" />
          <div className={`stepper__step stepper__step--done`}>
            <span className="stepper__dot">✓</span>
            <span className="stepper__label">Extract</span>
          </div>
          <div className={`stepper__connector${isDone ? ' stepper__connector--done' : ''}`} />
          <div className={`stepper__step${isExtracted ? ' stepper__step--active' : ''}${isDone ? ' stepper__step--done' : ''}`}>
            <span className="stepper__dot">{isDone ? '✓' : '3'}</span>
            <span className="stepper__label">Review</span>
          </div>
          <div className={`stepper__connector${isDone ? ' stepper__connector--done' : ''}`} />
          <div className={`stepper__step${isDone ? ' stepper__step--done' : ''}`}>
            <span className="stepper__dot">{isDone ? '✓' : '4'}</span>
            <span className="stepper__label">Analyze</span>
          </div>
        </div>
      )}

      {job.status === 'processing' && (
        <div className="card__loading" role="status">
          <div className="progress">
            <div
              className={`progress__bar${job.progress.ratio == null ? ' progress__bar--indeterminate' : ''}`}
              style={
                job.progress.ratio != null
                  ? { width: `${Math.round(job.progress.ratio * 100)}%` }
                  : undefined
              }
            />
          </div>
          <span className="card__stage">
            {job.progress.stage}
            {job.progress.ratio != null && ` · ${Math.round(job.progress.ratio * 100)}%`}
          </span>
        </div>
      )}

      {job.status === 'error' && (
        <p className="card__error" role="alert">
          {job.error}
        </p>
      )}

      {showContent && (
        <>
          {/* Tabs — only show both when analysis is done */}
          {isDone && (
            <div className="tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'analysis'}
                className={`tab${activeTab === 'analysis' ? ' tab--active' : ''}`}
                onClick={() => setTab('analysis')}
              >
                Engagement analysis
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'text'}
                className={`tab${activeTab === 'text' ? ' tab--active' : ''}`}
                onClick={() => setTab('text')}
              >
                Extracted text
              </button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="extracted">
              {isExtracted && (
                <div className="extracted__header">
                  <div className="extracted__info">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Review and edit the text below to keep <strong>only the caption/post content</strong>, then click Analyze.</span>
                  </div>
                </div>
              )}

              <div className="extracted__toolbar">
                <button className="copy-btn" onClick={copyText}>
                  {copied ? '✓ Copied!' : 'Copy text'}
                </button>
                {isDone && (
                  <button className="btn btn--small btn--secondary" onClick={() => { onTextEdit(job.rawText); }}>
                    Reset to original
                  </button>
                )}
              </div>

              {isExtracted ? (
                <textarea
                  className="extracted__textarea"
                  value={job.editedText}
                  onChange={(e) => onTextEdit(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  placeholder="Extracted text appears here…"
                />
              ) : (
                <pre className="extracted__text">{job.editedText}</pre>
              )}

              {isExtracted && (
                <div className="extracted__actions">
                  <button
                    className="btn btn--primary btn--analyze"
                    onClick={onAnalyze}
                    disabled={!job.editedText?.trim()}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Analyze Content
                  </button>
                  <span className="extracted__char-count">
                    {job.editedText?.length ?? 0} characters
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && isDone && (
            <AnalysisPanel analysis={job.analysis} />
          )}
        </>
      )}
    </section>
  )
}
