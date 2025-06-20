import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import SidebarNav from '../components/sidebar-nav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/'
}))

test('renders nav links', () => {
  render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <SidebarNav />
    </ThemeProvider>
  )
  expect(screen.getByLabelText(/dashboard/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/projects/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/compare/i)).toBeInTheDocument()
})
