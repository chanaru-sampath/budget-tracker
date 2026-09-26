import { Edit2, Trash2 } from 'lucide-react'

import type { Bank } from '@/hooks/use-banks'
import type { Category } from '@/hooks/use-categories'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { RecurringTemplate } from '@/hooks/use-recurring'

import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

export function RecurringTableView({
  templates,
  categories,
  banks,
  creditCards,
  onEdit,
  onToggle,
  onDelete,
}: {
  templates: RecurringTemplate[]
  categories: Category[]
  banks: Bank[]
  creditCards: CreditCard[]
  onEdit: (template: RecurringTemplate) => void
  onToggle: (id: string, currentStatus: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Amount / mo</TableHead>
            <TableHead>Since</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                No recurring expenses yet.
              </TableCell>
            </TableRow>
          ) : (
            templates.map((template) => {
              const category = categories.find((c) => c.id === template.categoryId)
              let sourceName = '—'
              let sourceColor = '#ccc'
              if (template.bankId) {
                const bank = banks.find((b) => b.id === template.bankId)
                if (bank) {
                  sourceName = bank.name
                  sourceColor = bank.color
                }
              } else if (template.cardId) {
                const card = creditCards.find((c) => c.id === template.cardId)
                if (card) {
                  sourceName = card.name
                  sourceColor = card.color
                }
              }

              return (
                <TableRow key={template.id} className={!template.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{template.label}</TableCell>
                  <TableCell>
                    {category ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: sourceColor }} />
                      {sourceName}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(template.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(template.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={() => onToggle(template.id, template.isActive)}
                      className="origin-left scale-75"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(template)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-7 w-7"
                        onClick={() => onDelete(template.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
