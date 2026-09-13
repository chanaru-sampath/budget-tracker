import { Edit2, Trash2 } from 'lucide-react'

import type { Category } from '@/hooks/use-categories'

import { Button } from './ui/button'
import { Card, CardHeader, CardTitle } from './ui/card'

export function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="py-2 group border-border shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
          <CardTitle className="text-base font-medium">{category.name}</CardTitle>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="text-muted-foreground h-7 w-7" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
