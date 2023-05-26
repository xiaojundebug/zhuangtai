import Model, { ExtractState } from '../Model'
import { Plugin } from '../Model'
import { echo } from '../utils'

export interface StateStorage {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}
export type Serizlizer = typeof JSON.stringify
export type Deserializer = typeof JSON.parse
export interface PersistOptions<T extends Model> {
  /**
   * 存到 storage 中的唯一的 key 值
   */
  name: string
  /**
   * 只保存需要的字段
   */
  reducer?: (state: ExtractState<T>) => Partial<ExtractState<T>>
  /**
   * 自定义 storage，默认使用 localStorage
   */
  getStorage?: () => StateStorage
  /**
   * 自定义序列化器
   */
  serializer?: Serizlizer
  /**
   * 自定义反序列化器
   */
  deserializer?: Deserializer
}

function resolveStorage(storage?: StateStorage) {
  return storage || localStorage
}

/**
 * state persist plugin
 */
function persist<T extends Model>(options: PersistOptions<T>) {
  const {
    name,
    reducer = echo,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options

  return (_ => ({
    onInit(initialState) {
      const storage = resolveStorage(options.getStorage?.())
      const persistedState = deserializer(storage.getItem(name) || '{}')
      return { ...initialState, ...persistedState }
    },
    afterChange(state) {
      const storage = resolveStorage(options.getStorage?.())
      storage.setItem(name, serializer(reducer(state)))
    },
  })) as Plugin<T>
}

export default persist
