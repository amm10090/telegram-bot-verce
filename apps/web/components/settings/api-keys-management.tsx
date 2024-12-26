"use client"

// 导入必要的 React 和 类型定义
import * as React from "react"
import type { ReactNode } from "react"
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
  Row,
  Table as TableInstance,
} from "@tanstack/react-table"

// 导入图标组件
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

// 导入国际化工具
import { useIntl } from 'react-intl'

// 导入 UI 组件
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { useToast } from "@workspace/ui/hooks/use-toast"

// 导入自定义组件和服务
import { TelegramBotForm } from "./telegram-bot-form"
import { telegramBotService } from '../services/telegram-bot-service'
import type { Bot, RawBotData, TableBot } from '../../types/bot'

// 将原始Bot数据转换为表格显示所需的格式
const convertBotToTableData = (bot: Bot | RawBotData): TableBot => ({
  id: '_id' in bot ? bot._id : bot.id,
  name: bot.name,
  apiKey: bot.apiKey,
  isEnabled: bot.isEnabled,
  status: bot.status as 'active' | 'inactive' || (bot.isEnabled ? 'active' : 'inactive'),
  createdAt: bot.createdAt,
  lastUsed: bot.lastUsed,
  type: 'telegram' as const,
})

// 创建表格列配置函数
function createColumns(
  intl: ReturnType<typeof useIntl>,
  copyKey: (key: string) => Promise<void>,
  openEditDialog: (bot: TableBot) => void,
  handleDeleteBot: (id: string) => void
): ColumnDef<TableBot>[] {
  return [
    // 名称列配置
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
          {!row.original.isEnabled && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
              {intl.formatMessage({ id: "apiKeys.status.inactive" })}
            </span>
          )}
        </div>
      ),
    },
    // API密钥列配置
    {
      accessorKey: "apiKey",
      header: () => intl.formatMessage({ id: "apiKeys.table.key" }),
      cell: ({ row }) => {
        const apiKey = row.getValue("apiKey") as string
        return (
          <div className="flex items-center space-x-2">
            <code className="relative rounded bg-muted px-[0.5rem] py-[0.2rem] font-mono text-sm font-semibold">
              <span className="hidden sm:inline">{apiKey}</span>
              <span className="sm:hidden">{`${apiKey.slice(0, 8)}...`}</span>
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => copyKey(apiKey)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    // Bot类型列配置
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
    // 最后使用时间列配置
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
    // 操作列配置
    {
      id: "actions",
      cell: ({ row }) => {
        const bot = row.original
        
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
              <DropdownMenuItem onClick={() => copyKey(bot.apiKey)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>{intl.formatMessage({ id: "apiKeys.actions.copy" })}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e: Event) => {
                    e.preventDefault()
                    openEditDialog(bot)
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>{intl.formatMessage({ id: "apiKeys.actions.edit" })}</span>
                  </DropdownMenuItem>
                </DialogTrigger>
              </Dialog>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => handleDeleteBot(bot.id)}
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

// 主组件定义
export default function ApiKeysManagement() {
  // 初始化 hooks
  const intl = useIntl()
  const { toast } = useToast()
  
  // 状态管理
  const [bots, setBots] = React.useState<TableBot[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedBot, setSelectedBot] = React.useState<TableBot | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)

  // 表格状态管理
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
      })
    }
  }

  // 打开编辑对话框
  const openEditDialog = (bot: TableBot) => {
    setSelectedBot(bot)
    setIsEditDialogOpen(true)
  }

  // 处理添加新Bot
  const handleAddBot = async (botData: Bot) => {
    try {
      const newBot = {
        _id: botData.id,
        name: botData.name,
        apiKey: botData.apiKey,
        isEnabled: botData.isEnabled,
        status: botData.status,
        createdAt: botData.createdAt,
        lastUsed: botData.lastUsed
      } as RawBotData;
      
      const tableBot = convertBotToTableData(newBot)
      setBots(prevBots => [...prevBots, tableBot])
      setIsAddDialogOpen(false)
      toast({
        description: intl.formatMessage({ id: "apiKeys.toast.addSuccess" }),
        action: <Check className="h-4 w-4" />,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: intl.formatMessage({ id: "apiKeys.toast.addError" }),
      })
    }
  }

  // 处理��新Bot
  const handleUpdateBot = async (botData: Bot) => {
    try {
      const updatedBot = {
        _id: botData.id,
        name: botData.name,
        apiKey: botData.apiKey,
        isEnabled: botData.isEnabled,
        status: botData.status,
        createdAt: botData.createdAt,
        lastUsed: botData.lastUsed
      } as RawBotData;
      
      const tableBot = convertBotToTableData(updatedBot)
      setBots(prevBots => prevBots.map(bot => 
        bot.id === tableBot.id ? tableBot : bot
      ))
      setIsEditDialogOpen(false)
      toast({
        description: intl.formatMessage({ id: "apiKeys.toast.updateSuccess" }),
        action: <Check className="h-4 w-4" />,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: intl.formatMessage({ id: "apiKeys.toast.updateError" }),
      })
    }
  }

  // 处理删除Bot
  const handleDeleteBot = async (id: string) => {
    try {
      await telegramBotService.deleteBot(id)
      setBots(prevBots => prevBots.filter(bot => bot.id !== id))
      setIsDeleteDialogOpen(false)
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

  // 初始化表格列配置
  const columns = React.useMemo(
    () => createColumns(intl, copyKey, openEditDialog, handleDeleteBot),
    [intl]
  )

  // 配置表格实例
  const table: TableInstance<TableBot> = useReactTable({
    data: bots,
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

  // 获取Bot列表数据
  React.useEffect(() => {
    const fetchBots = async () => {
      try {
        setLoading(true)
        const response = await telegramBotService.getAllBots()
        
        if (response.success && Array.isArray(response.data)) {
          const tableBots = response.data.map(convertBotToTableData)
          setBots(tableBots)
          setError(null)
        } else {
          setError(intl.formatMessage({ id: "apiKeys.error.invalidData" }))
        }
      } catch (err) {
        console.error('数据获取错误:', err)
        setError(intl.formatMessage({ id: "apiKeys.error.fetch" }))
      } finally {
        setLoading(false)
      }
    }

    fetchBots()
  }, [intl])

  // 处理表格筛选
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    table.getColumn("name")?.setFilterValue(event.target.value)
  }

  // 渲染表格头部
  const renderTableHeader = () => (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {header.isPlaceholder ? null : (
                <div>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </div>
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )

  // 渲染表格主体
  const renderTableBody = () => (
    <TableBody>
      {loading ? (
        // 加载状态显示
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span>{intl.formatMessage({ id: "common.loading" })}</span>
            </div>
          </TableCell>
        </TableRow>
      ) : table.getRowModel().rows?.length ? (
        // 数据行渲染
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
            className="group hover:bg-muted/50 transition-colors"
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                <div>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </div>
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        // 空数据状态显示
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
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
  )

  // 渲染分页控件
  const renderPagination = () => (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* 分页信息显示 */}
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        {intl.formatMessage(
          { id: "common.pageInfo" },
          {
            current: table.getState().pagination.pageIndex + 1,
            total: Math.ceil(
              table.getFilteredRowModel().rows.length /
                table.getState().pagination.pageSize
            ),
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
            { number: table.getState().pagination.pageIndex + 1 }
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
  )

  // 返回主要UI结构
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
        {/* 错误提示显示 */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {intl.formatMessage({ id: "common.error" })}
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 工具栏区域 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
          {/* 搜索框 */}
          <div className="flex-1 max-w-sm">
            <Input
              placeholder={intl.formatMessage({ id: "common.search" })}
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={handleFilterChange}
              className="w-full"
            />
          </div>

          {/* 添加新Bot按钮和对话框 */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
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
              <TelegramBotForm onSuccess={handleAddBot} />
            </DialogContent>
          </Dialog>
        </div>

        {/* 数据表格区域 */}
        <div className="overflow-auto -mx-6">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden border rounded-lg mx-6">
              <Table>
                {renderTableHeader()}
                {renderTableBody()}
              </Table>
            </div>
          </div>
        </div>

        {/* 分页控件区域 */}
        {renderPagination()}

        {/* 编辑对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {intl.formatMessage({ id: "apiKeys.dialog.editTitle" })}
              </DialogTitle>
              <DialogDescription>
                {intl.formatMessage({ id: "apiKeys.dialog.editDescription" })}
              </DialogDescription>
            </DialogHeader>
            {selectedBot && (
              <TelegramBotForm
                initialData={selectedBot}
                onSuccess={handleUpdateBot}
              />
            )}
          </DialogContent>
        </Dialog>

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
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {intl.formatMessage({ id: "common.cancel" })}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedBot) {
                    handleDeleteBot(selectedBot.id)
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