import './App.css'
import { useModel } from 'rsmwr/react'
import { counter } from './models/counter'

function App() {
  const { count } = useModel(counter, s => ({ count: s.count }))
  // or
  // useModel(counter, ['count'])

  return (
    <div className="App">
      <p>count is: {count}</p>
      <div className="actions">
        <button onClick={() => counter.increase()}>increate</button>
        <button onClick={() => counter.decrease()}>decreate</button>
        <button onClick={() => counter.increaseAsync()}>increate (async)</button>
        <button onClick={() => counter.decreaseAsync()}>decreate (async)</button>
        <button onClick={() => counter.reset()}>reset</button>
      </div>
    </div>
  )
}

export default App
