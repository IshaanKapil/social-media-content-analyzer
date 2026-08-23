// pdf.js and Tesseract are loaded on demand so the initial bundle stays small.
async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  // Use the CDN worker to avoid Vite bundling issues with the worker file
  const version = pdfjsLib.version
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`
  return pdfjsLib
}

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

export const ACCEPTED_TYPES = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'image/bmp': 'image',
}

export function classifyFile(file) {
  const kind = ACCEPTED_TYPES[file.type]
  if (!kind) {
    throw new Error(
      `Unsupported file type "${file.type || 'unknown'}". Please upload a PDF or an image (PNG, JPEG, WebP, BMP).`,
    )
  }
  if (file.size === 0) {
    throw new Error('The file is empty.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is larger than 25 MB. Please upload a smaller file.')
  }
  return kind
}

/**
 * Extract text from a PDF, preserving line breaks and paragraph gaps by
 * grouping text items on their vertical position and ordering them
 * left-to-right within each line.
 */
export async function extractPdfText(file, onProgress) {
  const pdfjsLib = await loadPdfjs()
  const data = await file.arrayBuffer()
  let pdf
  try {
    pdf = await pdfjsLib.getDocument({ data }).promise
  } catch (err) {
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected and cannot be read.')
    }
    throw new Error('Could not open this PDF — the file may be corrupted.')
  }

  const pages = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.({
      stage: `Parsing page ${pageNum} of ${pdf.numPages}`,
      ratio: pageNum / pdf.numPages,
    })
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    pages.push(assembleLines(content.items))
  }
  await pdf.destroy()

  const text = pages.join('\n\n').trim()
  if (!text) {
    throw new Error(
      'No selectable text found in this PDF. If it is a scanned document, upload it as an image so OCR can read it.',
    )
  }
  return text
}

/** Rebuild reading order from pdf.js text items using their coordinates. */
function assembleLines(items) {
  const rows = []
  for (const item of items) {
    if (!item.str) continue
    const x = item.transform[4]
    const y = item.transform[5]
    // Group items whose baselines are within ~40% of the font height.
    const tolerance = Math.max(2, item.height * 0.4)
    let row = rows.find((r) => Math.abs(r.y - y) <= tolerance)
    if (!row) {
      row = { y, height: item.height || 10, items: [] }
      rows.push(row)
    }
    row.items.push({ x, str: item.str })
  }

  rows.sort((a, b) => b.y - a.y) // PDF y-axis points up
  const lines = []
  let prevRow = null
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x)
    // Insert a blank line when the vertical gap suggests a new paragraph.
    if (prevRow && prevRow.y - row.y > prevRow.height * 2.2) {
      lines.push('')
    }
    lines.push(row.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim())
    prevRow = row
  }
  return lines.join('\n')
}

/** Run OCR on an image file with Tesseract.js. */
export async function extractImageText(file, onProgress) {
  const { default: Tesseract } = await import('tesseract.js')
  let result
  try {
    result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgress?.({ stage: 'Recognizing text (OCR)', ratio: m.progress })
        } else {
          onProgress?.({ stage: capitalize(m.status), ratio: null })
        }
      },
    })
  } catch {
    throw new Error('OCR failed on this image — it may be corrupted or in an unsupported format.')
  }

  const text = result.data.text.trim()
  if (!text) {
    throw new Error('OCR could not find any readable text in this image.')
  }
  return text
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

/** Dispatch a file to the right extractor based on its type. */
export async function extractText(file, onProgress) {
  const kind = classifyFile(file)
  return kind === 'pdf'
    ? extractPdfText(file, onProgress)
    : extractImageText(file, onProgress)
}
