import './App.css'
import { useStore } from 'zhuangtai/react'
import { counter } from './stores/counter.store'

function App() {
  const { count } = useStore(counter, s => ({ count: s.count }))
  // or
  // useStore(counter, ['count'])

  return (
    <div className="App">
      <p>count is: {count}</p>
      <div className="actions">
        <button onClick={() => counter.increase()}>increase</button>
        <button onClick={() => counter.decrease()}>decrease</button>
        <button onClick={() => counter.increaseAsync()}>increase (async)</button>
        <button onClick={() => counter.decreaseAsync()}>decrease (async)</button>
        <button onClick={() => counter.reset()}>reset</button>
      </div>
    </div>
  )
}

export default App
