import { cn } from "@/lib/utils"

type StudentPageLoaderProps = {
  label?: string
  centered?: boolean
  size?: "sm" | "md"
  className?: string
}

function StudentPageLoader({ label, centered = false, size = "md", className }: StudentPageLoaderProps) {
  const spinner = (
    <div
      className={cn(
        "shrink-0 animate-spin rounded-full border-[#dfe1e7] border-t-[#0d47a1]",
        size === "sm" ? "size-5 border-2" : "size-8 border-[3px]",
      )}
      aria-hidden
    />
  )

  if (centered) {
    return (
      <div
        className={cn(
          "flex min-h-[min(280px,45vh)] w-full flex-col items-center justify-center gap-3",
          className,
        )}
        role="status"
      >
        {spinner}
        {label ? <p className="text-sm text-[#666d80]">{label}</p> : null}
        <span className="sr-only">{label ?? "Loading"}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)} role="status">
      {spinner}
      {label ? <p className="text-sm text-[#666d80]">{label}</p> : null}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  )
}

export { StudentPageLoader }
