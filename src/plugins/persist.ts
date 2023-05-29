import Store, { ExtractState } from '../Store'
import { Plugin } from '../Store'
import { echo } from '../utils'

export interface StateStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}
export type Serizlizer = (value: any, ...rest: any[]) => string
export type Deserializer = (text: string, ...rest: any[]) => any
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
}

function resolveStorage(storage?: StateStorage) {
  return storage || localStorage
}

/**
 * state persist plugin
 */
function persist<T extends Store>(options: PersistOptions<T>) {
  const { name, partialize = echo, serialize = JSON.stringify, deserialize = JSON.parse } = options

  return (_ => ({
    onInit(initialState) {
      const storage = resolveStorage(options.getStorage?.())
      const persistedState = deserialize(storage.getItem(name) || '{}')
      return { ...initialState, ...persistedState }
    },
    afterChange(state) {
      const storage = resolveStorage(options.getStorage?.())
      storage.setItem(name, serialize(partialize(state)))
    },
  })) as Plugin<T>
}

export default persist
