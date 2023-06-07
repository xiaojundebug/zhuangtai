import Store, { ExtractState, Plugin } from '../Store'
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
export interface PersistOptions<T extends Store> {
  /**
   * 存到 storage 中的唯一的 key 值
   */
  name: string
  /**
   * 只保存需要的字段
   */
  partialize?: (state: ExtractState<T>) => Partial<ExtractState<T>>
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
 * state persist plugin
 */
function persist<T extends Store>(options: PersistOptions<T>) {
  const {
    name,
    partialize = echo,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    version = 0,
  } = options

  return (_ => ({
    onInit(initialState) {
      const storage = resolveStorage(options.getStorage?.())
      const serializedValue = storage.getItem(name)

      if (!serializedValue) {
        return initialState
      }

      const deserializedStorageValue = deserialize(serializedValue) as StorageValue<ExtractState<T>>

      if (deserializedStorageValue.version !== version) {
        return initialState
      }

      return { ...initialState, ...deserializedStorageValue.state }
    },
    afterChange(state) {
      const storage = resolveStorage(options.getStorage?.())
      storage.setItem(name, serialize({ state: partialize(state), version }))
    },
  })) as Plugin<T>
}

export default persist
