// src/components/settings/api-keys-management.tsx

// 声明这是客户端组件
"use client"

// 导入 React 核心库
import * as React from "react"

// 导入 TanStack Table 相关功能
// 这些功能用于构建功能强大的表格组件
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

// 导入 Lucide 图标
// 这些是界面中使用的各种图标组件
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Copy, Edit, Trash } from 'lucide-react'

// 导入国际化和提示组件
import { useIntl } from 'react-intl'
import { useToast } from "../../hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

// 导入自定义 UI 组件
// 这些是来自 shadcn/ui 的预构建组件
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

// 定义 API 密钥的类型接口
// 这个接口描述了 API 密钥对象的结构
interface ApiKey {
  id: string                    // 唯一标识符
  name: string                  // 密钥名称
  key: string                   // API 密钥值
  type: 'telegram' | 'other'    // 密钥类型：可以是 telegram 或 other
  createdAt: string            // 创建时间
}

// 初始示例数据
// 用于组件首次渲染时显示的默认数据
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

// 主组件定义
export default function ApiKeysManagement() {
  // 获取 Toast 通知功能和国际化实例
  const { toast } = useToast()
  const intl = useIntl()

  // 使用 React.useState 管理组件状态
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(initialApiKeys)  // API密钥列表
  const [selectedKey, setSelectedKey] = React.useState<ApiKey | null>(null)  // 当前选中的密钥
  const [sorting, setSorting] = React.useState<SortingState>([])  // 表格排序状态
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])  // 列筛选状态
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})  // 列可见性状态

  // 复制 API 密钥到剪贴板的处理函数
  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      toast({
        title: "复制成功",
        description: intl.formatMessage({ id: "apiKeys.copied" }),
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "复制失败",
        description: intl.formatMessage({ id: "apiKeys.copyFailed" }),
        action: <ToastAction altText="重试">重试</ToastAction>,
      })
    }
  }

  // 处理添加新的 API 密钥
  const handleAddKey = (newKey: ApiKey) => {
    setApiKeys(prevKeys => [...prevKeys, newKey])
    toast({
      title: "添加成功",
      description: intl.formatMessage({ id: "apiKeys.addSuccess" }),
    })
  }

  // 处理更新现有的 API 密钥
  const handleUpdateKey = (updatedKey: ApiKey) => {
    setApiKeys(prevKeys => prevKeys.map(key => 
      key.id === updatedKey.id ? updatedKey : key
    ))
    toast({
      title: "更新成功",
      description: intl.formatMessage({ id: "apiKeys.updateSuccess" }),
    })
  }

  // 处理删除 API 密钥
  const handleDeleteKey = (id: string) => {
    setApiKeys(prevKeys => prevKeys.filter(key => key.id !== id))
    toast({
      variant: "destructive",
      title: "删除成功",
      description: intl.formatMessage({ id: "apiKeys.deleteSuccess" }),
    })
  }

  // 定义表格列配置
  // 这个配置决定了表格如何显示和处理数据
  const columns: ColumnDef<ApiKey>[] = [
    // 名称列
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
    // 密钥列
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
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    // 类型列
    {
      accessorKey: "type",
      header: () => intl.formatMessage({ id: "apiKeys.table.type" }),
      cell: ({ row }) => {
        const type = row.getValue("type") as 'telegram' | 'other'
        return (
          <div className="capitalize">
            {type === 'telegram' ? 'Telegram Bot' : '其他'}
          </div>
        )
      },
    },
    // 创建时间列
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
    // 操作列
    {
      id: "actions",
      header: () => intl.formatMessage({ id: "apiKeys.table.actions" }),
      cell: ({ row }) => {
        const apiKey = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => copyKey(apiKey.key)}>
                <Copy className="mr-2 h-4 w-4" />
                复制密钥
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => {
                    e.preventDefault()
                    setSelectedKey(apiKey)
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>编辑 API 密钥</DialogTitle>
                    <DialogDescription>
                      修改 API 密钥的配置信息
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
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // 初始化表格实例
  // 使用 useReactTable hook 创建表格实例，配置各种功能
  const table = useReactTable({
    data: apiKeys,              // 表格数据
    columns,                    // 列配置
    onSortingChange: setSorting,  // 排序变化处理
    onColumnFiltersChange: setColumnFilters,  // 筛选变化处理
    getCoreRowModel: getCoreRowModel(),  // 核心行模型
    getPaginationRowModel: getPaginationRowModel(),  // 分页模型
    getSortedRowModel: getSortedRowModel(),  // 排序模型
    getFilteredRowModel: getFilteredRowModel(),  // 筛选模型
    onColumnVisibilityChange: setColumnVisibility,  // 列可见性变化处理
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  // 渲染组件
  return (
    <div className="space-y-4">
      {/* 搜索和添加按钮区域 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Input
          placeholder={intl.formatMessage({ id: "ui.search" })}
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
              添加 API 密钥
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新的 API 密钥</DialogTitle>
              <DialogDescription>
                请输入 API 密钥的相关信息
              </DialogDescription>
            </DialogHeader>
            <TelegramBotForm onSuccess={handleAddKey} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 表格区域 */}
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
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制区域 */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}