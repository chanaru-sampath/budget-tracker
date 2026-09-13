import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Building2, Edit2, Plus, Star, Trash2 } from 'lucide-react'

import { type Bank, banksQueryOptions, useAddBank, useDeleteBank, useUpdateBank } from '@/hooks/use-banks'
import { COLORS } from '@/lib/constants'

import { ColorPicker } from './color-picker'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'

export function Banks() {
  const { data: banks = [] } = useSuspenseQuery(banksQueryOptions())
  const { mutate: addBank } = useAddBank()
  const { mutate: updateBank } = useUpdateBank()
  const { mutate: deleteBank } = useDeleteBank()

  const [isOpen, setIsOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<Bank | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [isSalary, setIsSalary] = useState(false)

  const openNew = () => {
    setEditingBank(null)
    setName('')
    setColor(COLORS[0])
    setIsSalary(false)
    setIsOpen(true)
  }

  const openEdit = (bank: Bank) => {
    setEditingBank(bank)
    setName(bank.name)
    setColor(bank.color)
    setIsSalary(bank.isSalaryAccount)
    setIsOpen(true)
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    const payload = { name: name.trim(), isSalaryAccount: isSalary, color, sortOrder: 0 }
    if (editingBank) {
      updateBank({ id: editingBank.id, ...payload })
    } else {
      addBank(payload)
    }
    setIsOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Add your bank accounts. Mark one as your salary account — all transfers originate from there.
        </p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editingBank ? 'Edit Bank' : 'Add Bank Account'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  placeholder="e.g. HNB Savings, Combank Current"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Switch checked={isSalary} onCheckedChange={setIsSalary} id="salary-toggle" />
                <div>
                  <Label htmlFor="salary-toggle" className="cursor-pointer font-medium">
                    Salary Account
                  </Label>
                  <p className="text-muted-foreground text-xs">Money flows from this account to all others</p>
                </div>
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                {editingBank ? 'Save Changes' : 'Add Bank'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {banks.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <Building2 className="h-8 w-8 opacity-40" />
          <p className="text-sm">No banks yet. Add your first bank account.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {banks.map((bank) => (
            <div key={bank.id} className="bg-card flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: bank.color }}
                >
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{bank.name}</span>
                    {bank.isSalaryAccount && (
                      <Badge variant="secondary" className="gap-1 py-0 text-xs">
                        <Star className="h-2.5 w-2.5" />
                        Salary
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(bank)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-8 w-8"
                  onClick={() => deleteBank(bank.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
