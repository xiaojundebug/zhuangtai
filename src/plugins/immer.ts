import Store, { Plugin } from '../Store'
import produce from 'immer'

const mergeState = produce((draft, ...rest) => {
  Object.assign(draft || {}, ...rest)
})

/**
 * immer plugin
 */
function immer<T extends Store>() {
  return (store => {
    const setFn = store.setState.bind(store)

    store.setState = function setState(
      stateOrRecipe: Partial<T> | ((draft: T) => void),
      replace = false
    ) {
      const original = this.getState()

      if (original === stateOrRecipe) {
        return
      }

      const nextState =
        typeof stateOrRecipe === 'function'
          ? produce(original, stateOrRecipe)
          : mergeState(replace ? {} : original, stateOrRecipe)

      setFn(nextState, true)
    }

    return {}
  }) as Plugin<T>
}

export default immer
