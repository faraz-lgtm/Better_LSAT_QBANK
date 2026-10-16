// Must run before ProduktlyAuthBridge / openFeedback (localhost Origin → 403).
import '@/lib/analytics/produktly-dev-proxy'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'
import './index.css'
import App from './App.tsx'
import { store } from '@/app/store'
import { AppErrorScreen } from '@/features/app-shell/app-error-screen'
import { ThemeProvider } from '@/features/theme/theme-provider'
import { captureAttributionFromUrl } from '@/lib/analytics/attribution'
import { initPostHog, posthog } from '@/lib/analytics/posthog'
import { PostHogAuthBridge } from '@/lib/analytics/posthog-auth-bridge'
import { ProduktlyAuthBridge } from '@/lib/analytics/produktly-auth-bridge'

captureAttributionFromUrl()
const posthogClient = initPostHog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthogClient ?? posthog}>
      <PostHogErrorBoundary
        fallback={({ error }) => <AppErrorScreen error={error} />}
      >
        <Provider store={store}>
          <ThemeProvider>
            <PostHogAuthBridge />
            <ProduktlyAuthBridge />
            <App />
          </ThemeProvider>
        </Provider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>,
)
