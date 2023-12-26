import { expect, test } from 'vitest'
import { Store } from 'zhuangtai'
import persist from 'zhuangtai/plugins/persist'

const serialize = JSON.stringify
const deserialize = JSON.parse

const DUMMY_STATE_KEY = 'DUMMY_STATE'
const map = new Map<string, string>()

const dummyStorage = {
  getItem: (name: string) => map.get(name) as string | null,
  setItem: (name: string, value: string) => map.set(name, value),
  removeItem: (name: string) => map.delete(name),
  clear: () => map.clear(),
}

class Counter extends Store<{ count: number; foo?: string; bar?: boolean }> {
  constructor() {
    super({ count: 0 })
  }
}

test('can merge state from dummy storage', () => {
  dummyStorage.clear()
  dummyStorage.setItem(DUMMY_STATE_KEY, serialize({ version: 0, state: { count: 100 } }))
  const store = new Counter()
  persist(store, {
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
  })
  expect(store.state).toEqual({ count: 100 })
})

test('if version different, persisted state should ignored', () => {
  dummyStorage.clear()
  dummyStorage.setItem(DUMMY_STATE_KEY, serialize({ version: 1, state: { count: 100 } }))
  const store = new Counter()
  persist(store, {
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
    version: 2,
  })
  expect(store.state.count).toEqual(0)
})

test('can persist state to dummy storage', () => {
  dummyStorage.clear()
  const store = new Counter()
  persist(store, {
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
  })
  store.setState({ count: 100 })
  expect(deserialize(dummyStorage.getItem(DUMMY_STATE_KEY)!)).toEqual({
    version: 0,
    state: { count: 100 },
  })
})

test('can persist specified state', () => {
  dummyStorage.clear()
  const store = new Counter()
  persist(store, {
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
    partialize: s => ({ count: s.count }),
  })
  store.setState({ count: 100, foo: 'balabala' })
  expect(deserialize(dummyStorage.getItem(DUMMY_STATE_KEY)!)).toEqual({
    version: 0,
    state: { count: 100 },
  })
})

test('can custom serializer and deserializer', () => {
  dummyStorage.clear()
  dummyStorage.setItem(DUMMY_STATE_KEY, serialize({ version: 0, state: { count: 100 } }))
  const store = new Counter()
  persist(store, {
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
    serialize: () => serialize({ version: 0, state: { count: 6 } }),
    deserialize: () => ({ version: 0, state: { count: 9 } }),
  })
  expect(store.state.count).toEqual(9)
  store.setState({ count: 100 })
  expect(dummyStorage.getItem(DUMMY_STATE_KEY)).toEqual(
    serialize({ version: 0, state: { count: 6 } })
  )
})
