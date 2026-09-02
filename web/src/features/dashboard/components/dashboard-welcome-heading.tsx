/** Figma `20560:36945` — dashboard H1 welcome line */
function formatDashboardWelcomeHeading(firstName: string): string {
  const name = firstName.trim()
  return name ? `Welcome back, ${name}` : "Welcome back"
}

function DashboardWelcomeHeading({ firstName }: { firstName: string }) {
  return (
    <h1 className="m-0 text-[48px] font-bold leading-[1.2] tracking-normal text-[#041a44]">
      {formatDashboardWelcomeHeading(firstName)}
    </h1>
  )
}

export { DashboardWelcomeHeading, formatDashboardWelcomeHeading }
