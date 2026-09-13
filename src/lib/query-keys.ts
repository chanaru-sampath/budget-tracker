export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    list: () => [...queryKeys.transactions.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.transactions.all, 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  installments: {
    all: ['installments'] as const,
    list: () => [...queryKeys.installments.all, 'list'] as const,
  },
  banks: {
    all: ['banks'] as const,
    list: () => [...queryKeys.banks.all, 'list'] as const,
  },
  creditCards: {
    all: ['credit-cards'] as const,
    list: () => [...queryKeys.creditCards.all, 'list'] as const,
  },
  recurring: {
    all: ['recurring'] as const,
    list: () => [...queryKeys.recurring.all, 'list'] as const,
  },
}
