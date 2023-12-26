import { filter, pairwise } from 'rxjs'
import { State, Store } from '../Store'

declare module '../Store' {
  interface Store<S extends State> {
    history: {
      undo: () => void
      redo: () => void
      go: (step: number) => void
      getPast: () => S[]
      getFuture: () => S[]
    }
  }
}

type CommandResult<R> =
  | {
      success: true
      result: R
      canUndo: boolean
      canRedo: boolean
    }
  | {
      success: false
      result?: R
      canUndo: boolean
      canRedo: boolean
    }

interface CMD<R> {
  execute: () => R
  unexecute: () => R
}

class CommandManager<R extends any = any> {
  get canUndo() {
    return this.executed.length > 0
  }

  get canRedo() {
    return this.unexecuted.length > 0
  }

  executed: CMD<R>[] = []
  unexecuted: CMD<R>[] = []

  execute(cmd: CMD<R>) {
    cmd.execute()
    this.executed.push(cmd)
    this.unexecuted = []
  }

  undo() {
    let result: R | undefined
    let success = false

    const cmd = this.executed.pop()
    if (cmd !== undefined) {
      result = cmd.unexecute()
      success = true
      this.unexecuted.unshift(cmd)
    }

    return {
      success,
      result,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    } as CommandResult<R>
  }

  redo() {
    let result: R | undefined
    let success = false

    const cmd = this.unexecuted.shift()
    if (cmd !== undefined) {
      result = cmd.execute()
      success = true
      this.executed.push(cmd)
    }

    return {
      success,
      result,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    } as CommandResult<R>
  }

  go(step: number) {
    let result: R | undefined
    let success = false

    if (step < 0 && this.canUndo) {
      this.unexecuted = this.executed.splice(step).concat(this.unexecuted)
      result = this.unexecuted[0].unexecute()
      success = true
    } else if (step > 0 && this.canRedo) {
      this.executed = this.executed.concat(this.unexecuted.splice(0, step))
      result = this.executed[this.executed.length - 1].execute()
      success = true
    }

    return {
      success,
      result,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    } as CommandResult<R>
  }
}

export interface HistoryOptions {
  limit?: number
}

/**
 * History Plugin
 */
function history<S extends State>(store: Store<S>, options?: HistoryOptions) {
  const { limit = Infinity } = options || {}
  const manager = new CommandManager<S>()
  let shouldIgnoreSub = false

  function setState(nextState: S) {
    shouldIgnoreSub = true
    store.setState(nextState, true)
    shouldIgnoreSub = false
  }

  store
    .select()
    .pipe(
      filter(() => !shouldIgnoreSub),
      pairwise()
    )
    .subscribe(([oldState, newState]) => {
      manager.executed.push({
        execute: () => newState,
        unexecute: () => oldState,
      })
      if (manager.executed.length > limit + 1) {
        manager.executed.shift()
      }
      manager.unexecuted = []
    })

  store.history = {
    undo: () => {
      const { success, result } = manager.undo()
      if (success) {
        setState(result)
        return true
      }
      return false
    },
    redo: () => {
      const { success, result } = manager.redo()
      console.log(result)

      if (success) {
        setState(result)
        return true
      }
      return false
    },
    go: (step: number) => {
      const { success, result } = manager.go(step)
      if (success) {
        setState(result)
        return true
      }
      return false
    },
    getPast: () => manager.executed.slice(0, -1).map(item => item.execute()),
    getFuture: () => manager.unexecuted.map(item => item.execute()),
  }
}

export default history
