import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Create a functional localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] ?? null
    },
  }
}

// Setup localStorage mock immediately (before any module loads)
const localStorageMock = createLocalStorageMock()
global.localStorage = localStorageMock as any

beforeEach(() => {
  // Clear localStorage before each test
  localStorageMock.clear()
})

afterEach(() => {
  cleanup()
})
