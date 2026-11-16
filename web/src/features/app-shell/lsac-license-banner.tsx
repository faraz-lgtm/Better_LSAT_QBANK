import { cn } from "@/lib/utils"

const LSAC_LICENSE_HREF = "https://www.lsac.org/"
const LSAC_LICENSE_IMG = "/figma/insights-overview/lsac-licensed.png"

/** Official LSAC license strip shown on student sidebar pages. */
function LsacLicenseBanner({ className = "" }: { className?: string }) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-[18px] rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-[22px] py-[18px] sm:flex-row sm:items-center",
        className,
      )}
      data-testid="lsac-license-banner"
    >
      <img
        src={LSAC_LICENSE_IMG}
        alt="Law School Admission Council"
        width={154}
        height={41}
        className="h-[41px] w-[154px] shrink-0 object-contain"
        draggable={false}
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-lg font-bold leading-[1.35] text-[#0e2a5c]">Official LSAC licensed prep</p>
        <p className="m-0 pt-0.5 text-sm leading-[1.5] tracking-[0.28px] text-[#4a5b78]">
          Practice questions and sections on betterLSAT are licensed from the Law School Admission
          Council.
        </p>
      </div>
      <a
        href={LSAC_LICENSE_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-[14px] px-4 text-sm font-semibold tracking-[0.28px] text-[var(--primary)] hover:underline"
      >
        About our license
      </a>
    </section>
  )
}

export { LsacLicenseBanner, LSAC_LICENSE_HREF, LSAC_LICENSE_IMG }
