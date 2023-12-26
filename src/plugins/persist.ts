import { State, Store } from '../Store'
import { echo } from '../utils'

export interface StateStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}
export type Serizlizer = (...args: any[]) => any
export type Deserializer = (...args: any[]) => any
export type StorageValue<S> = {
  state: S
  version?: number
}
export interface PersistOptions<S extends State> {
  /**
   * 存到 storage 中的唯一的 key 值
   */
  name: string
  /**
   * 只保存需要的字段
   */
  partialize?: (state: S) => Partial<S>
  /**
   * 自定义 storage，默认使用 localStorage
   */
  getStorage?: () => StateStorage
  /**
   * 自定义序列化器
   */
  serialize?: Serizlizer
  /**
   * 自定义反序列化器
   */
  deserialize?: Deserializer
  /**
   * 如果持久化的 state 版本与此处指定的版本不匹配，则跳过状态合并
   */
  version?: number
}

function resolveStorage(storage?: StateStorage) {
  return storage || localStorage
}

/**
 * State Persistence Plugin
 */
function persist<S extends State>(store: Store<S>, options: PersistOptions<S>) {
  const {
    name,
    partialize = echo,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    version = 0,
  } = options

  const currentState = store.getState()
  const storage = resolveStorage(options.getStorage?.())
  const serializedValue = storage.getItem(name)

  if (serializedValue) {
    const deserializedStorageValue = deserialize(serializedValue) as StorageValue<S>
    if (deserializedStorageValue.version === version) {
      store.setState({ ...currentState, ...deserializedStorageValue.state })
    }
  }

  store.select().subscribe(state => {
    const storage = resolveStorage(options.getStorage?.())
    storage.setItem(name, serialize({ state: partialize(state), version }))
  })
}

export default persist
