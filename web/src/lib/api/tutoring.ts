import type { SupabaseClient } from "@supabase/supabase-js"

import type { SessionTranscript, TodoTag, TutoringTodo } from "@/features/tutoring/lib/types"
import { handleUsersInvokeError } from "@/lib/auth/handle-unauthorized-session"

export type TutoringSessionDto = {
  id: string
  tutorName: string
  tutorInitials: string
  focus: string
  startsAt: string
  endsAt: string | null
  status: "scheduled" | "completed" | "canceled" | "no_show"
  joinUrl: string | null
  recordingStatus: "none" | "processing" | "ready" | "failed"
  transcriptStatus: "none" | "processing" | "ready" | "failed"
  action: "join" | "reschedule"
  month: string
  day: string
  whenLabel: string
  dateLabel: string
  title: string
}

export type TutoringPastSessionDto = {
  id: string
  dateLabel: string
  tutorName: string
  focus: string
  transcriptStatus: TutoringSessionDto["transcriptStatus"]
  recordingStatus: TutoringSessionDto["recordingStatus"]
}

export type TutoringSessionsListResponse = {
  hasActivePackage: boolean
  nextSession: TutoringSessionDto | null
  upcomingSessions: TutoringSessionDto[]
  pastSessions: TutoringPastSessionDto[]
  activePackage: {
    name: string
    purchasedLabel: string
    slots: Array<"completed" | "scheduled" | "unscheduled">
    completed: number
    scheduled: number
    notScheduled: number
  } | null
}

export type TutoringTranscriptResponse = SessionTranscript & {
  recordingUrl?: string | null
}

export type TutoringSlotsResponse = {
  message?: string
  data?: {
    minimum?: string
    maximum?: string
    slots?: Record<string, Record<string, Array<[number, number]>>>
  }
}

export type TutoringTodosListResponse = {
  sessionId: string
  todos: TutoringTodo[]
}

export function createTutoringApi(supabase: SupabaseClient) {
  async function invokeTutoringPost<T>(
    functionName: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const maybeAuth = (
      supabase as unknown as {
        auth?: {
          getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }>
        }
      }
    ).auth
    const sessionResult = maybeAuth?.getSession ? await maybeAuth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      method: "POST",
      body: body ?? {},
      headers,
    })
    if (error) await handleUsersInvokeError(supabase, error)
    if (error) throw error
    if (data == null) throw new Error(`No payload returned from ${functionName}`)
    return data
  }

  return {
    listSlots(input?: {
      startDateTime?: string
      endDateTime?: string
      providerId?: number
    }): Promise<TutoringSlotsResponse> {
      return invokeTutoringPost("tutoring-list-slots", { ...input })
    },

    createBooking(input: {
      bookingStart: string
      providerId?: number
      timeZone?: string
    }): Promise<TutoringSessionDto> {
      return invokeTutoringPost("tutoring-create-booking", { ...input })
    },

    rescheduleBooking(input: {
      sessionId: string
      bookingStart: string
      timeZone?: string
    }): Promise<TutoringSessionDto> {
      return invokeTutoringPost("tutoring-reschedule-booking", { ...input })
    },

    cancelBooking(sessionId: string): Promise<TutoringSessionDto> {
      return invokeTutoringPost("tutoring-cancel-booking", { sessionId })
    },

    listSessions(): Promise<TutoringSessionsListResponse> {
      return invokeTutoringPost("tutoring-list-sessions")
    },

    getTranscript(sessionId: string): Promise<TutoringTranscriptResponse> {
      return invokeTutoringPost("tutoring-get-transcript", { sessionId })
    },

    listTodos(sessionId: string): Promise<TutoringTodosListResponse> {
      return invokeTutoringPost("tutoring-list-todos", { sessionId })
    },

    createTodo(input: {
      sessionId: string
      title: string
      tag?: TodoTag
      dueAt?: string | null
    }): Promise<TutoringTodo> {
      return invokeTutoringPost("tutoring-create-todo", { ...input })
    },

    updateTodo(input: { todoId: string; done: boolean }): Promise<TutoringTodo> {
      return invokeTutoringPost("tutoring-update-todo", { ...input })
    },
  }
}
