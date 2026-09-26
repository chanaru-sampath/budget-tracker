import { useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import type { Bank } from '@/hooks/use-banks'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { RecurringTemplate } from '@/hooks/use-recurring'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

export function GroupedBankView({
  templates,
  banks,
  creditCards,
}: {
  templates: RecurringTemplate[]
  banks: Bank[]
  creditCards: CreditCard[]
}) {
  const grouped = templates.reduce(
    (acc, template) => {
      let sourceName = 'Other'
      let sourceColor = '#ccc'
      let sourceId = 'other'

      if (template.bankId) {
        const bank = banks.find((b) => b.id === template.bankId)
        if (bank) {
          sourceName = bank.name
          sourceColor = bank.color
          sourceId = bank.id
        }
      } else if (template.cardId) {
        const card = creditCards.find((c) => c.id === template.cardId)
        if (card) {
          sourceName = card.name
          sourceColor = card.color
          sourceId = card.id
        }
      }

      if (!acc[sourceId]) {
        acc[sourceId] = { name: sourceName, color: sourceColor, templates: [], totalAmount: 0 }
      }
      acc[sourceId].templates.push(template)
      acc[sourceId].totalAmount += template.amount
      return acc
    },
    {} as Record<string, { name: string; color: string; templates: RecurringTemplate[]; totalAmount: number }>,
  )

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    Object.keys(grouped).forEach((k) => {
      init[k] = false
    })
    return init
  })

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground py-10 text-center">No recurring expenses yet.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([id, group]) => (
        <div key={id} className="rounded-lg border">
          <div
            className="bg-muted/50 hover:bg-muted/70 flex cursor-pointer items-center gap-2 border-b px-4 py-2 transition-colors"
            onClick={() => toggleExpand(id)}
          >
            {expanded[id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
              {group.name}
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-muted-foreground text-sm font-medium">
                {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(group.totalAmount)}
              </div>
              <div className="text-muted-foreground text-sm">
                ({group.templates.length} item{group.templates.length !== 1 ? 's' : ''})
              </div>
            </div>
          </div>
          {expanded[id] && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount / mo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.templates.map((template) => (
                  <TableRow key={template.id} className={!template.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{template.label}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
                        {group.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(template.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ))}
    </div>
  )
}
