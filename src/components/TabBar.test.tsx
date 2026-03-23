import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TabBar from './TabBar'

const TABS = [
  { key: 'main', label: 'Principal' },
  { key: 'mobility', label: 'Mobilidade' },
]

describe('TabBar', () => {
  it('renders all tab labels', () => {
    render(<TabBar tabs={TABS} active="main" onChange={() => {}} />)
    expect(screen.getByText('Principal')).toBeInTheDocument()
    expect(screen.getByText('Mobilidade')).toBeInTheDocument()
  })

  it('marks the active tab with aria-selected', () => {
    render(<TabBar tabs={TABS} active="main" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Principal' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Mobilidade' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the correct key when a tab is clicked', async () => {
    const onChange = vi.fn()
    render(<TabBar tabs={TABS} active="main" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Mobilidade' }))
    expect(onChange).toHaveBeenCalledWith('mobility')
  })

  it('does NOT call onChange when the already-active tab is clicked', async () => {
    const onChange = vi.fn()
    render(<TabBar tabs={TABS} active="main" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Principal' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
