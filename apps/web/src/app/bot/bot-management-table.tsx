"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus } from 'lucide-react'
import { useIntl } from 'react-intl'

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Bot {
  id: string
  name: string
  token: string
  status: "active" | "inactive"
  createdAt: string
}

const data: Bot[] = [
  {
    id: "1",
    name: "Welcome Bot",
    token: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
    status: "active",
    createdAt: "2023-01-01",
  },
  {
    id: "2",
    name: "Support Bot",
    token: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew22",
    status: "inactive",
    createdAt: "2023-02-15",
  },
]

export default function BotManagementTable() {
  const intl = useIntl();

  const columns: ColumnDef<Bot>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={intl.formatMessage({ id: "bots.table.selectAll" })}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={intl.formatMessage({ id: "bots.table.selectRow" })}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {intl.formatMessage({ id: "bots.table.name" })}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "status",
      header: () => intl.formatMessage({ id: "bots.table.status" }),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {intl.formatMessage({ 
              id: `dashboard.botStatus.status.${status}` 
            })}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: () => intl.formatMessage({ id: "bots.table.createdAt" }),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        const formattedDate = intl.formatDate(date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        return <div>{formattedDate}</div>
      },
    },
    {
      id: "actions",
      header: () => intl.formatMessage({ id: "bots.table.actions" }),
      cell: ({ row }) => {
        const bot = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">
                  {intl.formatMessage({ id: "bots.table.openMenu" })}
                </span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {intl.formatMessage({ id: "bots.table.actions" })}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(bot.token)}>
                {intl.formatMessage({ id: "bots.table.copyToken" })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {intl.formatMessage({ id: "bots.table.viewDetails" })}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {intl.formatMessage({ id: "actions.edit" })}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {intl.formatMessage({ id: "actions.delete" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4 pt-9">
        <Input
          placeholder={intl.formatMessage({ id: "ui.search" })}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button className="ml-auto" onClick={() => console.log("Add new bot")}>
          <Plus className="mr-2 h-4 w-4" />
          {intl.formatMessage({ id: "bots.table.addNew" })}
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {intl.formatMessage({ id: "bots.table.noResults" })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {intl.formatMessage(
            { id: "bots.table.selected" },
            { 
              count: table.getFilteredSelectedRowModel().rows.length,
              total: table.getFilteredRowModel().rows.length
            }
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {intl.formatMessage({ id: "table.previousPage" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {intl.formatMessage({ id: "table.nextPage" })}
          </Button>
        </div>
      </div>
    </div>
  )
}