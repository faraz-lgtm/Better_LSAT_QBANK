import reducer, { dismissReduxBadge } from './uiSlice'

describe('uiSlice', () => {
  it('hides redux badge when dismissed', () => {
    const initialState = { showReduxBadge: true }
    const nextState = reducer(initialState, dismissReduxBadge())

    expect(nextState.showReduxBadge).toBe(false)
  })
})
