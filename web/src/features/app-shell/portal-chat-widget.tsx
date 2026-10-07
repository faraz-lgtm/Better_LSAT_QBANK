import { useEffect } from "react"

const CHAT_WIDGET_SCRIPT_ID = "leadconnector-chat-widget"
const CHAT_WIDGET_ID = "6a45708a6e972e21b6c6ad65"

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

/**
 * LeadConnector / HighLevel chat bubble.
 * Hidden during immersive practice and prep lessons so the fixed iframe
 * does not cover exam/drill UI or lesson footer CTAs.
 */
function PortalChatWidget({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    document.documentElement.classList.toggle("portal-chat-hidden", !enabled)

    if (!enabled) return

    ensureChatWidgetScript()
  }, [enabled])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("portal-chat-hidden")
    }
  }, [])

  return null
}

export { PortalChatWidget }
