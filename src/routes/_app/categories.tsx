import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { CategoryCard } from '@/components/category-card'
import { CategoryFormDialog } from '@/components/category-form-dialog'
import { Button } from '@/components/ui/button'
import {
  type Category,
  categoriesQueryOptions,
  useAddCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-categories'
import type { CategoryFormData } from '@/lib/schemas'

export const Route = createFileRoute('/_app/categories')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(categoriesQueryOptions()),
  component: CategoriesPage,
})

function CategoriesPage() {
  const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions())
  const { mutate: addCategory } = useAddCategory()
  const { mutate: updateCategory } = useUpdateCategory()
  const { mutate: deleteCategory } = useDeleteCategory()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const openDialog = (category?: Category) => {
    setEditingCategory(category ?? null)
    setIsDialogOpen(true)
  }

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategory({ id: editingCategory.id, ...data })
    } else {
      addCategory(data)
    }
    setIsDialogOpen(false)
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Categories</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <CategoryFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCategory={editingCategory}
        onSubmit={onSubmit}
      />

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
