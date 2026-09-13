import { Edit2, Trash2 } from 'lucide-react'

import type { Bank } from '@/hooks/use-banks'
import type { Category } from '@/hooks/use-categories'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { RecurringTemplate } from '@/hooks/use-recurring'

import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'

export function TemplateCard({
  template,
  categories,
  banks,
  creditCards,
  onEdit,
  onToggle,
  onDelete,
}: {
  template: RecurringTemplate
  categories: Category[]
  banks: Bank[]
  creditCards: CreditCard[]
  onEdit: (template: RecurringTemplate) => void
  onToggle: () => void
  onDelete: () => void
}) {
  const category = categories.find((c) => c.id === template.categoryId)
  let sourceName = 'Unknown source'
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
    <Card className="group relative overflow-hidden">
      <div className="absolute top-0 left-0 h-full w-1" style={{ backgroundColor: category?.color || '#ccc' }} />
      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{template.label}</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="px-1.5 py-0 text-xs font-normal">
                {category?.name || 'Uncategorized'}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">
              {new Intl.NumberFormat('en-LK', {
                style: 'currency',
                currency: 'LKR',
              }).format(template.amount)}
            </div>
            <div className="text-muted-foreground text-xs">per month</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pl-5">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Source</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: sourceColor }} />
              {sourceName}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Since</span>
            <span className="font-medium">
              {new Date(template.startDate).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <Switch checked={template.isActive} onCheckedChange={onToggle} className="origin-left scale-75" />
            <span className="text-muted-foreground text-xs">{template.isActive ? 'Active' : 'Paused'}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(template)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-7 w-7"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
