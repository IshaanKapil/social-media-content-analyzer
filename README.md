# Social Media Content Analyzer

A web app that extracts text from social media posts shared as **PDFs or images** and suggests concrete **engagement improvements**.

**Live demo:**https://social-media-content-analyzer-seven-gray.vercel.app/

## Features

- **Document upload** — drag & drop or file picker; multiple files at once; PDF, PNG, JPEG, WebP, BMP (up to 25 MB each)
- **PDF parsing** — text extraction with [pdf.js](https://mozilla.github.io/pdf.js/), reconstructing line breaks and paragraph gaps from glyph coordinates so formatting is preserved
- **OCR** — [Tesseract.js](https://tesseract.projectnaptha.com/) reads scanned documents and screenshots, with live progress reporting
- **Engagement analysis** — rule-based scoring of length, calls to action, questions, hashtags, mentions, emojis, readability, and formatting, with prioritized suggestions
- **Loading states** — per-file progress bars (determinate for PDF pages and OCR progress, indeterminate otherwise)
- **Error handling** — friendly messages for unsupported types, oversized/empty files, password-protected or corrupted PDFs, and scans with no readable text
- **Privacy** — everything runs client-side; files never leave the browser

## Tech stack

React 18 + Vite · pdfjs-dist · tesseract.js — no backend required, deployable on any static host.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
```

## Deploy

Any static host works. For Vercel: import the repo, framework preset "Vite", done. For Netlify: build command `npm run build`, publish directory `dist`.

## Project structure

```
src/
  App.jsx                    app shell and upload-job state
  components/
    FileDropzone.jsx         drag & drop + file picker (keyboard accessible)
    ResultCard.jsx           per-file card: loading, error, and result tabs
    AnalysisPanel.jsx        stats grid + suggestion list
  lib/
    extract.js               file validation, PDF parsing, OCR dispatch
    analyze.js               rule-based engagement analysis
```

## Approach (write-up)

The app is a fully client-side React + Vite SPA: both extraction engines have first-class JavaScript implementations (pdf.js and Tesseract.js), so running them in the browser eliminates server cost, upload latency, and privacy concerns — files never leave the device — while keeping deployment a one-step static host push.

Uploads arrive via an accessible drag-and-drop zone or file picker. Each file becomes an independent job with its own progress state, so multiple documents process concurrently without blocking the UI. PDFs are parsed with pdf.js; rather than concatenating raw text items, I rebuild reading order by grouping glyphs on their baseline coordinates and inserting paragraph breaks on large vertical gaps, preserving the original formatting. Images go through Tesseract.js OCR with its progress callback wired to a determinate progress bar. Heavy libraries load on demand via dynamic import, keeping the initial bundle at ~17 kB gzipped.

Extracted text then flows into a rule-based engagement analyzer that checks platform length limits, calls to action, questions, hashtag and emoji usage, readability, and formatting, returning prioritized, actionable suggestions rather than a bare score. Errors — unsupported types, corrupt or password-protected PDFs, unreadable scans — surface as specific, human-readable messages on the affected card. (~190 words)
