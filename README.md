# zhuangtai

一个用 rxjs 实现的 react 状态管理工具

## 特点

- 简单易用，TypeScript 类型声明完善，没有啰嗦的样板代码
- 状态原子化，没有重复的渲染
- 兼容 React 18 并发模式
- 数据处理逻辑（Store）可以和 React 组件完全分离，便于移植
- 基于 RxJS，便于有能力者扩展使用

## 快速上手

```tsx
// CounterStore.ts
import { Store } from 'zhuangtai'

export interface CounterState {
  count: number
}

class Counter extends Store<CounterState> {
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
import { useStore } from 'zhuangtai/react'

function App() {
  // 不用担心其他 state 变动会触发多余渲染，内部已经处理
  const count = useStore(counter, s => s.count)

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

## Store

Store 作为一个 class，其作用是管理数据的存放，处理数据的增删改查，原则上它是可以脱离 react 的

### 简单示例

```ts
import { Store } from 'zhuangtai'

export interface CounterState {
  count: number
}

class Counter extends Store<CounterState> {
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
```

### 实例属性

#### `state`

> Type: `S`

一个 getter，等同于 [store.getState()](#getState)

#### `state$`

> Type: `BehaviorSubject<S>`

一个 RxJS BehaviorSubject，它的 value 是 state，熟悉 RxJS 者可以通过它进行一些高级操作

### 实例方法

#### `setState`

> Type: `(state: Partial<S>, replace?: boolean) => void`

设置 state，默认通过 `Object.assign` 和原属性进行合并，你可以通过 `replace` 参数跳过该行为

#### `getState`

> Type: `() => S`

获取 Store 最新的 state

#### `select`

> Type: `(selector: Selector<S, V>, comparer?: Comparer<V>) => Observable<V>`

根据 selector 创建一个 Observable，一般用来监听某些属性的变动

```ts
const count$ = store.select(state => state.count)
count$.subject(val => {
  console.log(`count is: ${val}`)
})
```

### 静态属性

#### `setDefaultPlugins`

> Type: `(plugins: Plugin[]): void`

设置全局默认插件，对所有 Store 生效，插件使用方式参考[此处](#Plugins)

## Plugins

可以通过插件机制对 Store 进行功能扩展，目前内置了 `immer` 与 `persist` 插件

### Immer Plugin

```ts
import { Store, State } from 'zhuangtai'
import { immer } from 'zhuangtai/plugins'

// 由于 immer 插件修改了 setState 的传参方式，如果你是 typescript 用户，需要扩展一下类型声明
declare module 'zhuangtai' {
  interface Store<S extends State = any> {
    setState(state: Partial<S>, replace?: boolean): void
    setState(state: (draft: S) => void): void
  }
}

class Counter extends Store<{ count: number }> {
  constructor() {
    super({ count: 0 }, { plugins: [immer()] })
  }
  // ...
}
```

### Persist Plugin

```ts
import { Store, State } from 'zhuangtai'
import { persist } from 'zhuangtai/plugins'

const persistator = persist<Counter>({
  name: 'COUNTER_STATE',
})

class Counter extends Store<{ count: number }> {
  constructor() {
    super({ count: 0 }, { plugins: [persistator] })
  }

  increase() {
    this.setState(s => {
      s.count++
    })
  }

  decrease() {
    this.setState(s => {
      s.count--
    })
  }
}
```

### 自定义插件

你也可以根据业务需求开发自己的插件，让我们以 log 插件为例

```ts
import { Store, Plugin } from 'zhuangtai'
import { pairwise } from 'rxjs/operators'

function createLogPlugin<T extends Store>() {
  return (store => {
    store.state$.pipe(pairwise()).subscribe(([prev, next]) => {
      console.info(`${store.constructor.name}:
prev state: %o
next state: %o
      `, prev, next)
    })
    return {}
  }) as Plugin<T>
}

class Counter extends Store<{ count: number }> {
  constructor() {
    super({ count: 0 }, { plugins: [createLogPlugin()] })
  }
  // ...
}
```

#### Options

##### `name`（必选）

> Type: `string`

存到 storage 中的唯一的 key 值

##### `partialize`（可选）

> Type: `(state: S) => Partial<S>`

只保存需要的字段，默认保存所有

##### `getStorage`（可选）

> Type: `() => StateStorage`

自定义 storage，默认使用 localStorage

##### `serialize`（可选）

> Type: `Serizlizer`

自定义序列化器，默认是 `JSON.stringify`

##### `deserialize`（可选）

> Type: `Deserializer`

自定义反序列化器，默认是 `JSON.parse`

---

## 与 React 一起使用

Store 只是一个普通 class，要想它在 react 中使用，必须用一种方法使两者关联起来

### `useStore`

react 自定义 hook，用于将 Store 中的 state 绑定到 react 组件

```tsx
import { useStore } from 'zhuangtai/react'
```

它支持多种传参方式

- 自由写法（使用选择器）

```ts
const count = useStore(counter, state => state.count)
```

- 懒人写法（通过 key 选择）

```ts
const { count } = useStore(counter, ['count'])
```

- 懒狗写法（不推荐，会导致多余渲染）

```ts
const state = useStore(counter)
```

第一种和第二种为推荐使用方式，不会导致多余渲染（默认通过浅比对来判断数据变动，你可以通过第三个参数传入自定义比对函数）

**一个使用自定义比对函数的例子**

```ts
import _ from 'lodash'

function deepEqual(a, b) {
  return _.isEqual(a, b)
}

const { foo, bar } = useStore(store, ['foo', 'bar'], deepEqual)
```

## 常见问题

...
