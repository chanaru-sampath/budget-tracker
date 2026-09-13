import { Link } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Category } from '@/hooks/use-categories'
import type { Transaction } from '@/hooks/use-transactions'

type RecentTransactionsProps = {
  transactions: Transaction[]
  categories: Category[]
  currency: string
}

export function RecentTransactions({ transactions, categories, currency }: RecentTransactionsProps) {
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest activity for the selected month</CardDescription>
        <CardAction>
          <Link to="/transactions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-2 text-sm">No transactions for this month.</p>
            <Link to="/transactions">
              <Button variant="outline" size="sm">
                Add your first transaction
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId)
                const isIncome = tx.type === 'income'
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground font-medium">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <Badge variant="outline" className="gap-1.5">
                          <div className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
                          {category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{tx.notes || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div
                        className={`flex items-center justify-end gap-1 font-medium tabular-nums ${
                          isIncome ? 'text-emerald-600' : 'text-foreground'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="text-muted-foreground size-3.5" />
                        )}
                        {currency}{' '}
                        {tx.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
