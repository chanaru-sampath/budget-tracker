import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { CreditCardIcon, Edit2, Plus, Trash2 } from 'lucide-react'

import { banksQueryOptions } from '@/hooks/use-banks'
import {
  type CreditCard,
  creditCardsQueryOptions,
  useAddCreditCard,
  useDeleteCreditCard,
  useUpdateCreditCard,
} from '@/hooks/use-credit-cards'
import { COLORS } from '@/lib/constants'

import { ColorPicker } from './color-picker'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export function CreditCardsTab() {
  const { data: cards = [] } = useSuspenseQuery(creditCardsQueryOptions())
  const { data: banks = [] } = useSuspenseQuery(banksQueryOptions())
  const { mutate: addCard } = useAddCreditCard()
  const { mutate: updateCard } = useUpdateCreditCard()
  const { mutate: deleteCard } = useDeleteCreditCard()

  const [isOpen, setIsOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [name, setName] = useState('')
  const [bankId, setBankId] = useState('')
  const [lastFour, setLastFour] = useState('')
  const [color, setColor] = useState(COLORS[3])

  const openNew = () => {
    setEditingCard(null)
    setName('')
    setBankId(banks[0]?.id ?? '')
    setLastFour('')
    setColor(COLORS[3])
    setIsOpen(true)
  }

  const openEdit = (card: CreditCard) => {
    setEditingCard(card)
    setName(card.name)
    setBankId(card.bankId)
    setLastFour(card.lastFour ?? '')
    setColor(card.color)
    setIsOpen(true)
  }

  const handleSubmit = () => {
    if (!name.trim() || !bankId) return
    const payload = {
      bankId,
      name: name.trim(),
      lastFour: lastFour.trim() || null,
      color,
      sortOrder: 0,
    }
    if (editingCard) {
      updateCard({ id: editingCard.id, ...payload })
    } else {
      addCard(payload)
    }
    setIsOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Link credit cards to their parent bank. Bills are paid from that bank account.
        </p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew} disabled={banks.length === 0}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Edit Credit Card' : 'Add Credit Card'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Card Name</Label>
                <Input
                  placeholder="e.g. HNB Visa, Combank Gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Account (bill paid from)</Label>
                <Select value={bankId} onValueChange={setBankId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                          {b.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Last 4 digits (optional)</Label>
                <Input
                  placeholder="e.g. 4242"
                  maxLength={4}
                  value={lastFour}
                  onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="space-y-2">
                <Label>Colour</Label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                {editingCard ? 'Save Changes' : 'Add Card'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {banks.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          Add at least one bank account before creating credit cards.
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <CreditCardIcon className="h-8 w-8 opacity-40" />
          <p className="text-sm">No credit cards yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const bank = banks.find((b) => b.id === card.bankId)
            return (
              <div key={card.id} className="bg-card flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: card.color }}
                  >
                    <CreditCardIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium">
                      {card.name}
                      {card.lastFour && <span className="text-muted-foreground ml-1 text-xs">••{card.lastFour}</span>}
                    </div>
                    {bank && (
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: bank.color }}
                        />
                        <span className="text-muted-foreground">{bank.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(card)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8"
                    onClick={() => deleteCard(card.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
