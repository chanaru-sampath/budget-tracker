import type { Bank } from '@/hooks/use-banks'
import type { Category } from '@/hooks/use-categories'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { RecurringTemplate } from '@/hooks/use-recurring'

import { GroupedBankView } from './grouped-bank-view'
import { RecurringCardView } from './recurring-card-view'
import { RecurringTableView } from './recurring-table-view'
import { type ViewMode } from './view-toggle'

export function RecurringList({
  templates,
  activeTemplates,
  inactiveTemplates,
  categories,
  banks,
  creditCards,
  view,
  onEdit,
  onToggle,
  onDelete,
}: {
  templates: RecurringTemplate[]
  activeTemplates: RecurringTemplate[]
  inactiveTemplates: RecurringTemplate[]
  categories: Category[]
  banks: Bank[]
  creditCards: CreditCard[]
  view: ViewMode
  onEdit: (template: RecurringTemplate) => void
  onToggle: (id: string, currentStatus: boolean) => void
  onDelete: (id: string) => void
}) {
  if (view === 'card') {
    return (
      <RecurringCardView
        activeTemplates={activeTemplates}
        inactiveTemplates={inactiveTemplates}
        categories={categories}
        banks={banks}
        creditCards={creditCards}
        onEdit={onEdit}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    )
  }

  if (view === 'grouped-table') {
    return <GroupedBankView templates={templates} banks={banks} creditCards={creditCards} />
  }

  return (
    <RecurringTableView
      templates={templates}
      categories={categories}
      banks={banks}
      creditCards={creditCards}
      onEdit={onEdit}
      onToggle={onToggle}
      onDelete={onDelete}
    />
  )
}
