export function SummaryCard({
  title,
  amount,
  type,
}: {
  title: string
  amount: string
  type: 'income' | 'expense' | 'net'
}) {
  const getColors = () => {
    switch (type) {
      case 'income':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      case 'expense':
        return 'text-rose-600 bg-rose-50 border-rose-100'
      case 'net':
        return 'text-slate-900 bg-slate-50 border-slate-100'
    }
  }

  return (
    <div className={`p-5 rounded-xl border ${getColors()}`}>
      <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold">LKR {amount}</p>
    </div>
  )
}
