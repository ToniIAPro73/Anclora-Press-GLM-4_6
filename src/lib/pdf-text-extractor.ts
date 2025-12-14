// Utility to extract basic text from PDFs without relying on external binaries.

interface PdfExtractionResult {
  text: string
  html: string
  estimatedPages?: number
  warnings?: string[]
}

const ESCAPE_MAP: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  b: "\b",
  f: "\f",
  "\\": "\\",
  "(": "(",
  ")": ")",
}

function decodePdfString(value: string): string {
  let result = ""
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === "\\") {
      i++
      const next = value[i]
      if (!next) break

      if (ESCAPE_MAP[next]) {
        result += ESCAPE_MAP[next]
        continue
      }

      if (/[0-7]/.test(next)) {
        let octal = next
        while (i + 1 < value.length && octal.length < 3 && /[0-7]/.test(value[i + 1])) {
          octal += value[++i]
        }
        result += String.fromCharCode(parseInt(octal, 8))
        continue
      }

      result += next
    } else {
      result += char
    }
  }
  return result
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function extractPdfContent(buffer: Buffer): Promise<PdfExtractionResult | null> {
  try {
    const raw = buffer.toString("latin1")
    const textSegments: string[] = []

    const showTextRegex = /\((?:\\.|[^\\)])*\)\s*Tj/gs
    let match: RegExpExecArray | null
    while ((match = showTextRegex.exec(raw))) {
      const literal = match[0]
      const inner = literal.replace(/\)\s*Tj$/, "").slice(1)
      const decoded = decodePdfString(inner)
      if (decoded.trim()) {
        textSegments.push(decoded.trim())
      }
    }

    const arrayRegex = /\[(?:\\.|[^\]])*?\]\s*TJ/gs
    while ((match = arrayRegex.exec(raw))) {
      const inner = match[0].replace(/\]\s*TJ$/, "").slice(1)
      const fragments = inner.match(/\((?:\\.|[^\\)])*\)/g)
      if (fragments) {
        const decodedFragments = fragments
          .map((fragment) => decodePdfString(fragment.slice(1, -1)).trim())
          .filter(Boolean)
        if (decodedFragments.length) {
          textSegments.push(decodedFragments.join(""))
        }
      }
    }

    const combined = normalizeWhitespace(textSegments.join("\n"))
    if (!combined) {
      return null
    }

    const paragraphs = combined
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    const html = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")

    const estimatedPages =
      raw.match(/\/Type\s*\/Page\b/g)?.length || Math.max(1, Math.ceil(combined.split(/\s+/).length / 250))

    return {
      text: paragraphs.join("\n\n"),
      html,
      estimatedPages,
      warnings: ["PDF parsed using lightweight extractor. Formatting may differ from the original document."],
    }
  } catch (error) {
    console.warn("Lightweight PDF extraction failed:", error)
    return null
  }
}
