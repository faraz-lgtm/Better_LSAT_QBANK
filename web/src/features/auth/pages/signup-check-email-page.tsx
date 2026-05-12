import { Link, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"

function SignupCheckEmailPage() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app">
      <AuthCard className="mx-auto w-full max-w-[500px]">
        <div className="figma-gap-24 flex flex-col text-center">
          <h1 className="figma-track-md">Check your email</h1>
          <p className="figma-text-sm figma-track-sm text-[#666d80]">
            {email ? (
              <>
                We sent a magic link to <span className="font-semibold text-[#082c6b]">{email}</span>. Click the link in that email to
                finish creating your account.
              </>
            ) : (
              <>We sent a magic link to your inbox. Click the link in that email to finish creating your account.</>
            )}
          </p>
          <p className="figma-text-sm figma-track-sm text-[#666d80]">Didn&apos;t get it? Check spam or request a new link from the signup page.</p>
          <Button asChild variant="outline" className="w-full rounded-2xl border-[#0d47a1] text-[#0d47a1]">
            <Link to="/signup">Back to signup</Link>
          </Button>
          <Button asChild className="w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90">
            <Link to="/login">Go to log in</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { SignupCheckEmailPage }
