import { createSlice } from '@reduxjs/toolkit'

type UiState = {
  showReduxBadge: boolean
}

const initialState: UiState = {
  showReduxBadge: true,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    dismissReduxBadge(state) {
      state.showReduxBadge = false
    },
  },
})

export const { dismissReduxBadge } = uiSlice.actions
export default uiSlice.reducer
