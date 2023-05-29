import type { Observable } from 'rxjs'
import { BehaviorSubject } from 'rxjs'
import { map, distinctUntilChanged } from 'rxjs/operators'
import { echo } from './utils'

export type State = Record<string, any>
export type ExtractState<T extends Store> = T extends { getState: () => infer S } ? S : never
export type Selector<S extends State, V> = (state: S) => V
export type Comparer<V> = (previous: V, current: V) => boolean
export type Plugin<T extends Store = any> = (store: T) => {
  onInit?: (initialState?: ExtractState<T>) => T
  afterChange?: (state: ExtractState<T>) => void
}

let DEFAULT_PLUGINS: Plugin[] = []

class Store<S extends State = any> {
  readonly state$ = new BehaviorSubject({} as S)
  private readonly plugins: ReturnType<Plugin>[] = []

  get state() {
    return this.getState()
  }

  constructor(initialState?: S, options?: { plugins?: Plugin[] }) {
    const { plugins = [] } = options || {}

    this.plugins = DEFAULT_PLUGINS.concat(plugins).map(plugin => plugin(this))

    const finalInitialState = this.plugins.reduce((result, plugin) => {
      const { onInit = echo } = plugin
      return onInit(result)
    }, initialState)

    if (finalInitialState) {
      this.setState(finalInitialState)
    }
  }

  select<V>(selector: Selector<S, V>, comparer?: Comparer<V>): Observable<V> {
    return this.state$.pipe(map(selector), distinctUntilChanged(comparer))
  }

  setState(state: Partial<S>, replace = false) {
    const original = this.getState()

    if (original === state) {
      return
    }

    const nextState = (replace ? state : { ...original, ...state }) as S

    this.state$.next(nextState)

    for (const plugin of this.plugins) {
      const { afterChange } = plugin
      afterChange?.(nextState)
    }
  }

  getState(): S {
    return this.state$.value
  }

  destroy() {
    this.state$.complete()
  }

  static setDefaultPlugins(plugins: Plugin[]) {
    DEFAULT_PLUGINS = plugins
  }
}

export default Store
