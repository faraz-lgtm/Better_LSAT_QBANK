import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'
import './index.css'
import App from './App.tsx'
import { store } from '@/app/store'
import { ThemeProvider } from '@/features/theme/theme-provider'
import { initPostHog, posthog } from '@/lib/analytics/posthog'
import { PostHogAuthBridge } from '@/lib/analytics/posthog-auth-bridge'

const posthogClient = initPostHog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthogClient ?? posthog}>
      <PostHogErrorBoundary>
        <Provider store={store}>
          <ThemeProvider>
            <PostHogAuthBridge />
            <App />
          </ThemeProvider>
        </Provider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>,
)
