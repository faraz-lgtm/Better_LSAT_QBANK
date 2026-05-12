import { Link } from "react-router-dom"

type Crumb = { label: string; href?: string }

type StudentSubnavStripProps = {
  crumbs: Crumb[]
}

function StudentSubnavStrip({ crumbs }: StudentSubnavStripProps) {
  return (
    <div className="border-b border-[color:var(--greyscale-100)] bg-white/80">
      <div className="figma-container mx-auto flex h-12 max-w-[1920px] items-center gap-1 px-4 text-xs font-medium text-[color:var(--text)] md:px-8">
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <span className="text-[color:var(--border)]">/</span> : null}
            {c.href ? (
              <Link to={c.href} className="text-[color:var(--color-student-accent)] hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className="font-semibold text-[color:var(--color-student-heading)]">{c.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export { StudentSubnavStrip }
