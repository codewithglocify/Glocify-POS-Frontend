import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  filterFn_includesStringSensitive,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { compareItems, rankItem } from '@tanstack/match-sorter-utils'

import { makeData } from '#/data/demo-table-data'

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortFn,
} from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { Person } from '#/data/demo-table-data'

export const Route = createFileRoute('/demo/table')({
  component: TableDemo,
})

type TableFilterMeta = {
  itemRank: RankingInfo
}

const fuzzyFilter: FilterFn<any, Person> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta?.({
    itemRank,
  })

  return itemRank.passed
}

const fuzzySort: SortFn<any, Person> = (rowA, rowB, columnId) => {
  let dir = 0

  const rankA = rowA.columnFiltersMeta[columnId] as TableFilterMeta | undefined
  const rankB = rowB.columnFiltersMeta[columnId] as TableFilterMeta | undefined

  if (rankA?.itemRank && rankB?.itemRank) {
    dir = compareItems(rankA.itemRank, rankB.itemRank)
  }

  return dir === 0 ? sortFn_alphanumeric(rowA, rowB, columnId) : dir
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    equalsString: filterFn_equalsString,
    includesStringSensitive: filterFn_includesStringSensitive,
    includesString: filterFn_includesString,
    fuzzy: fuzzyFilter,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    fuzzy: fuzzySort,
  },
  filterMeta: {} as TableFilterMeta,
})

type DemoFeatures = typeof features

function TableDemo() {
  const rerender = React.useReducer(() => ({}), {})[1]

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = React.useMemo<Array<ColumnDef<DemoFeatures, Person>>>(
    () => [
      {
        accessorKey: 'id',
        filterFn: 'equalsString',
      },
      {
        accessorKey: 'firstName',
        cell: (info) => info.getValue(),
        filterFn: 'includesStringSensitive',
      },
      {
        accessorFn: (row) => row.lastName,
        id: 'lastName',
        cell: (info) => info.getValue(),
        header: () => <span>Last Name</span>,
        filterFn: 'includesString',
      },
      {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: 'fullName',
        header: 'Full Name',
        cell: (info) => info.getValue(),
        filterFn: 'fuzzy',
        sortFn: 'fuzzy',
      },
    ],
    [],
  )

  const [data, setData] = React.useState<Array<Person>>(() => makeData(5_000))
  const refreshData = () => setData((_old) => makeData(50_000))

  const table = useTable({
    features,
    data,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'fuzzy',
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  })

  React.useEffect(() => {
    if (table.state.columnFilters[0]?.id === 'fullName') {
      if (table.state.sorting[0]?.id !== 'fullName') {
        table.setSorting([{ id: 'fullName', desc: false }])
      }
    }
  }, [table, table.state.columnFilters])

  return (
    <main className="demo-page demo-page-wide">
      <div>
        <p className="island-kicker mb-2">TanStack Table</p>
        <h1 className="demo-title mb-6">Table Demo</h1>
        <DebouncedInput
          value={globalFilter}
          onChange={(value) => setGlobalFilter(String(value))}
          className="demo-input"
          placeholder="Search all columns..."
        />
      </div>
      <div className="h-4" />
      <div className="demo-table-shell">
        <table className="demo-table text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="px-4 py-3 text-left"
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? 'cursor-pointer select-none transition-colors hover:text-[var(--lagoon-deep)]'
                                : '',
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            <table.FlexRender header={header} />
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                          {header.column.getCanFilter() ? (
                            <div className="mt-2">
                              <Filter column={header.column} />
                            </div>
                          ) : null}
                        </>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <tr key={row.id} className="transition-colors">
                  {row.getAllCells().map((cell) => {
                    return (
                      <td key={cell.id} className="px-4 py-3">
                        <table.FlexRender cell={cell} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="h-4" />
      <div className="demo-muted flex flex-wrap items-center gap-2">
        <button
          className="demo-button demo-button-secondary"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="demo-button demo-button-secondary"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="demo-button demo-button-secondary"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="demo-button demo-button-secondary"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.state.pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="demo-input demo-input-fit py-1"
          />
        </span>
        <select
          value={table.state.pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
          className="demo-select demo-input-fit py-1"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div className="demo-muted mt-4">
        {table.getPrePaginatedRowModel().rows.length} Rows
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => rerender()} className="demo-button">
          Force Rerender
        </button>
        <button onClick={() => refreshData()} className="demo-button">
          Refresh Data
        </button>
      </div>
      <pre className="demo-code-block mt-4 overflow-auto">
        {JSON.stringify(
          {
            columnFilters: table.state.columnFilters,
            globalFilter: table.state.globalFilter,
          },
          null,
          2,
        )}
      </pre>
    </main>
  )
}

function Filter({ column }: { column: Column<DemoFeatures, Person, unknown> }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <DebouncedInput
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search...`}
      className="demo-input py-1"
    />
  )
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
