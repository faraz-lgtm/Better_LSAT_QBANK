import { Link } from "react-router-dom"

type Crumb = { label: string; href?: string }

type StudentSubnavStripProps = {
  crumbs: Crumb[]
}

function StudentSubnavStrip({ crumbs }: StudentSubnavStripProps) {
  return (
    <div className="border-b border-[#dfe1e7] bg-white/80">
      <div className="figma-container mx-auto flex h-12 max-w-[1920px] items-center gap-1 px-4 text-xs font-medium text-[#666d80] md:px-8">
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <span className="text-[#dfe1e7]">/</span> : null}
            {c.href ? (
              <Link to={c.href} className="text-[#0d47a1] hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className="font-semibold text-[#082c6b]">{c.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export { StudentSubnavStrip }
