# RSMWR

一个用 rxjs 实现的 react 状态管理工具。

## 特点

- 简单易用，TypeScript 类型声明完善，没有啰嗦的样板代码
- 状态原子化，没有重复的渲染
- 兼容 React 18 并发模式
- 数据处理逻辑（Model）可以和 React 组件完全分离，便于移植
- 基于 RxJS，便于有能力者扩展使用

## 快速使用

```tsx
// CounterModel
import { Model } from 'rsmwr'

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
  }

  decrease() {
    this.setState({ count: this.state.count - 1 })
  }
}

export const counter = new Counter()

// App.tsx
function App() {
  // 不用担心其他 state 变动会触发多余渲染，内部已经处理
  const count = useModel(counter, s => s.count)
  // or
  // const { count } = useModel(counter, ['count'])

  return (
    <div className="App">
      <p>count is: {count}</p>
      <div className="actions">
        <button onClick={() => counter.increase()}>increate</button>
        <button onClick={() => counter.decrease()}>decreate</button>
      </div>
    </div>
  )
}
```

## 介绍

### Model

Model 作为一个 class，其作用是管理数据的存放，处理数据的增删改查，原则上它是可以脱离 react 的。

#### 在一个 Model 中订阅其他 Model 数据

```ts
// A
class A extends Model<{ foo: string }> {
  constructor() {
    super({ foo: '' })
    // select 相当于是 rxjs 中 map + distinctUntilChanged 的简写方式，
    // 等同于 b.$state.pipe(map(state => state.bar), distinctUntilChanged())
    b.select(state => state.bar).subscribe(bar => {
      console.log(bar)
    })
  }
}
export const a = new A()
// B
class B extends Model<{ bar: number }> {
  constructor() {
    super({ bar: 0 })
  }
}
export const b = new B()
```

### useModel

react 自定义 hook，用于将 Model 中的 state 绑定到 react 组件。

支持多种写法如下

- 自由写法（使用选择器）

```ts
const count = useModel(counter, state => state.count)
```

- 懒人写法（通过 key 选择）

```ts
const { count } = useModel(counter, ['count'])
```

- 懒狗写法（不推荐，会导致多余渲染）

```ts
const state = useModel(counter)
```

第一种和第二种为推荐使用方式，不会导致多余渲染（默认通过浅比对来判断数据变动，你可以通过第三个参数传入自定义比对器）

