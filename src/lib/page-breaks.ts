export const PAGE_BREAK_MARK = "<!-- page-break -->"

const PAGE_BREAK_PATTERN = /<!--\s*page-break\s*-->/i
const PAGE_BREAK_GLOBAL = /<!--\s*page-break\s*-->/gi

export function isPageBreakMarker(value: string): boolean {
  return PAGE_BREAK_PATTERN.test(value.trim().toLowerCase())
}

export function replacePageBreakMarkers(value: string, replacement: string): string {
  return value.replace(PAGE_BREAK_GLOBAL, replacement)
}
