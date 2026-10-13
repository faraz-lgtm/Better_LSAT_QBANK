import { configureStore } from '@reduxjs/toolkit'
import { registerAppStore } from '@/app/store-ref'
import studentSessionReducer from '@/features/student-session/studentSessionSlice'
import uiReducer from '@/features/ui/uiSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    studentSession: studentSessionReducer,
  },
})

registerAppStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
