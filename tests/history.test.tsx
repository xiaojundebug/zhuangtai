import { expect, test } from 'vitest'
import { Store } from 'zhuangtai'
import history from 'zhuangtai/plugins/history'

class Counter extends Store<{ count: number }> {
  constructor() {
    super({ count: 0 })
    history(this, { limit: 5 })
  }

  increase() {
    this.setState({ count: this.state.count + 1 })
  }

  decrease() {
    this.setState({ count: this.state.count - 1 })
  }
}

const counter = new Counter()

test('test undo()', () => {
  counter.increase()
  counter.increase()
  counter.history.undo()
  counter.history.undo()
  expect(counter.state.count).toBe(0)
})

test('test redo()', () => {
  counter.history.redo()
  expect(counter.state.count).toBe(1)
})

test('test go()', () => {
  counter.history.go(-1)
  expect(counter.state.count).toBe(0)
})

test('test getPast()', () => {
  expect(counter.history.getPast()).toEqual([])
})

test('test getFuture()', () => {
  expect(counter.history.getFuture()).toEqual([{ count: 1 }, { count: 2 }])
})

test('test options.limit', () => {
  let i = 0

  while (i++ < 10) {
    counter.increase()
  }

  expect(counter.history.getPast().length).toBe(5)
  expect(counter.history.getPast()[0].count).toBe(5)
})

test('test execution result', () => {
  expect(counter.history.redo()).toBeFalsy()
  expect(counter.history.undo()).toBeTruthy()
  expect(counter.history.go(0)).toBeFalsy()
  expect(counter.history.go(-1)).toBeTruthy()
})
