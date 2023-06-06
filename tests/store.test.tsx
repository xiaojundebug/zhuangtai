import { expect, test, vi } from 'vitest'
import { Store } from 'zhuangtai'

class Counter extends Store<{ count: number; foo?: string }> {
  constructor() {
    super({ count: 0 })
  }

  increase() {
    this.setState({ count: this.state.count + 1 })
  }

  decrease() {
    this.setState({ count: this.state.count - 1 })
  }
}

const counter = new Counter()

test('increase twice, count should eq 2', () => {
  counter.increase()
  counter.increase()
  expect(counter.state.count).toBe(2)
})

test('decrease once, count should eq 1', () => {
  counter.decrease()
  expect(counter.state.count).toBe(1)
})

test('can batch updates', () => {
  counter.setState({ foo: 'abc' })
  expect(counter.state.count).toBe(1)
})

test('can overwrite updates', () => {
  counter.setState({ count: 0 }, true)
  expect(counter.state.count).toBe(0)
  expect(counter.state.foo).toBeUndefined()
})

test('store.state should eq store.getState()', () => {
  expect(counter.state).toBe(counter.getState())
})

test('should trigger subscriber function on count change', () => {
  const subscriberFn = vi.fn()
  counter.select(s => s.count).subscribe(subscriberFn)
  counter.setState({ count: 100 })
  expect(subscriberFn).toHaveBeenCalledWith(100)
})
