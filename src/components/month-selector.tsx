import { addMonths, format, parse, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useUIStore } from '@/stores/use-ui-store'

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useUIStore()

  const currentDate = parse(selectedMonth, 'yyyy-MM', new Date())

  const handlePrev = () => {
    setSelectedMonth(format(subMonths(currentDate, 1), 'yyyy-MM'))
  }

  const handleNext = () => {
    setSelectedMonth(format(addMonths(currentDate, 1), 'yyyy-MM'))
  }

  const handleCurrent = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'))
  }

  return (
    <div className="flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200">
      <button
        onClick={handlePrev}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={handleCurrent}
        className="px-3 text-sm font-medium text-slate-700 w-[120px] text-center hover:text-slate-900"
      >
        {format(currentDate, 'MMMM yyyy')}
      </button>

      <button
        onClick={handleNext}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all shadow-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
