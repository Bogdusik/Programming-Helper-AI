import React from 'react'
import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Message from '../../components/Message'
import { renderWithProviders } from '../setup/test-utils'

describe('Message Component', () => {
  it('renders user message correctly', () => {
    const timestamp = new Date('2024-01-01T12:00:00')
    renderWithProviders(
      <Message 
        role="user" 
        content="Hello, this is a test message" 
        timestamp={timestamp}
      />
    )
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument()
    expect(screen.getByText(timestamp.toLocaleTimeString())).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    const timestamp = new Date('2024-01-01T12:00:00')
    renderWithProviders(
      <Message 
        role="assistant" 
        content="This is an AI response" 
        timestamp={timestamp}
      />
    )
    
    expect(screen.getByText('This is an AI response')).toBeInTheDocument()
    expect(screen.getByText(timestamp.toLocaleTimeString())).toBeInTheDocument()
  })

  it('displays user message with correct styling', () => {
    const { container } = renderWithProviders(
      <Message 
        role="user" 
        content="User message" 
        timestamp={new Date()}
      />
    )
    
    // Find the outer container div with flex class
    const messageContainer = container.querySelector('.flex.justify-end')
    expect(messageContainer).toBeInTheDocument()
  })

  it('displays assistant message with correct styling', () => {
    const { container } = renderWithProviders(
      <Message 
        role="assistant" 
        content="Assistant message" 
        timestamp={new Date()}
      />
    )
    
    // Find the outer container div with flex class
    const messageContainer = container.querySelector('.flex.justify-start')
    expect(messageContainer).toBeInTheDocument()
  })

  it('handles multi-line content correctly', () => {
    const multiLineContent = 'Line 1\nLine 2\nLine 3'
    renderWithProviders(
      <Message 
        role="user" 
        content={multiLineContent} 
        timestamp={new Date()}
      />
    )
    
    // Check that all lines are present (whitespace-pre-wrap preserves newlines)
    expect(screen.getByText(/Line 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Line 2/i)).toBeInTheDocument()
    expect(screen.getByText(/Line 3/i)).toBeInTheDocument()
  })

  it('displays timestamp in correct format', () => {
    const timestamp = new Date('2024-01-01T14:30:00')
    renderWithProviders(
      <Message 
        role="user" 
        content="Test" 
        timestamp={timestamp}
      />
    )
    
    expect(screen.getByText(timestamp.toLocaleTimeString())).toBeInTheDocument()
  })

  describe('markdown in assistant answers', () => {
    const render = (content: string) =>
      renderWithProviders(<Message role="assistant" content={content} timestamp={new Date()} />)

    it('renders **bold** as <strong> without the asterisks', () => {
      const { container } = render('Binary search is **O(log n)** on sorted data.')
      const strong = container.querySelector('strong')
      expect(strong).toHaveTextContent('O(log n)')
      expect(container).not.toHaveTextContent('**')
    })

    it('renders `inline code` as <code>', () => {
      const { container } = render('Use `Array.prototype.includes` here.')
      expect(container.querySelector('p code')).toHaveTextContent('Array.prototype.includes')
    })

    it('renders numbered and bulleted lists', () => {
      const { container } = render('Steps:\n1. Sort the array\n2. Split it in half\n\n- fast\n- simple')
      expect(container.querySelectorAll('ol > li')).toHaveLength(2)
      expect(container.querySelectorAll('ul > li')).toHaveLength(2)
      expect(screen.getByText('Split it in half')).toBeInTheDocument()
    })

    it('renders headings without the hashes', () => {
      const { container } = render('### Time complexity\nIt is logarithmic.')
      expect(container.querySelector('h3, h4, h5, h6')).toHaveTextContent('Time complexity')
      expect(container).not.toHaveTextContent('###')
    })

    it('keeps fenced code blocks with their language label', () => {
      const { container } = render('Example:\n```js\nconst x = **1**\n```')
      expect(screen.getByText('js')).toBeInTheDocument()
      expect(container.querySelector('pre code')).toHaveTextContent('const x = **1**')
    })

    it('renders HTML in the answer as text, not markup', () => {
      const { container } = render('<img src=x onerror=alert(1)> and <script>alert(1)</script>')
      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('script')).toBeNull()
      expect(container).toHaveTextContent('<script>alert(1)</script>')
    })
  })
})
