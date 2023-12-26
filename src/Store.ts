import type { Observable } from 'rxjs'
import { BehaviorSubject } from 'rxjs'
import { map, distinctUntilChanged } from 'rxjs/operators'
import { echo } from './utils'

export type State = Record<string, any>
export type ExtractState<T extends Store> = T extends { getState: () => infer S } ? S : never
export type Selector<S extends State, V> = (state: S) => V
export type Comparer<V> = (previous: V, current: V) => boolean

export interface Store<S extends State = any> {
  getState(): S
  setState(state: Partial<S>, replace?: boolean): void
  select<V = S>(selector?: Selector<S, V> | null, comparer?: Comparer<V>): Observable<V>
}

export class Store<S extends State = any> {
  private readonly state$ = new BehaviorSubject({} as S)

  constructor(initialState?: S) {

    if (initialState) {
      this.setState(initialState)
    }
  }

  get state() {
    return this.getState()
  }

  getState() {
    return this.state$.getValue()
  }

  setState(state: Partial<S>, replace = false) {
    const original = this.getState()

    if (original === state) {
      return
    }

    const nextState = (replace ? state : { ...original, ...state }) as S

    this.state$.next(nextState)
  }

  select<V = S>(selector?: Selector<S, V> | null, comparer?: Comparer<V>) {
    return this.state$.pipe(
      map(selector || (echo as Selector<S, V>)),
      distinctUntilChanged(comparer)
    )
  }
}
