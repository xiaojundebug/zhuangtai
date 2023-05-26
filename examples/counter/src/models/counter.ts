import { Model, State, setDefaultPlugins } from 'rsmwr'
import { immer, persist } from 'rsmwr/plugins'
import { sleep } from '../utils'

// 设置全局默认插件，对所有 Model 生效
setDefaultPlugins([immer()])

// 由于 immer 插件修改了 setState 的传参方式，我们需要扩展一下类型声明
declare module 'rsmwr' {
  export interface Model<S extends State = any> {
    setState(state: Partial<S>, replace?: boolean): void
    setState(state: (draft: S) => void): void
  }
}

// 持久化插件
const persistator = persist<Counter>({
  name: 'COUNTER_STATE',
  reducer: state => ({ count: state.count }),
  // 默认是 localStorage
  getStorage: () => sessionStorage,
  // 你可以使用该字段自定义序列化器
  serializer: JSON.stringify,
  // 你可以使用该字段自定义反序列化器
  deserializer: JSON.parse,
})

export interface CounterState {
  count: number
  foo: string
  bar: string
}

class Counter extends Model<CounterState> {
  constructor() {
    // initial state
    super({ count: 0, foo: 'foo', bar: 'bar' }, { plugins: [persistator] })
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
