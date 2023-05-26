import { useMemo } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import Model, { Comparer, Selector, State } from '../Model'
import { echo, returnFalse, shallowEqual } from '../utils'

type ModelWithReact<S extends State> = Model<S> & {
  getServerState?: () => S
}
type ValueType<T extends State, U extends keyof T | any> = U extends keyof T ? Pick<T, U> : U

function useModel<S extends State>(model: ModelWithReact<S>): S
function useModel<S extends State, V>(model: ModelWithReact<S>, selector: Selector<S, V>, comparer?: Comparer<V>): V
function useModel<S extends State, K extends keyof S>(model: ModelWithReact<S>, keys: K[], comparer?: Comparer<Pick<S, K>>): Pick<S, K>
function useModel<T extends State, U extends keyof T | any = T>(
  model: ModelWithReact<T>,
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
        const sub = model.state$.subscribe(cb)
        return () => sub.unsubscribe()
      },
      getState: model.getState.bind(model),
      getServerState: (model.getServerState || model.getState).bind(model),
    }
  }, [model])

  return useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState,
    selector,
    equalityFn,
  )
}

export default useModel
