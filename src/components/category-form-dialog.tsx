import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { Category } from '@/hooks/use-categories'
import { PRESET_COLORS } from '@/lib/constants'
import { type CategoryFormData, categorySchema } from '@/lib/schemas'

import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export function CategoryFormDialog({
  open,
  onOpenChange,
  editingCategory,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory: Category | null
  onSubmit: (data: CategoryFormData) => void
}) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { type: 'expense', name: '', color: PRESET_COLORS[0] },
  })

  useEffect(() => {
    if (editingCategory) {
      form.reset({ name: editingCategory.name, type: editingCategory.type, color: editingCategory.color })
    } else {
      form.reset({ type: 'expense', name: '', color: PRESET_COLORS[0] })
    }
  }, [editingCategory, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`h-8 w-8 rounded-full border-2 transition-transform ${
                            field.value === c ? 'border-primary scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                          onClick={() => field.onChange(c)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
