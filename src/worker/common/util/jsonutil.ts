import { readFileSync } from 'fs'

export function readJSONDict<T>(fn: string, formatter: (val: string) => string = (val: string) => val): Record<string, T> {
  const res: Record<string, T> = {}
  
  try {
    Object.entries(JSON.parse(readFileSync(fn, 'utf-8'))).forEach(
      ([key, value]) => {
        res[formatter(key)] = value as T
      }
    )
  } catch (error) {
    console.log(`Error while reading file ${fn} -> ${error}`)
  }

  return res
}

export function printKeys(msg: string, dct: Record<string, any>): void {
  console.log(msg)
  Object.entries(dct).forEach(
    ([key]) => console.log(`${key}`)
  )
}

export function printValues(msg: string, dct: Record<string, any>): void {
  console.log(msg)
  Object.entries(dct).forEach(
    ([_, value]) => console.log(`${value}`)
  )
}

export function printElements(msg: string, dct: Record<string, any>): void {
  console.log(msg)
  Object.entries(dct).forEach(
    ([key, value]) => console.log(`${key}: ${value}`)
  )
}