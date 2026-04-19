import { describe, it, expect } from 'vitest'
import { node, format } from '../../../src/api/utils/tree.js'

describe('node', () => {
  it('creates a node with name, description, and empty children by default', () => {
    expect(node('root', 'Root node')).toEqual({ name: 'root', description: 'Root node', children: [] })
  })

  it('accepts explicit children', () => {
    const child = node('child', 'Child node')
    const root = node('root', 'Root', [child])
    expect(root.children).toHaveLength(1)
    expect(root.children[0]).toBe(child)
  })
})

describe('format (tree style)', () => {
  it('renders a leaf node with no children', () => {
    const out = format(node('root', 'A root'))
    expect(out).toContain('root')
    expect(out).toContain('A root')
  })

  it('renders children with tree connectors', () => {
    const root = node('root', 'Root', [
      node('a', 'First'),
      node('b', 'Last'),
    ])
    const out = format(root)
    expect(out).toContain('├──')
    expect(out).toContain('└──')
  })

  it('renders deeply nested children', () => {
    const root = node('root', 'Root', [
      node('a', 'A', [
        node('a1', 'A1'),
      ]),
    ])
    const out = format(root)
    expect(out).toContain('a1')
  })

  it('matches snapshot', () => {
    const root = node('root', 'Root', [
      node('src', 'Source files', [
        node('index', 'Entry point'),
        node('utils', 'Utilities'),
      ]),
      node('dist', 'Output'),
    ])
    expect(format(root)).toMatchSnapshot()
  })
})

describe('format (list style)', () => {
  it('renders nodes as markdown bold items', () => {
    const root = node('root', 'Root', [node('child', 'A child')])
    const out = format(root, { style: 'list' })
    expect(out).toContain('**root**')
    expect(out).toContain('**child**')
  })

  it('indents children by two spaces per depth level', () => {
    const root = node('root', 'Root', [node('child', 'Child')])
    const out = format(root, { style: 'list' })
    const lines = out.split('\n')
    const childLine = lines.find(l => l.includes('child'))
    expect(childLine).toMatch(/^  /)
  })

  it('respects custom bullet character', () => {
    const root = node('root', 'Root')
    const out = format(root, { style: 'list', bullet: '*' })
    expect(out).toContain('* **root**')
  })
})
