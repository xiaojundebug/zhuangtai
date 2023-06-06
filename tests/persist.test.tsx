import { expect, test } from 'vitest'
import { Store, Plugin } from 'zhuangtai'
import { persist } from 'zhuangtai/plugins'

const DUMMY_STATE_KEY = 'DUMMY_STATE'
const map = new Map<string, string>()

const dummyStorage = {
  getItem: (name: string) => map.get(name) as string | null,
  setItem: (name: string, value: string) => map.set(name, value),
  removeItem: (name: string) => map.delete(name),
  clear: () => map.clear(),
}

class MyStore extends Store<{ foo: number; bar: string }> {
  constructor(plugins: Plugin[]) {
    super({ foo: 1, bar: '2' }, { plugins })
  }
}

test('can merge state from dummy storage', () => {
  dummyStorage.clear()
  dummyStorage.setItem(DUMMY_STATE_KEY, '{"bar":"hello"}')
  const plugin = persist<MyStore>({
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
  })
  const store = new MyStore([plugin])
  expect(store.state).toEqual({ foo: 1, bar: 'hello' })
})

test('can persist state to dummy storage', () => {
  dummyStorage.clear()
  const plugin = persist<MyStore>({
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
  })
  const store = new MyStore([plugin])
  store.setState({ foo: 10 })
  expect(dummyStorage.getItem(DUMMY_STATE_KEY)).toEqual('{"foo":10,"bar":"2"}')
})

test('can persist specified state', () => {
  dummyStorage.clear()
  const plugin = persist<MyStore>({
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
    partialize: s => ({ foo: s.foo }),
  })
  const store = new MyStore([plugin])
  store.setState({ foo: 21 })
  expect(dummyStorage.getItem(DUMMY_STATE_KEY)).toEqual('{"foo":21}')
})

test('can custom serializer and deserializer', () => {
  dummyStorage.clear()
  const plugin = persist<MyStore>({
    name: DUMMY_STATE_KEY,
    getStorage: () => dummyStorage,
    serialize: () => '{"bar":"asdf"}',
    deserialize: () => ({ bar: 'qwer' }),
  })
  const store = new MyStore([plugin])
  expect(store.state.bar).toEqual('qwer')
  store.setState({ bar: 'alksjdfl;a;sdf' })
  expect(dummyStorage.getItem(DUMMY_STATE_KEY)).toEqual('{"bar":"asdf"}')
})
