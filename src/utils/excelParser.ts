import * as XLSX from 'xlsx'

export type ParsedField = { name: string; type: string; comment?: string }
export type ParsedSheet = { sheetName: string; fields: ParsedField[] }
export type ParsedExcel = { fileName: string; sheets: ParsedSheet[] }

function inferType(sample: any): string {
  if (sample === null || sample === undefined || sample === '') return 'string'
  if (sample instanceof Date) return 'datetime'
  if (typeof sample === 'number') return 'double'
  if (typeof sample === 'boolean') return 'boolean'
  // xlsx 有时把日期当成数字，需要更复杂判断，演示先用 string
  return 'string'
}

export async function parseExcelFile(file: File): Promise<ParsedExcel> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  const sheets: ParsedSheet[] = wb.SheetNames.map((sheetName) => {
    const ws = wb.Sheets[sheetName]
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as any[][]

    const headerRow = (rows[0] || []).map((x) => String(x || '').trim()).filter(Boolean)
    const sampleRow = rows[1] || []

    const fields: ParsedField[] = headerRow.map((h, idx) => {
      const sample = sampleRow[idx]
      return { name: h, type: inferType(sample), comment: '' }
    })

    return { sheetName, fields }
  })

  return { fileName: file.name, sheets }
}
