import { describe, expect, it } from 'vitest'
import { mergeWidgets, type WidgetConfig } from './widget.store'

const defaults: WidgetConfig[] = [
  { id: '1', type: 'tasks', enabled: true, order: 0 },
  { id: '2', type: 'github', enabled: true, order: 1 },
  { id: '3', type: 'attention', enabled: true, order: 2 },
]

describe('mergeWidgets', () => {
  it('uses the defaults when nothing was saved', () => {
    expect(mergeWidgets(undefined, defaults)).toEqual(defaults)
  })

  it('appends a widget added after the layout was saved, and keeps the saved arrangement', () => {
    const saved: WidgetConfig[] = [
      { id: '2', type: 'github', enabled: false, order: 0 },
      { id: '1', type: 'tasks', enabled: true, order: 1 },
    ]
    expect(mergeWidgets(saved, defaults).map((w) => [w.type, w.enabled, w.order])).toEqual([
      ['github', false, 0],
      ['tasks', true, 1],
      ['attention', true, 2],
    ])
  })

  it('drops widget types that no longer exist', () => {
    const saved = [{ id: '9', type: 'docker', enabled: true, order: 0 }, ...defaults] as unknown as WidgetConfig[]
    expect(mergeWidgets(saved, defaults).map((w) => w.type)).toEqual(['tasks', 'github', 'attention'])
  })

  it('renumbers the order so it is always 0 to n-1', () => {
    const saved: WidgetConfig[] = [{ id: '1', type: 'tasks', enabled: true, order: 7 }, { id: '2', type: 'github', enabled: true, order: 3 }]
    expect(mergeWidgets(saved, defaults).map((w) => [w.type, w.order])).toEqual([['github', 0], ['tasks', 1], ['attention', 2]])
  })
})
