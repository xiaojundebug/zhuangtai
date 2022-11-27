import { Model } from 'rsmwr'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface CounterState {
  count: number
}

class Counter extends Model<CounterState> {
  constructor() {
    // initial state
    super({ count: 0 })
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
