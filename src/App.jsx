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

  return (
    <div className="app">
      <header className="header">
        <div className="header__badge">100% Client-Side</div>
        <h1>Social Media Content Analyzer</h1>
        <p>
          Upload PDFs or images of social media posts. We extract the text (PDF
          parsing + OCR), let you refine it, then analyze engagement potential.
        </p>
      </header>

      <FileDropzone onFiles={handleFiles} />

      <main className="results">
        {jobs.map((job) => (
          <ResultCard
            key={job.id}
            job={job}
            onRemove={() => removeJob(job.id)}
            onTextEdit={(newText) => handleTextEdit(job.id, newText)}
            onAnalyze={() => handleAnalyze(job.id)}
          />
        ))}
        {jobs.length === 0 && (
          <p className="empty-hint">
            No documents yet — drop a PDF or a screenshot above to get started.
          </p>
        )}
      </main>

      <footer className="footer">
        <svg className="footer__icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        All processing happens locally in your browser using Tesseract.js (OCR) and PDF.js — your files never leave your device.
      </footer>
    </div>
  )
}
