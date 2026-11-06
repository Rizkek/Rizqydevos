// Reads the CSV that password managers and browsers export, in the browser, so the file itself never leaves it.
// Only the rows are sent to the API, and passwords are never logged or kept in state after the import.

// Must match SECRET_LIMITS and MAX_IMPORT_SECRETS in apps/api/src/modules/secrets/dto/secret.dto.ts.
export const IMPORT_LIMITS = { name: 200, key: 200, username: 200, url: 2048, value: 10_000, description: 2000, rows: 2000 }

export interface ImportItem {
  name: string
  key: string
  username: string
  url?: string
  value: string
  description?: string
}

export interface SkippedRow {
  // Line number of the row in the file, counting the header as line 1.
  row: number
  reason: string
}

export type ImportFormat = 'recognised' | 'unrecognised' | 'empty'

export interface ParsedImport {
  format: ImportFormat
  items: ImportItem[]
  skipped: SkippedRow[]
}

// RFC 4180: quoted fields may contain commas, doubled quotes, and line breaks.
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// Header names used by Chrome, Edge, Brave, Firefox, Bitwarden, 1Password, and LastPass exports.
const COLUMN_NAMES = {
  url: ['url', 'login_uri', 'website', 'web site', 'login url'],
  username: ['username', 'login_username', 'user name', 'login name', 'login'],
  password: ['password', 'login_password'],
  name: ['name', 'title'],
  note: ['note', 'notes', 'extra'],
  type: ['type'],
} as const

type Column = keyof typeof COLUMN_NAMES

function findColumns(header: string[]): Partial<Record<Column, number>> {
  const lowered = header.map((cell) => cell.trim().toLowerCase())
  const columns: Partial<Record<Column, number>> = {}
  for (const column of Object.keys(COLUMN_NAMES) as Column[]) {
    const index = lowered.findIndex((cell) => (COLUMN_NAMES[column] as readonly string[]).includes(cell))
    if (index >= 0) columns[column] = index
  }
  return columns
}

// The part of the address that says what the login is for: github.com, not https://www.github.com/login.
export function keyFromUrl(raw: string): string | null {
  try {
    const host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.replace(/^www\./, '').toLowerCase()
    return host || null
  } catch {
    return null
  }
}

export function parsePasswordCsv(text: string): ParsedImport {
  const rows = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ''))
  const header = rows[0]
  if (!header) return { format: 'empty', items: [], skipped: [] }

  const columns = findColumns(header)
  if (columns.password === undefined || (columns.url === undefined && columns.name === undefined)) {
    return { format: 'unrecognised', items: [], skipped: [] }
  }

  const cell = (row: string[], column: Column) => (columns[column] === undefined ? '' : (row[columns[column]] ?? '').trim())
  const items: ImportItem[] = []
  const skipped: SkippedRow[] = []

  for (const [index, row] of rows.slice(1).entries()) {
    const line = index + 2

    // Bitwarden exports notes, cards, and identities in the same file.
    const type = cell(row, 'type')
    if (columns.type !== undefined && type !== '' && type.toLowerCase() !== 'login') {
      skipped.push({ row: line, reason: `Not a login (${type})` })
      continue
    }

    // Passwords are kept as they are: spaces at the ends can be part of one.
    const value = columns.password === undefined ? '' : (row[columns.password] ?? '')
    if (value === '') {
      skipped.push({ row: line, reason: 'No password' })
      continue
    }
    if (value.length > IMPORT_LIMITS.value) {
      skipped.push({ row: line, reason: 'Password is too long' })
      continue
    }

    const url = cell(row, 'url')
    const key = (url && keyFromUrl(url)) || cell(row, 'name') || url
    if (!key) {
      skipped.push({ row: line, reason: 'No site or name' })
      continue
    }

    const item: ImportItem = {
      name: (cell(row, 'name') || key).slice(0, IMPORT_LIMITS.name),
      key: key.slice(0, IMPORT_LIMITS.key),
      username: cell(row, 'username').slice(0, IMPORT_LIMITS.username),
      value,
    }
    if (url && url.length <= IMPORT_LIMITS.url) item.url = url
    const note = cell(row, 'note')
    if (note) item.description = note.slice(0, IMPORT_LIMITS.description)
    items.push(item)
  }

  return { format: 'recognised', items, skipped }
}

// Groups skip reasons for display, so the preview shows "No password: 3" instead of a list of rows.
export function summariseSkipped(skipped: SkippedRow[]): { reason: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const { reason } of skipped) counts.set(reason, (counts.get(reason) ?? 0) + 1)
  return [...counts].map(([reason, count]) => ({ reason, count }))
}
