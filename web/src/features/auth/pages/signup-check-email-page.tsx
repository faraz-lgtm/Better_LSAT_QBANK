import { Link, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"

function SignupCheckEmailPage() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login">
      <AuthCard>
        <div className="figma-gap-24 flex flex-col text-center">
          <h1 className="figma-track-md">Check your email</h1>
          <p className="figma-text-sm figma-track-sm text-[#666d80]">
            {email ? (
              <>
                We just sent you a magic login link to{" "}
                <span className="font-semibold text-[#082c6b]">{email}</span>. If you don&apos;t see our email, check your
                spam for a message from <span className="font-semibold text-[#082c6b]">support@betterlsat.com</span>.
              </>
            ) : (
              <>
                We just sent you a magic login link! If you don&apos;t see our email, check your spam for a message from{" "}
                <span className="font-semibold text-[#082c6b]">support@betterlsat.com</span>.
              </>
            )}
          </p>
          <Link to="/signup" className="figma-text-sm figma-track-sm font-semibold text-[#0d47a1] hover:underline">
            Resend Email
          </Link>
          <div className="figma-gap-12 flex items-center">
            <div className="h-px flex-1 bg-[#dfe1e7]" />
            <span className="figma-text-lg figma-track-md font-semibold text-[#666d80]">OR</span>
            <div className="h-px flex-1 bg-[#dfe1e7]" />
          </div>
          <Button asChild variant="outline" className="ds-btn-outline w-full">
            <Link to="/login">Try another way</Link>
          </Button>
          <p className="figma-text-sm figma-track-sm text-[#666d80]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#0d47a1] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { SignupCheckEmailPage }
