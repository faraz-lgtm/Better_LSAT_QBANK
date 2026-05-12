import { Fragment, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

type Crumb = { label: string; href?: string }

type StudentSubnavStripProps = {
  crumbs: Crumb[]
  /**
   * Optional page title rendered on the left side of the strip. Matches the
   * Geist Bold 24px / #062357 heading slot defined in the Figma design at
   * `node-id=18227-9411`. Pages that already render their own H1 in the body
   * can leave this undefined to keep the slot empty.
   */
  title?: ReactNode
  className?: string
}

function StudentSubnavStrip({ crumbs, title, className }: StudentSubnavStripProps) {
  const lastIndex = crumbs.length - 1

  return (
    <div className={cn("border-b border-[#dfe1e7] bg-[#f3f7ff]", className)}>
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-4 md:px-6">
        <h2
          className={cn(
            "min-w-0 truncate text-[24px] font-bold leading-[1.3] text-[#062357]",
            title ? "" : "sr-only",
          )}
        >
          {title ?? "\u200b"}
        </h2>

        <nav aria-label="Breadcrumb" className="ml-auto">
          <ol className="flex h-8 items-center justify-end gap-1.5 text-[12px] leading-[1.5] tracking-[0.24px]">
            {crumbs.map((crumb, i) => {
              const isLast = i === lastIndex
              return (
                <Fragment key={`${crumb.label}-${i}`}>
                  {i > 0 ? (
                    <li aria-hidden className="font-normal text-[#666d80]">
                      /
                    </li>
                  ) : null}
                  <li className="inline-flex items-center">
                    {isLast ? (
                      <span aria-current="page" className="font-semibold text-[#0d47a1]">
                        {crumb.label}
                      </span>
                    ) : crumb.href ? (
                      <Link
                        to={crumb.href}
                        className="font-normal text-[#666d80] transition-colors hover:text-[#0d47a1] hover:underline"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-normal text-[#666d80]">{crumb.label}</span>
                    )}
                  </li>
                </Fragment>
              )
            })}
          </ol>
        </nav>
      </div>
    </div>
  )
}

export { StudentSubnavStrip }
