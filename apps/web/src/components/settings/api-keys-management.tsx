// src/components/settings/api-keys-management.tsx
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Copy, Edit, Trash } from 'lucide-react'
import { useIntl } from 'react-intl'
import { useToast } from "../../hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TelegramBotForm } from "./telegram-bot-form"

interface ApiKey {
  id: string
  name: string
  key: string
  type: 'telegram' | 'other'
  createdAt: string
}

const initialApiKeys: ApiKey[] = [
  { 
    id: "1", 
    name: "Production API Key", 
    key: "pk_live_123456789", 
    type: 'other',
    createdAt: "2023-01-01",
  },
  { 
    id: "2", 
    name: "Development API Key", 
    key: "pk_test_987654321", 
    type: 'other',
    createdAt: "2023-02-15",
  },
]

export default function ApiKeysManagement() {
  const { toast } = useToast()
  const intl = useIntl()

  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(initialApiKeys)
  const [selectedKey, setSelectedKey] = React.useState<ApiKey | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      toast({
        title: intl.formatMessage({ id: "apiKeys.toast.copyTitle" }),
        description: intl.formatMessage({ id: "apiKeys.toast.copySuccess" }),
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "apiKeys.toast.copyErrorTitle" }),
        description: intl.formatMessage({ id: "apiKeys.toast.copyError" }),
        action: <ToastAction altText={intl.formatMessage({ id: "common.retry" })}>
          {intl.formatMessage({ id: "common.retry" })}
        </ToastAction>,
      })
    }
  }

  const handleAddKey = (newKey: ApiKey) => {
    setApiKeys(prevKeys => [...prevKeys, newKey])
    toast({
      title: intl.formatMessage({ id: "apiKeys.toast.addTitle" }),
      description: intl.formatMessage({ id: "apiKeys.toast.addSuccess" }),
    })
  }

  const handleUpdateKey = (updatedKey: ApiKey) => {
    setApiKeys(prevKeys => prevKeys.map(key => 
      key.id === updatedKey.id ? updatedKey : key
    ))
    toast({
      title: intl.formatMessage({ id: "apiKeys.toast.updateTitle" }),
      description: intl.formatMessage({ id: "apiKeys.toast.updateSuccess" }),
    })
  }

  const handleDeleteKey = (id: string) => {
    setApiKeys(prevKeys => prevKeys.filter(key => key.id !== id))
    toast({
      variant: "destructive",
      title: intl.formatMessage({ id: "apiKeys.toast.deleteTitle" }),
      description: intl.formatMessage({ id: "apiKeys.toast.deleteSuccess" }),
    })
  }

  const columns: ColumnDef<ApiKey>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {intl.formatMessage({ id: "apiKeys.table.name" })}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "key",
      header: () => intl.formatMessage({ id: "apiKeys.table.key" }),
      cell: ({ row }) => {
        const key = row.getValue("key") as string
        return (
          <div className="flex items-center space-x-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
              {key}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyKey(key)}
              className="h-8 w-8 p-0"
              aria-label={intl.formatMessage({ id: "apiKeys.actions.copy" })}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: () => intl.formatMessage({ id: "apiKeys.table.type" }),
      cell: ({ row }) => {
        const type = row.getValue("type") as 'telegram' | 'other'
        return (
          <div className="capitalize">
            {intl.formatMessage({ id: `apiKeys.types.${type}` })}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: () => intl.formatMessage({ id: "apiKeys.table.createdAt" }),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return intl.formatDate(date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
    },
    {
      id: "actions",
      header: () => intl.formatMessage({ id: "apiKeys.table.actions" }),
      cell: ({ row }) => {
        const apiKey = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">
                  {intl.formatMessage({ id: "common.openMenu" })}
                </span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {intl.formatMessage({ id: "common.actions" })}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => copyKey(apiKey.key)}>
                <Copy className="mr-2 h-4 w-4" />
                {intl.formatMessage({ id: "apiKeys.actions.copy" })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => {
                    e.preventDefault()
                    setSelectedKey(apiKey)
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    {intl.formatMessage({ id: "apiKeys.actions.edit" })}
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {intl.formatMessage({ id: "apiKeys.dialog.editTitle" })}
                    </DialogTitle>
                    <DialogDescription>
                      {intl.formatMessage({ id: "apiKeys.dialog.editDescription" })}
                    </DialogDescription>
                  </DialogHeader>
                  <TelegramBotForm
                    key={apiKey.id}
                    initialData={apiKey}
                    onSuccess={handleUpdateKey}
                  />
                </DialogContent>
              </Dialog>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDeleteKey(apiKey.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                {intl.formatMessage({ id: "apiKeys.actions.delete" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: apiKeys,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Input
          placeholder={intl.formatMessage({ id: "common.search" })}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="sm:max-w-xs"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {intl.formatMessage({ id: "apiKeys.actions.add" })}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {intl.formatMessage({ id: "apiKeys.dialog.addTitle" })}
              </DialogTitle>
              <DialogDescription>
                {intl.formatMessage({ id: "apiKeys.dialog.addDescription" })}
              </DialogDescription>
            </DialogHeader>
            <TelegramBotForm onSuccess={handleAddKey} />
          </DialogContent>
        </Dialog>
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {intl.formatMessage({ id: "apiKeys.table.empty" })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {intl.formatMessage({ id: "common.previousPage" })}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {intl.formatMessage({ id: "common.nextPage" })}
        </Button>
      </div>
    </div>
  )
}