import { useMemo } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import Store, { Comparer, Selector, State } from '../Store'
import { echo, returnFalse, shallowEqual } from '../utils'

type StoreWithReact<S extends State> = Store<S> & {
  getServerState?: () => S
}
type ValueType<T extends State, U extends keyof T | any> = U extends keyof T ? Pick<T, U> : U

function useStore<S extends State>(store: StoreWithReact<S>): S
function useStore<S extends State, V>(store: StoreWithReact<S>, selector: Selector<S, V>, comparer?: Comparer<V>): V
function useStore<S extends State, K extends keyof S>(store: StoreWithReact<S>, keys: K[], comparer?: Comparer<Pick<S, K>>): Pick<S, K>
function useStore<T extends State, U extends keyof T | any = T>(
  store: StoreWithReact<T>,
  keysOrSelector?: U extends keyof T ? U[] : Selector<T, U>,
  comparer?: Comparer<ValueType<T, U>>,
): ValueType<T, U> {
  const isPickAll = !keysOrSelector
  const isSelector = typeof keysOrSelector === 'function'
  const selector: Selector<T, any> = !isPickAll
    ? isSelector
      ? keysOrSelector
      : s => {
          // keys to selector
          const keys = keysOrSelector as string[]
          const value = {} as Record<string, any>
          for (const k of keys) {
            value[k] = s[k]
          }
          return value
        }
    : echo // pick all
  const equalityFn = isPickAll ? returnFalse : comparer || shallowEqual
  const api = useMemo(() => {
    return {
      subscribe: (cb: () => void) => {
        const sub = store.select().subscribe(cb)
        return () => sub.unsubscribe()
      },
      getState: store.getState.bind(store),
      getServerState: (store.getServerState || store.getState).bind(store),
    }
  }, [store])

  return useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState,
    selector,
    equalityFn,
  )
}

export default useStore
