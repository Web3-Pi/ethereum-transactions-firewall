export function currentDateStr(): string {
  const date = new Date()
  const res = date.toISOString()

  return `${res.substring(8,10)}-${res.substring(5,7)}-${res.substring(2,4)} ${res.substring(11,19)}`
}