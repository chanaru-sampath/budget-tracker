import { Repeat } from 'lucide-react'

import type { Bank } from '@/hooks/use-banks'
import type { Category } from '@/hooks/use-categories'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { RecurringTemplate } from '@/hooks/use-recurring'

import { TemplateCard } from './template-card'

export function RecurringCardView({
  activeTemplates,
  inactiveTemplates,
  categories,
  banks,
  creditCards,
  onEdit,
  onToggle,
  onDelete,
}: {
  activeTemplates: RecurringTemplate[]
  inactiveTemplates: RecurringTemplate[]
  categories: Category[]
  banks: Bank[]
  creditCards: CreditCard[]
  onEdit: (template: RecurringTemplate) => void
  onToggle: (id: string, currentStatus: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Active Templates</h3>
      {activeTemplates.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <Repeat className="h-8 w-8 opacity-40" />
          <p className="text-sm">No active recurring expenses.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              categories={categories}
              banks={banks}
              creditCards={creditCards}
              onEdit={onEdit}
              onToggle={() => onToggle(template.id, template.isActive)}
              onDelete={() => onDelete(template.id)}
            />
          ))}
        </div>
      )}

      {inactiveTemplates.length > 0 && (
        <>
          <h3 className="mt-8 text-lg font-medium">Inactive Templates</h3>
          <div className="grid gap-4 opacity-60 md:grid-cols-2 lg:grid-cols-3">
            {inactiveTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                categories={categories}
                banks={banks}
                creditCards={creditCards}
                onEdit={onEdit}
                onToggle={() => onToggle(template.id, template.isActive)}
                onDelete={() => onDelete(template.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
