import { useEffect } from "react"

const CHAT_WIDGET_SCRIPT_ID = "leadconnector-chat-widget"
const CHAT_WIDGET_ID = "6a45708a6e972e21b6c6ad65"
/** CSS px above the viewport bottom — clears the ~64px lesson footer under html zoom. */
const LESSON_CHAT_BOTTOM = "112px"

function ensureChatWidgetScript() {
  if (document.getElementById(CHAT_WIDGET_SCRIPT_ID)) return

  const script = document.createElement("script")
  script.id = CHAT_WIDGET_SCRIPT_ID
  script.src = "https://widgets.leadconnectorhq.com/loader.js"
  script.async = true
  script.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js")
  script.setAttribute("data-widget-id", CHAT_WIDGET_ID)
  document.body.appendChild(script)
}

function chatLauncherNodes(): HTMLElement[] {
  const nodes = new Set<HTMLElement>()

  document.querySelectorAll("chat-widget").forEach((el) => {
    if (el instanceof HTMLElement) nodes.add(el)
  })

  document.querySelectorAll("iframe").forEach((el) => {
    const src = el.getAttribute("src") ?? ""
    const title = (el.getAttribute("title") ?? "").toLowerCase()
    if (
      src.includes("leadconnector") ||
      src.includes("msgsndr") ||
      src.includes("chat-widget") ||
      title.includes("chat")
    ) {
      nodes.add(el)
      if (el.parentElement instanceof HTMLElement) nodes.add(el.parentElement)
    }
  })

  return [...nodes]
}

function applyLessonChatOffset() {
  const raise = document.documentElement.classList.contains("prep-course-lesson-active")
  for (const el of chatLauncherNodes()) {
    if (raise) {
      el.style.setProperty("position", "fixed", "important")
      el.style.setProperty("bottom", LESSON_CHAT_BOTTOM, "important")
    } else {
      el.style.removeProperty("bottom")
    }
  }
}

/** LeadConnector / HighLevel chat bubble — hide while exam/practice sessions are immersive. */
function PortalChatWidget({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    document.documentElement.classList.toggle("portal-chat-hidden", !enabled)

    if (!enabled) return

    ensureChatWidgetScript()
    applyLessonChatOffset()

    const observer = new MutationObserver(() => applyLessonChatOffset())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] })
    window.addEventListener("LC_chatWidgetLoaded", applyLessonChatOffset)

    return () => {
      observer.disconnect()
      window.removeEventListener("LC_chatWidgetLoaded", applyLessonChatOffset)
    }
  }, [enabled])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("portal-chat-hidden")
    }
  }, [])

  return null
}

export { PortalChatWidget }
