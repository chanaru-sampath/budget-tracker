export function mapFields(source: Record<string, unknown>, fieldMap: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fieldMap)
      .filter(([key]) => source[key] !== undefined)
      .map(([key, dbKey]) => [dbKey, source[key]]),
  )
}
