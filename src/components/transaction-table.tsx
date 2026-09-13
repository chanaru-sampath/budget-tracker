import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from 'lucide-react'

import type { Category } from '@/hooks/use-categories'
import type { Transaction } from '@/hooks/use-transactions'

import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

export function TransactionTable({
  transactions,
  categories,
  onDelete,
}: {
  transactions: Transaction[]
  categories: Category[]
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground h-32 text-center">
                No transactions found. Add one to get started!
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId)
              const isIncome = tx.type === 'income'
              return (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground font-medium">
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {category ? (
                      <Badge variant="outline" className="gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.notes || '-'}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${isIncome ? 'text-emerald-600 dark:text-emerald-500' : 'text-foreground'}`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {isIncome ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="text-muted-foreground h-3 w-3" />
                      )}
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(tx.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
