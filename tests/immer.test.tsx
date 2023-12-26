import { expect, test } from 'vitest'
import { Store } from 'zhuangtai'
import immer from 'zhuangtai/plugins/immer'

class MyStore extends Store<{ obj: Record<string, any> }> {
  constructor() {
    super({
      obj: {
        foo: 123,
        bar: 456,
      },
    })
    immer(this)
  }
}

const myStore = new MyStore()

test('no error throw', () => {
  expect(() =>
    myStore.setState(draft => {
      draft.obj.foo = 'hello'
    })
  ).not.toThrow()
})

test('should throw an error', () => {
  expect(() => (myStore.state.obj.foo = 'world')).toThrow()
})
