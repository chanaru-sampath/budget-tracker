import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { CategoryCard } from '@/components/category-card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  type Category,
  categoriesQueryOptions,
  useAddCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-categories'
import { PRESET_COLORS } from '@/lib/constants'

export const Route = createFileRoute('/_app/categories')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(categoriesQueryOptions()),
  component: CategoriesPage,
})

const categorySchema = z.object({
  type: z.enum(['income', 'expense']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  color: z.string().min(1, 'Color is required'),
})

type CategoryForm = z.infer<typeof categorySchema>

function CategoriesPage() {
  const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions())
  const { mutate: addCategory } = useAddCategory()
  const { mutate: updateCategory } = useUpdateCategory()
  const { mutate: deleteCategory } = useDeleteCategory()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: 'expense',
      name: '',
      color: PRESET_COLORS[0],
    },
  })

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingId(category.id)
      form.reset({
        name: category.name,
        type: category.type,
        color: category.color,
      })
    } else {
      setEditingId(null)
      form.reset({
        name: '',
        type: 'expense',
        color: PRESET_COLORS[0],
      })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = (data: CategoryForm) => {
    if (editingId) {
      updateCategory({ id: editingId, ...data })
    } else {
      addCategory(data)
    }
    setIsDialogOpen(false)
  }

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Categories</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              className={`h-8 w-8 rounded-full border-2 transition-transform ${field.value === c ? 'border-primary scale-110' : 'border-transparent'}`}
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
                  {editingId ? 'Save Changes' : 'Create Category'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-foreground mb-4 text-lg font-semibold">Expense Categories</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {expenseCategories.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                onEdit={() => openDialog(c)}
                onDelete={() => deleteCategory(c.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-foreground mb-4 text-lg font-semibold">Income Categories</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {incomeCategories.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                onEdit={() => openDialog(c)}
                onDelete={() => deleteCategory(c.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
