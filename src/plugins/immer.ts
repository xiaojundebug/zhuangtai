import Store, { Plugin } from '../Store'
import produce from 'immer'

const assign = produce((draft, part) => {
  Object.assign(draft || {}, part)
})

/**
 * immer plugin
 */
function immer<T extends Store>() {
  return (store => {
    const setFn = store.setState.bind(store)

    store.setState = function setState(state: Partial<T> | ((draft: T) => void), replace = false) {
      const original = this.getState()

      if (original === state) {
        return
      }

      const nextState =
        typeof state === 'function'
          ? produce(original, state)
          : assign(replace ? {} : original, state)

      setFn(nextState, true)
    }

    return {}
  }) as Plugin<T>
}

export default immer
