import { LayoutGrid, Table2 } from 'lucide-react'

import { Button } from './ui/button'

export type ViewMode = 'card' | 'table'

export function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  return (
    <div className="border-border flex items-center rounded-md border p-0.5">
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 transition-all ${
          view === 'card' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('card')}
        title="Card view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 transition-all ${
          view === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onChange('table')}
        title="Table view"
      >
        <Table2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
