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
import { 
  ArrowUpDown, 
  ChevronDown, 
  MoreHorizontal, 
  Plus, 
  Copy, 
  Edit, 
  Trash,
  Check,
  AlertCircle 
} from 'lucide-react'
import { useIntl } from 'react-intl'
import { useToast } from "@/hooks/use-toast"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

// API密钥数据接口定义
interface ApiKey {
  id: string
  name: string
  key: string
  type: 'telegram' | 'other'
  createdAt: string
  status?: 'active' | 'inactive'
  lastUsed?: string
}

// 定义列配置的辅助函数，提高代码复用性
function createColumns(
  intl: ReturnType<typeof useIntl>,
  copyKey: (key: string) => Promise<void>,
  openEditDialog: (key: ApiKey) => void,
  handleDeleteKey: (id: string) => void
): ColumnDef<ApiKey>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent"
          >
            <span className="font-semibold">
              {intl.formatMessage({ id: "apiKeys.table.name" })}
            </span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium line-clamp-1">
            {row.getValue("name")}
          </span>
          {row.original.status === 'inactive' && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
              {intl.formatMessage({ id: "apiKeys.status.inactive" })}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "key",
      header: () => intl.formatMessage({ id: "apiKeys.table.key" }),
      cell: ({ row }) => {
        const key = row.getValue("key") as string
        return (
          <div className="flex items-center space-x-2">
            <code className="relative rounded bg-muted px-[0.5rem] py-[0.2rem] font-mono text-sm font-semibold">
              <span className="hidden sm:inline">{key}</span>
              <span className="sm:hidden">{`${key.slice(0, 8)}...`}</span>
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => copyKey(key)}
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
        const type = row.getValue("type") as string
        return (
          <span className="capitalize">
            {intl.formatMessage({ id: `apiKeys.types.${type}` })}
          </span>
        )
      },
    },
    {
      accessorKey: "lastUsed",
      header: () => intl.formatMessage({ id: "apiKeys.table.lastUsed" }),
      cell: ({ row }) => {
        const lastUsed = row.getValue("lastUsed") as string
        return lastUsed ? (
          <span className="text-muted-foreground">
            {intl.formatRelativeTime(
              (new Date(lastUsed).getTime() - new Date().getTime()) / 1000,
              'second', 
              { numeric: 'auto' }
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {intl.formatMessage({ id: "apiKeys.never" })}
          </span>
        )
      },
    },
    {
      id: "actions",
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
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>
                {intl.formatMessage({ id: "common.actions" })}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => copyKey(apiKey.key)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>{intl.formatMessage({ id: "apiKeys.actions.copy" })}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditDialog(apiKey)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>{intl.formatMessage({ id: "apiKeys.actions.edit" })}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => handleDeleteKey(apiKey.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>{intl.formatMessage({ id: "apiKeys.actions.delete" })}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export default function ApiKeysManagement() {
  // 初始化状态和hooks
  const intl = useIntl()
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedKey, setSelectedKey] = React.useState<ApiKey | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  
  // 表格状态
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  // 复制API密钥到剪贴板
  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      toast({
        description: intl.formatMessage({ id: "apiKeys.toast.copySuccess" }),
        action: <Check className="h-4 w-4" />,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: intl.formatMessage({ id: "apiKeys.toast.copyError" }),
        action: (
          <Button variant="ghost" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            {intl.formatMessage({ id: "common.retry" })}
          </Button>
        ),
      })
    }
  }

  // 打开编辑对话框
  const openEditDialog = (key: ApiKey) => {
    setSelectedKey(key)
    setIsEditDialogOpen(true)
  }

  // 处理删除API密钥
  const handleDeleteKey = (id: string) => {
    try {
      setApiKeys(prevKeys => prevKeys.filter(key => key.id !== id))
      toast({
        description: intl.formatMessage({ id: "apiKeys.toast.deleteSuccess" }),
        action: <Check className="h-4 w-4" />,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: intl.formatMessage({ id: "apiKeys.toast.deleteError" }),
      })
    }
  }

  // 初始化表格配置
  const columns = React.useMemo(
    () => createColumns(intl, copyKey, openEditDialog, handleDeleteKey),
    [intl]
  )

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

  // 获取API密钥数据
  React.useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoading(true)
        // 这里添加实际的API调用
        const mockData: ApiKey[] = [
          {
            id: "1",
            name: "Production API Key",
            key: "pk_live_123456789",
            type: "other",
            createdAt: new Date().toISOString(),
            status: "active",
            lastUsed: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Development API Key",
            key: "pk_test_987654321",
            type: "other",
            createdAt: new Date().toISOString(),
            status: "inactive",
            lastUsed: "2023-12-01T00:00:00.000Z",
          },
        ]
        
        setApiKeys(mockData)
        setError(null)
      } catch (err) {
        setError(intl.formatMessage({ id: "apiKeys.error.fetch" }))
      } finally {
        setLoading(false)
      }
    }

    fetchApiKeys()
  }, [intl])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {intl.formatMessage({ id: "apiKeys.title" })}
        </CardTitle>
        <CardDescription>
          {intl.formatMessage({ id: "apiKeys.description" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {intl.formatMessage({ id: "common.error" })}
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder={intl.formatMessage({ id: "common.search" })}
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="w-full"
            />
          </div>
          <Button className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {intl.formatMessage({ id: "apiKeys.actions.add" })}
          </Button>
        </div>

        {/* 数据表格 */}
<div className="overflow-auto -mx-6"> {/* 添加负边距抵消父容器的内边距 */}
  <div className="min-w-full inline-block align-middle">
    <div className="overflow-hidden border rounded-lg mx-6"> {/* 重新添加边距 */}
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      <span>{intl.formatMessage({ id: "common.loading" })}
                        </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-muted/50 transition-colors"
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
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <div className="rounded-full border p-3">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      {table.getColumn("name")?.getFilterValue()
                        ? intl.formatMessage({ id: "apiKeys.table.noResults" })
                        : intl.formatMessage({ id: "apiKeys.table.empty" })}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
    </div>
  </div>
</div>
        {/* 分页控制 */}
<div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 分页信息 */}
  <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {intl.formatMessage(
              { id: "common.pageInfo" },
              {
                from: table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1,
                to: Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                ),
                total: table.getFilteredRowModel().rows.length,
              }
            )}
          </div>
          
          {/* 分页按钮组 */}
  <div className="flex items-center space-x-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
              aria-label={intl.formatMessage({ id: "common.previousPage" })}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              {intl.formatMessage(
                { id: "common.pageNumber" },
                { current: table.getState().pagination.pageIndex + 1 }
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
              aria-label={intl.formatMessage({ id: "common.nextPage" })}
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>

        {/* 删除确认对话框 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {intl.formatMessage({ id: "apiKeys.dialog.deleteTitle" })}
              </DialogTitle>
              <DialogDescription>
                {intl.formatMessage({ id: "apiKeys.dialog.deleteDescription" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                {intl.formatMessage({ id: "common.cancel" })}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedKey) {
                    handleDeleteKey(selectedKey.id)
                    setIsDeleteDialogOpen(false)
                  }
                }}
              >
                {intl.formatMessage({ id: "common.delete" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}