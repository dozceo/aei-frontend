import { cn } from '@/lib/cn'

export interface DataTableColumn<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  mobileCards?: boolean
  emptyMessage?: string
  className?: string
  getRowKey?: (row: T, index: number) => string | number
}

function getCellValue<T>(row: T, key: keyof T | string): React.ReactNode {
  if (typeof key === 'string' && key in (row as object)) {
    return String((row as Record<string, unknown>)[key] ?? '')
  }
  return String(row[key as keyof T] ?? '')
}

export function DataTable<T>({
  columns,
  data,
  mobileCards = true,
  emptyMessage = 'No data available',
  className,
  getRowKey,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn('state-empty surface p-6', className)}>
        <p className="text-sm text-[var(--ink-muted)]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={cn('data-table-wrap', className)}
      data-mobile-cards={mobileCards ? 'true' : 'false'}
    >
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}>
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  data-label={col.header}
                  className={col.className}
                >
                  {col.render ? col.render(row) : getCellValue(row, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
