import type { Observable } from 'rxjs'
import { BehaviorSubject } from 'rxjs'
import { map, distinctUntilChanged } from 'rxjs/operators'
import produce from 'immer'

const assign = produce((draft, part) => {
  Object.assign(draft || {}, part)
})

export type State = Record<string, any>
export type Selector<S extends State, V> = (state: S) => V
export type Comparer<V> = (previous: V, current: V) => boolean

class Model<S extends State = any> {
  readonly state$ = new BehaviorSubject({} as S)

  get state() {
    return this.getState()
  }

  constructor(state?: S) {
    if (state) {
      this.setState(state)
    }
  }

  public select<V>(selector: Selector<S, V>, comparer?: Comparer<V>): Observable<V> {
    return this.state$.pipe(map(selector), distinctUntilChanged(comparer))
  }

  setState(state: Partial<S>, replace?: boolean): void
  setState(state: (draft: S) => void): void
  setState(state: Partial<S> | ((draft: S) => void), replace = false) {
    const original = this.getState()

    if (original === state) {
      return
    }

    // prettier-ignore
    const nextState =
      typeof state === 'function'
        ? produce(original, state)
        : assign(replace ? {} : original, state)

    this.state$.next(nextState)
  }

  getState(): S {
    return this.state$.value
  }
}

export default Model
