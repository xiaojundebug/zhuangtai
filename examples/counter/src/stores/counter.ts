import { Store, State, Plugin } from 'rsmwr'
import { immer, persist } from 'rsmwr/plugins'
import { sleep } from '../utils'
import { pairwise } from 'rxjs/operators'

// 设置全局默认插件，对所有 Store 生效
Store.setDefaultPlugins([immer()])

// 由于 immer 插件修改了 setState 的传参方式，我们需要扩展一下类型声明
declare module 'rsmwr' {
  interface Store<S extends State = any> {
    setState(state: Partial<S>, replace?: boolean): void
    setState(state: (draft: S) => void): void
  }
}

// 持久化插件
const persistPlugin = persist<Counter>({
  name: 'COUNTER_STATE',
  partialize: state => ({ count: state.count }),
  // 默认是 localStorage
  getStorage: () => sessionStorage,
  // 你可以使用该字段自定义序列化器
  serialize: JSON.stringify,
  // 你可以使用该字段自定义反序列化器
  deserialize: JSON.parse,
})

// 自定义插件
function createLogPlugin<T extends Store>() {
  return (store => {
    store.state$.pipe(pairwise()).subscribe(([prev, next]) => {
      console.info(`${store.constructor.name}:
%cprev state: %o
%cnext state: %o
      `, 'color: #999', prev, 'color: #22c55e', next)
    })
    return {}
  }) as Plugin<T>
}
export interface CounterState {
  count: number
  foo: string
  bar: string
}

class Counter extends Store<CounterState> {
  constructor() {
    // initial state
    super({ count: 0, foo: 'foo', bar: 'bar' }, { plugins: [persistPlugin, createLogPlugin()] })
  }

  increase() {
    this.setState({ count: this.state.count + 1 })
    // or
    // this.setState(s => {
    //   s.count++
    // })
    // or
    // this.setState(s => ({ ...this.state, count: s.count + 1 }))
  }

  async increaseAsync() {
    await sleep(500)
    this.setState({ count: this.state.count + 1 })
  }

  decrease() {
    this.setState({ count: this.state.count - 1 })
  }

  async decreaseAsync() {
    await sleep(500)
    this.setState({ count: this.state.count - 1 })
  }

  reset() {
    this.setState({ count: 0 })
  }
}

export const counter = new Counter()
