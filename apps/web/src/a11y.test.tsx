import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithQuery } from '@/test/render'
import { useCommandStore } from '@/stores/command.store'
import { useMobileNavStore } from '@/stores/mobile-nav.store'
import { ApiError } from '@/lib/api'
import LoginPage from '@/app/login/page'
import ResetPasswordPage from '@/app/reset-password/page'
import SettingsPage from '@/app/(app)/settings/page'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Topbar } from '@/components/layout/topbar'
import { CommandPalette } from '@/components/layout/command-palette'
import { IntegrationCard } from '@/components/settings/integration-card'
import { TasksWidget } from '@/components/dashboard/widgets/tasks-widget'
import { GithubWidget } from '@/components/dashboard/widgets/github-widget'
import { ServerHealthWidget } from '@/components/dashboard/widgets/server-health-widget'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { TextField, PasswordField } from '@/components/ui/text-field'

const mocks = vi.hoisted(() => ({
  fetchApi: vi.fn(),
  pathname: '/projects',
  token: 'token' as string | null,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => (key === 'token' ? mocks.token : null) }),
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: { user: { name: 'Ada Lovelace', email: 'ada@example.com', image: '' } }, isPending: false }),
  signOut: vi.fn(),
  signIn: { email: vi.fn() },
  signUp: { email: vi.fn() },
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollIntoView ??= () => {}
  mocks.fetchApi.mockReset()
  mocks.pathname = '/projects'
  mocks.token = 'token'
})

afterEach(() => {
  cleanup()
  useCommandStore.setState({ isOpen: false })
  useMobileNavStore.setState({ isOpen: false })
})

const github = { id: 'i1', provider: 'github', enabled: true, metadata: { accountLogin: 'octo' }, updatedAt: '2026-10-14T00:00:00Z' }

