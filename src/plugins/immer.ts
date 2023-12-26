import { State, Store } from '../Store'
import { produce } from 'immer'

declare module '../Store' {
  interface Store<S extends State = any> {
    setState(state: Partial<S>, replace?: boolean): void
    // @ts-ignore
    setState(state: (draft: S) => void): void
  }
}

const mergeState = produce((draft, ...rest) => {
  Object.assign(draft || {}, ...rest)
})

/**
 * Immer Plugin
 */
function immer<S extends State>(store: Store<S>) {
  const currentState = store.getState()
  const setFn = store.setState.bind(store)

  store.setState = function setState(
    stateOrRecipe: Partial<S> | ((draft: S) => void),
    replace = false
  ) {
    const original = this.getState()

    if (original === stateOrRecipe) {
      return false
    }

    const nextState =
      typeof stateOrRecipe === 'function'
        ? produce(original, stateOrRecipe)
        : mergeState(replace ? {} : original, stateOrRecipe)

    return setFn(nextState, true)
  }

  store.setState(mergeState(currentState))
}

export default immer
