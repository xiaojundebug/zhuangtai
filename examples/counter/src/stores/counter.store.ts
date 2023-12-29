import { Store } from 'zhuangtai'
import immer from 'zhuangtai/plugins/immer'
import persist from 'zhuangtai/plugins/persist'
import { sleep } from '../utils'
import { pairwise } from 'rxjs/operators'

// 自定义插件
function logger(store: Store, scope: string) {
  store
    .select()
    .pipe(pairwise())
    .subscribe(([prev, next]) => {
      console.log(
        `${scope}:
%cprev state: %o
%cnext state: %o
      `,
        'color: #999',
        prev,
        'color: #22c55e',
        next
      )
    })
}

export interface CounterState {
  count: number
}

class Counter extends Store<CounterState> {
  constructor() {
    // initial state
    super({ count: 0 })

    // 在调用业务代码之前应用插件
    immer(this)
    persist(this, {
      name: 'COUNTER_STATE',
      // 只持久化指定的字段
      partialize: state => ({ count: state.count }),
      // 默认是 localStorage
      getStorage: () => sessionStorage,
      // 你可以使用该字段自定义序列化器
      serialize: JSON.stringify,
      // 你可以使用该字段自定义反序列化器
      deserialize: JSON.parse,
    })
    logger(this, 'Counter')
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
