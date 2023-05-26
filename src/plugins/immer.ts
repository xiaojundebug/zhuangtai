import Model from '../Model'
import { Plugin } from '../Model'
import produce from 'immer'

const assign = produce((draft, part) => {
  Object.assign(draft || {}, part)
})

/**
 * immer plugin
 */
function immer<T extends Model>() {
  return (model => {
    const setFn = model.setState.bind(model)

    model.setState = function setState(state: Partial<T> | ((draft: T) => void), replace = false) {
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
