import { useRef, useState } from 'react'

export default function FileDropzone({ onFiles }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) onFiles([...e.dataTransfer.files])
  }

  const handlePick = (e) => {
    if (e.target.files?.length) onFiles([...e.target.files])
    e.target.value = '' // allow re-selecting the same file
  }

  return (
    <div className="dropzone-wrapper">
      <span className="dropzone-wrapper__label">Upload your post</span>
      <div
        className={`dropzone${dragActive ? ' dropzone--active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF or image files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,image/bmp"
          multiple
          hidden
          onChange={handlePick}
        />
        <svg className="dropzone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
        </svg>
        <p className="dropzone__title">
          {dragActive ? 'Let go — we\'ll take it from here' : 'Drag & drop your files here'}
        </p>
        <p className="dropzone__hint">
          or <span className="dropzone__browse">pick from your computer</span>
        </p>
        <div className="dropzone__formats">
          <span className="dropzone__format-tag">PDF</span>
          <span className="dropzone__format-tag">PNG</span>
          <span className="dropzone__format-tag">JPEG</span>
          <span className="dropzone__format-tag">WebP</span>
          <span className="dropzone__format-tag">BMP</span>
        </div>
      </div>
    </div>
  )
}
