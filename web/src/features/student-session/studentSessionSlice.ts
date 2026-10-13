import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type {
  StudentStudyContext,
  StudentStudyPreferences,
  UserEntitlement,
  UserProfile,
} from "@/lib/api/users"
import { createUsersApi } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type LoadStatus = "idle" | "loading" | "succeeded" | "failed"

/** Narrow store shape so this slice does not import RootState (avoids cycles). */
type StudentSessionRoot = {
  studentSession: StudentSessionState
}

export type StudentSessionState = {
  profile: UserProfile | null
  profileStatus: LoadStatus
  profileError: string | null
  entitlement: UserEntitlement | null
  entitlementStatus: LoadStatus
  entitlementError: string | null
  studyContext: StudentStudyContext | null
  studyContextStatus: LoadStatus
  studyContextError: string | null
}

const initialState: StudentSessionState = {
  profile: null,
  profileStatus: "idle",
  profileError: null,
  entitlement: null,
  entitlementStatus: "idle",
  entitlementError: null,
  studyContext: null,
  studyContextStatus: "idle",
  studyContextError: null,
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export const loadProfile = createAsyncThunk<UserProfile | null, void, { state: StudentSessionRoot }>(
  "studentSession/loadProfile",
  async () => {
    const api = createUsersApi(getSupabaseBrowserClient())
    return await api.getMyProfile()
  },
  {
    condition: (_, { getState }) => {
      const status = getState().studentSession.profileStatus
      return status === "idle" || status === "failed"
    },
  },
)

export const loadEntitlement = createAsyncThunk<UserEntitlement, void, { state: StudentSessionRoot }>(
  "studentSession/loadEntitlement",
  async () => {
    const api = createUsersApi(getSupabaseBrowserClient())
    return await api.getEntitlementState()
  },
  {
    condition: (_, { getState }) => {
      const status = getState().studentSession.entitlementStatus
      return status === "idle" || status === "failed"
    },
  },
)

export const loadStudyContext = createAsyncThunk<StudentStudyContext, void, { state: StudentSessionRoot }>(
  "studentSession/loadStudyContext",
  async () => {
    const api = createUsersApi(getSupabaseBrowserClient())
    return await api.getStudyContext()
  },
  {
    condition: (_, { getState }) => {
      const status = getState().studentSession.studyContextStatus
      return status === "idle" || status === "failed"
    },
  },
)

/** Load profile + entitlement + study context once (each field still guarded). */
export const loadStudentSession = createAsyncThunk<
  void,
  void,
  { state: StudentSessionRoot; dispatch: (action: unknown) => unknown }
>("studentSession/loadStudentSession", async (_, { dispatch }) => {
  await Promise.all([dispatch(loadProfile()), dispatch(loadEntitlement()), dispatch(loadStudyContext())])
})

const studentSessionSlice = createSlice({
  name: "studentSession",
  initialState,
  reducers: {
    resetStudentSession() {
      return initialState
    },
    /** Seed from login / auth callback so /app mounts warm. */
    hydrateStudentSession(
      state,
      action: PayloadAction<{
        profile?: UserProfile | null
        entitlement?: UserEntitlement | null
        studyContext?: StudentStudyContext | null
      }>,
    ) {
      if ("profile" in action.payload) {
        state.profile = action.payload.profile ?? null
        state.profileStatus = "succeeded"
        state.profileError = null
      }
      if ("entitlement" in action.payload) {
        state.entitlement = action.payload.entitlement ?? null
        state.entitlementStatus = action.payload.entitlement ? "succeeded" : "failed"
        state.entitlementError = null
      }
      if ("studyContext" in action.payload) {
        state.studyContext = action.payload.studyContext ?? null
        state.studyContextStatus = action.payload.studyContext ? "succeeded" : "failed"
        state.studyContextError = null
      }
    },
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload
      state.profileStatus = "succeeded"
      state.profileError = null
    },
    setEntitlement(state, action: PayloadAction<UserEntitlement>) {
      state.entitlement = action.payload
      state.entitlementStatus = "succeeded"
      state.entitlementError = null
    },
    setStudyContext(state, action: PayloadAction<StudentStudyContext>) {
      state.studyContext = action.payload
      state.studyContextStatus = "succeeded"
      state.studyContextError = null
    },
    patchStudyPreferences(state, action: PayloadAction<StudentStudyPreferences>) {
      if (!state.studyContext) {
        state.studyContext = { preferences: action.payload, officialScores: [] }
      } else {
        state.studyContext.preferences = action.payload
      }
      state.studyContextStatus = "succeeded"
      state.studyContextError = null
    },
    invalidateProfile(state) {
      state.profileStatus = "idle"
      state.profileError = null
    },
    invalidateEntitlement(state) {
      state.entitlementStatus = "idle"
      state.entitlementError = null
    },
    invalidateStudyContext(state) {
      state.studyContextStatus = "idle"
      state.studyContextError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProfile.pending, (state) => {
        state.profileStatus = "loading"
        state.profileError = null
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.profile = action.payload
        state.profileStatus = "succeeded"
        state.profileError = null
      })
      .addCase(loadProfile.rejected, (state, action) => {
        state.profileStatus = "failed"
        state.profileError = errorMessage(action.error, "Unable to load profile.")
      })
      .addCase(loadEntitlement.pending, (state) => {
        state.entitlementStatus = "loading"
        state.entitlementError = null
      })
      .addCase(loadEntitlement.fulfilled, (state, action) => {
        state.entitlement = action.payload
        state.entitlementStatus = "succeeded"
        state.entitlementError = null
      })
      .addCase(loadEntitlement.rejected, (state, action) => {
        state.entitlementStatus = "failed"
        state.entitlementError = errorMessage(action.error, "Unable to load entitlement.")
      })
      .addCase(loadStudyContext.pending, (state) => {
        state.studyContextStatus = "loading"
        state.studyContextError = null
      })
      .addCase(loadStudyContext.fulfilled, (state, action) => {
        state.studyContext = action.payload
        state.studyContextStatus = "succeeded"
        state.studyContextError = null
      })
      .addCase(loadStudyContext.rejected, (state, action) => {
        state.studyContextStatus = "failed"
        state.studyContextError = errorMessage(action.error, "Unable to load study context.")
      })
  },
})

export const {
  resetStudentSession,
  hydrateStudentSession,
  setProfile,
  setEntitlement,
  setStudyContext,
  patchStudyPreferences,
  invalidateProfile,
  invalidateEntitlement,
  invalidateStudyContext,
} = studentSessionSlice.actions

export default studentSessionSlice.reducer

export function selectStudentSession(state: StudentSessionRoot): StudentSessionState {
  return state.studentSession
}

export function selectProfile(state: StudentSessionRoot): UserProfile | null {
  return state.studentSession.profile
}

export function selectEntitlement(state: StudentSessionRoot): UserEntitlement | null {
  return state.studentSession.entitlement
}

export function selectStudyContext(state: StudentSessionRoot): StudentStudyContext | null {
  return state.studentSession.studyContext
}

export function selectEntitlementLoading(state: StudentSessionRoot): boolean {
  const status = state.studentSession.entitlementStatus
  return status === "idle" || status === "loading"
}
