# zhuangtai

一个用 RxJS 实现的状态管理工具，暂且支持 React

<p>
  <img alt="stars" src="https://img.shields.io/github/stars/xiaojundebug/zhuangtai.svg?color=%2336be52">&nbsp;
  <img alt="contributors" src="https://img.shields.io/github/contributors/xiaojundebug/zhuangtai.svg?color=%23409eff">
</p>

## 特点

- 简单易用，TypeScript 类型声明完善，没有啰嗦的样板代码
- 状态原子化，没有重复的渲染
- 兼容 React 18 并发模式
- 数据处理逻辑（Store）可以和 React 组件完全分离，便于移植
- 基于 RxJS，便于有能力者扩展使用

## 快速上手

### 安装依赖

```bash
npm i zhuangtai rxjs
```

### 简单示例

```tsx
// counter.store.ts
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

### Getters

#### `state`

> Type: `S`

一个 getter，等同于 [store.getState()](#getState)

### 实例方法

#### `setState`

> Type: `(state: Partial<S>, replace?: boolean) => void`

设置 state，默认通过 `Object.assign` 和原属性进行合并，你可以通过 `replace` 参数跳过该行为

#### `getState`

> Type: `() => S`

获取 Store 最新的 state

#### `select`

> Type: `(selector?: Selector<S, V> | null, comparer?: Comparer<V>) => Observable<V>`

根据 selector 创建一个 RxJS Observable，一般用来监听某些属性的变动，selector 传空表示监听任意属性变动，
你还可以通过自定义 `comparer` 来决定 observable 的值是否发出，默认是 `Object.is`

```ts
// 监听 count 变动
const count$ = store.select(state => state.count)
count$.subscribe(val => {
  console.log(`count is: ${val}`)
})
```

_`select` 方法其实是 RxJS 中 `map` 与 `distinctUntilChanged` 的简写 👉 `observable.pipe(map(selector), distinctUntilChanged(comparer))`_

### 静态属性

#### `setDefaultPlugins`

> Type: `(plugins: Plugin[]): void`

设置全局默认插件，对所有 Store 生效，插件使用方式参考[此处](#Plugins)

## Plugins

可以通过插件机制对 Store 进行功能扩展，目前内置了 `immer` 与 `persist` 插件

### Immer Plugin

首先你需要安装 [immer](https://github.com/immerjs/immer)

```bash
npm i immer
```

```ts
import { Store, State } from 'zhuangtai'
import { immer } from 'zhuangtai/plugins'

// 由于 immer 插件修改了 setState 的传参方式，如果你是 typescript 用户，需要扩展一下类型声明
declare module 'zhuangtai' {
  interface Store<S extends State = any> {
    setState(state: Partial<S>, replace?: boolean): void
    setState(recipe: (draft: S) => void): void
  }
}

class Counter extends Store<{ count: number }> {
  constructor() {
    super({ count: 0 }, { plugins: [immer()] })
  }

  increase() {
    // immer 写法
    this.setState(s => {
      s.count++
    })
  }

  decrease() {
    // 普通写法
    this.setState({ count: this.state.count - 1 })
  }
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
  // ...
}
```

#### Options

##### `name`（必选）

> Type: `string`

存到 storage 中的唯一的 key 值

##### `partialize`（可选）

> Type: `(state: S) => Partial<S>`

> Default: `state => state`

只保存需要的字段，默认保存所有

##### `getStorage`（可选）

> Type: `() => StateStorage`

> Default: `localStorage`

自定义 storage

##### `serialize`（可选）

> Type: `Serizlizer`

> Default: `JSON.stringify`

自定义序列化器

##### `deserialize`（可选）

> Type: `Deserializer`

> Default: `JSON.parse`

自定义反序列化器

##### `version`（可选）

> Type: `number`

> Default: `0`

如果持久化的 state 版本与此处指定的版本不匹配，则跳过状态合并

### 自定义插件

你也可以根据业务需求开发自己的插件，让我们以 log 插件为例

```ts
import { Store, Plugin } from 'zhuangtai'
import { pairwise } from 'rxjs/operators'

function createLogPlugin<T extends Store>() {
  return (store => {
    store
      .select()
      .pipe(pairwise())
      .subscribe(([prev, next]) => {
        console.log(
          `${store.constructor.name}:
prev state: %o
next state: %o
      `,
          prev,
          next,
        )
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

<details>
<summary>怎样在本地运行此项目？</summary>

此项目没有使用 monorepo 进行管理，你可以通过 `npm link` 方式进行本地开发 & 预览

1. 进入项目根目录，执行 `npm link`，代码修改后执行 `npm run build`
2. 进入 `examples/counter` 文件夹，先执行 `npm link zhuangtai`，然后执行 `npm run dev`

</details>

<details>
<summary>怎样在 SSR 框架中使用？</summary>

正常来说 `zhuangtai` 可以在 SSR 框架中使用，但是 `persist` 插件会有些问题，因为 `persist` 插件会在服务端渲染期间访问浏览器 storage，这将导致服务端渲染失败，你需要自定义 `getStorage` 字段来修复此问题，参考以下代码

```ts
const dummyStorage = {
  getItem: (name: string) => null,
  setItem: (name: string, value: string) => {},
  removeItem: (name: string) => {},
}
const isBrowser = typeof window !== 'undefined'
const myStorage = isBrowser ? localStorage : dummyStorage

const persistPlugin = persist<Counter>({
  // ...
  getStorage: () => myStorage,
})
```

除此之外还有一些其它问题，服务端和客户端渲染时由于状态不一致可能会导致“水合错误”（客户端拿到的是持久化后的状态，但服务端渲染时拿不到），在 `nextjs` 中我们可以通过[动态组件](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)的方式解决此问题

</details>

<details>
<summary>怎样配合 react-tracked 使用？</summary>

如果你觉得使用选择器的方式太过繁琐，但是不传入选择器又会产生多余渲染，那么 [react-tracked](https://github.com/dai-shi/react-tracked) 是一个不错的选择，它会跟踪你真正使用的 state，未使用的 state 变动时不会触发组件渲染

首先你需要先安装它

```bash
npm i react-tracked
```

在 `zhuangtai` 中使用 `react-tracked` 需要做一些适配操作，参考下方代码

```tsx
import { State, Store } from 'zhuangtai'
import { useStore } from 'zhuangtai/react'
import { createTrackedSelector } from 'react-tracked'

// 你可以把这个函数抽离到公共模块中，该函数时是为了适配 createTrackedSelector
function createUseSelector<S extends State>(store: Store<S>) {
  return useStore.bind(null, store as any) as unknown as <V>(selector: (state: S) => V) => V
}

class MyStore extends Store<{ foo: string; bar: number }> {
  constructor() {
    super({ foo: 'abc', bar: 123 })
  }
  // ...
}

const myStore = new MyStore()
const useMyStore = createTrackedSelector(createUseSelector(myStore))

const App = () => {
  const state = useMyStore()

  // 这里只使用了 foo，所以 bar 变动时候时不会触发渲染的
  return (
    <div>
      <p>foo: {state.foo}</p>
    </div>
  )
}
```

</details>