describe('accessibility (axe, WCAG 2.2 A/AA + best practice)', () => {
  describe('authentication', () => {
    it('sign in', async () => {
      render(<LoginPage />)
      await expectNoA11yViolations()
    })

    it('forgot password', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
      await expectNoA11yViolations()
    })

    it('sign in with field errors showing', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      expect(await screen.findByText('Enter your email address.')).toBeInTheDocument()
      await expectNoA11yViolations()
    })

    it('reset password', async () => {
      render(<ResetPasswordPage />)
      await expectNoA11yViolations()
    })

    it('reset password with an invalid link', async () => {
      mocks.token = null
      render(<ResetPasswordPage />)
      await expectNoA11yViolations()
    })
  })

  describe('navigation', () => {
    it('desktop sidebar', async () => {
      render(<Sidebar />)
      await expectNoA11yViolations()
    })

    it('desktop sidebar collapsed', async () => {
      const user = userEvent.setup()
      render(<Sidebar />)
      await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
      await expectNoA11yViolations()
    })

    it('mobile drawer open', async () => {
      useMobileNavStore.setState({ isOpen: true })
      render(<MobileNav />)
      expect(await screen.findByRole('dialog', { name: 'DevOS' })).toBeInTheDocument()
      await expectNoA11yViolations()
    })

    it('topbar', async () => {
      render(<Topbar />)
      await expectNoA11yViolations()
    })

    it('command palette open', async () => {
      useCommandStore.setState({ isOpen: true })
      render(<CommandPalette />)
      expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
      await expectNoA11yViolations()
    })
  })

  describe('settings and integrations', () => {
    it('settings page with GitHub connected and Vercel not', async () => {
      mocks.fetchApi.mockResolvedValue([github])
      renderWithQuery(<SettingsPage />)
      expect(await screen.findByText('Account:')).toBeInTheDocument()
      await expectNoA11yViolations()
    })

    it('connect form with a token error', async () => {
      const user = userEvent.setup()
      mocks.fetchApi.mockRejectedValue(new ApiError(422, 'GitHub rejected this token.', 'INTEGRATION_TOKEN_INVALID'))
      renderWithQuery(<IntegrationCard provider="vercel" description="d" tokenHint="h" integration={undefined} withTeamId />)
      await user.type(screen.getByLabelText('Vercel access token'), 'bad')
      await user.click(screen.getByRole('button', { name: 'Connect' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('rejected')
      await expectNoA11yViolations()
    })
  })

  describe('dashboard widgets', () => {
    const config = { id: '1', type: 'tasks', enabled: true, order: 0 } as const

    it('tasks with open and completed items', async () => {
      mocks.fetchApi.mockResolvedValue([
        { id: 't1', title: 'Write docs', completed: false },
        { id: 't2', title: 'Ship it', completed: true },
      ])
      renderWithQuery(<TasksWidget config={config} />)
      expect(await screen.findByText('Write docs')).toBeInTheDocument()
      await expectNoA11yViolations()
    })

    it('tasks in an error state', async () => {
      mocks.fetchApi.mockRejectedValue(new ApiError(500, 'boom'))
      renderWithQuery(<TasksWidget config={config} />)
      // createQueryOptions retries once with a backoff before the error state appears.
      expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toBeInTheDocument()
      await expectNoA11yViolations()
    })

    it('GitHub activity, and each integration failure', async () => {
      mocks.fetchApi.mockResolvedValue([
        { id: '1', type: 'PushEvent', actor: { login: 'octo', avatarUrl: 'https://example.test/a.png' }, repo: { name: 'octo/app', url: 'https://github.com/octo/app' }, createdAt: '2026-10-14T09:00:00Z' },
      ])
      const { unmount } = renderWithQuery(<GithubWidget config={{ ...config, type: 'github' }} />)
      expect(await screen.findByText('app')).toBeInTheDocument()
      await expectNoA11yViolations()
      unmount()

      mocks.fetchApi.mockRejectedValue(new ApiError(424, 'x', 'TOKEN_REJECTED'))
      renderWithQuery(<GithubWidget config={{ ...config, type: 'github' }} />)
      expect(await screen.findByText(/rejected the saved token/)).toBeInTheDocument()
      await expectNoA11yViolations()
    })

    it('deployments list', async () => {
      mocks.fetchApi.mockResolvedValue([{ id: 'd1', name: 'web', url: 'web.vercel.app', href: 'https://web.vercel.app', state: 'READY', environment: 'production', createdAt: 1 }])
      renderWithQuery(<ServerHealthWidget config={{ ...config, type: 'server-health' }} />)
      expect(await screen.findByText('web.vercel.app')).toBeInTheDocument()
      await expectNoA11yViolations()
    })
  })

  describe('shared building blocks', () => {
    it('text and password fields with hint and error', async () => {
      render(
        <form>
          <TextField label="Email" error="Enter an email." hint="We never share it." />
          <PasswordField label="Password" hint="At least 8 characters." />
        </form>,
      )
      await expectNoA11yViolations()
    })

    it('sheet dialog', async () => {
      render(
        <Sheet open>
          <SheetContent>
            <SheetTitle>Edit project</SheetTitle>
            <TextField label="Name" />
          </SheetContent>
        </Sheet>,
      )
      expect(await screen.findByRole('dialog', { name: 'Edit project' })).toBeInTheDocument()
      await expectNoA11yViolations()
    })
  })
})

describe('keyboard and focus behaviour', () => {
  it('the command palette closes with Escape and returns focus to the control that opened it', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button onClick={() => useCommandStore.getState().setIsOpen(true)}>Open palette</button>
        <CommandPalette />
      </>,
    )
    const opener = screen.getByRole('button', { name: 'Open palette' })
    await user.click(opener)
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('the palette opens with Ctrl+K', async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    await user.keyboard('{Control>}k{/Control}')
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
  })

  it('the mobile drawer traps Escape and returns focus to its opener', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Topbar />
        <MobileNav />
      </>,
    )
    const opener = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(opener)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('the sidebar marks the current page and keeps the parent section active on sub-pages', () => {
    mocks.pathname = '/knowledge/notes/42'
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: 'Knowledge' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current')
  })

  it('the dashboard link is current only on the exact root path', () => {
    mocks.pathname = '/projects'
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('collapsing the sidebar keeps every link nameable and reports its state', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
  })

  it('a task can be toggled from the keyboard', async () => {
    const user = userEvent.setup()
    mocks.fetchApi.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return {}
      return [{ id: 't1', title: 'Write docs', completed: false }]
    })
    renderWithQuery(<TasksWidget config={{ id: '1', type: 'tasks', enabled: true, order: 0 }} />)

    const task = await screen.findByRole('button', { name: 'Write docs' })
    expect(task).toHaveAttribute('aria-pressed', 'false')
    task.focus()
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(mocks.fetchApi).toHaveBeenCalledWith('/workspace/todos/t1', { method: 'PATCH', body: JSON.stringify({ completed: true }) }),
    )
  })

  it('every form field error is announced and tied to its input', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveFocus()
    const error = await screen.findByText('Enter your email address.')
    expect(error).toHaveAttribute('role', 'alert')
    expect(email.getAttribute('aria-describedby')).toContain(error.id)
  })
})
