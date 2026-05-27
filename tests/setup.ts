import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Optional: mock next/navigation or next/image if they cause issues in rendering
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
