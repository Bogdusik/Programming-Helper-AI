// Shared types for task-related components to avoid type mismatches

export interface TaskExample {
  input: string | number | boolean | null | Record<string, unknown> | unknown[]
  output: string | number | boolean | null | Record<string, unknown> | unknown[]
  explanation?: string
}

export interface TaskTestCase {
  input?: unknown
  output?: unknown
  testCases?: TaskTestCase[]
}

export interface TestResult {
  passed: boolean
  testCase?: unknown
  expected?: unknown
  error?: string
}

export interface TaskDataTyped {
  title: string
  description: string
  language: string
  difficulty: string
  category: string
  hints?: string[]
  starterCode?: string | null
  examples?: TaskExample[] | null
  constraints?: string[] | null
  testCases?: TaskTestCase | TaskTestCase[]
}

