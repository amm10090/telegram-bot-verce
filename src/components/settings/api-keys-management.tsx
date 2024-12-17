"use client"

import { useState } from "react"
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
import { toast } from "@/components/ui/use-toast"

type ApiKey = {
  id: string
  name: string
  key: string
  createdAt: string
}

const initialApiKeys: ApiKey[] = [
  { id: "1", name: "Production API Key", key: "pk_live_123456789", createdAt: "2023-01-01" },
  { id: "2", name: "Development API Key", key: "pk_test_987654321", createdAt: "2023-02-15" },
]

export function ApiKeysManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [newKeyName, setNewKeyName] = useState("")

  const addNewKey = () => {
    if (newKeyName.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter a name for the new API key.",
        variant: "destructive",
      })
      return
    }

    const newKey: ApiKey = {
      id: (apiKeys.length + 1).toString(),
      name: newKeyName,
      key: `pk_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setApiKeys([...apiKeys, newKey])
    setNewKeyName("")
    toast({
      title: "Success",
      description: "New API key has been created.",
    })
  }

  const deleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id))
    toast({
      title: "Success",
      description: "API key has been deleted.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Enter new API key name"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
        />
        <Button onClick={addNewKey}>Add New Key</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((key) => (
            <TableRow key={key.id}>
              <TableCell>{key.name}</TableCell>
              <TableCell>{key.key}</TableCell>
              <TableCell>{key.createdAt}</TableCell>
              <TableCell>
                <Button variant="destructive" onClick={() => deleteKey(key.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

