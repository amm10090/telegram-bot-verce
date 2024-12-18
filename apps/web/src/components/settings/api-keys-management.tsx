// src/components/settings/api-keys-management.tsx
import { useState } from "react"
import { useIntl } from 'react-intl'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Toast } from "@/components/ui/toast"  // 导入 Toast 组件
import React from "react"

// 定义 API 密钥的数据类型
type ApiKey = {
  id: string
  name: string
  key: string
  createdAt: string
}

// 初始的示例数据
const initialApiKeys: ApiKey[] = [
  { 
    id: "1", 
    name: "Production API Key", 
    key: "pk_live_123456789", 
    createdAt: "2023-01-01" 
  },
  { 
    id: "2", 
    name: "Development API Key", 
    key: "pk_test_987654321", 
    createdAt: "2023-02-15" 
  },
]

export default function ApiKeysManagement() {
  // 状态管理
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [newKeyName, setNewKeyName] = useState("")
  const intl = useIntl()
  
  // Toast 相关状态
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // 显示通知的辅助函数
  const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // 添加新密钥的处理函数
  const addNewKey = () => {
    if (newKeyName.trim() === "") {
      showNotification(
        intl.formatMessage({ id: 'apiKeys.error.emptyName' }),
        'error'
      )
      return
    }

    // 创建新的 API 密钥
    const newKey: ApiKey = {
      id: (apiKeys.length + 1).toString(),
      name: newKeyName,
      key: `pk_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setApiKeys([...apiKeys, newKey])
    setNewKeyName("")
    showNotification(
      intl.formatMessage({ id: 'apiKeys.success.created' }),
      'success'
    )
  }

  // 删除密钥的处理函数
  const deleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id))
    showNotification(
      intl.formatMessage({ id: 'apiKeys.success.deleted' }),
      'success'
    )
  }

  return (
    <div className="space-y-6">
      {/* 添加新密钥的表单 */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder={intl.formatMessage({ id: 'apiKeys.input.placeholder' })}
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
        />
        <Button onClick={addNewKey}>
          {intl.formatMessage({ id: 'apiKeys.button.add' })}
        </Button>
      </div>

      {/* API密钥列表表格 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{intl.formatMessage({ id: 'apiKeys.table.name' })}</TableHead>
            <TableHead>{intl.formatMessage({ id: 'apiKeys.table.key' })}</TableHead>
            <TableHead>{intl.formatMessage({ id: 'apiKeys.table.createdAt' })}</TableHead>
            <TableHead>{intl.formatMessage({ id: 'apiKeys.table.actions' })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((key) => (
            <TableRow key={key.id}>
              <TableCell>{key.name}</TableCell>
              <TableCell>{key.key}</TableCell>
              <TableCell>{key.createdAt}</TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteKey(key.id)}
                >
                  {intl.formatMessage({ id: 'apiKeys.button.delete' })}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Toast 通知组件 */}
      <Toast 
        open={showToast} 
        onOpenChange={setShowToast}
     variant={toastType === 'error' ? 'destructive' : 'default'}   
   >
        <div className={`
          p-4 rounded-md
          ${toastType === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}
        `}>
          {toastMessage}
        </div>
      </Toast>
    </div>
  )
}