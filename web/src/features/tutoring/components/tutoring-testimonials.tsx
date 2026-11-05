import type { TutoringTestimonial } from "@/features/tutoring/lib/types"

type TutoringTestimonialsProps = {
  testimonials: TutoringTestimonial[]
}

function TutoringTestimonials({ testimonials }: TutoringTestimonialsProps) {
  return (
    <section className="rounded-[11px] border border-[#dce5ef] bg-[var(--greyscale-0)] p-[18px]">
      <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
        What students say about BetterLSAT tutoring
      </h2>
      <p className="mt-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
        Real feedback from students who used 1-on-1 support as part of their prep.
      </p>
      <div className="mt-3 grid gap-2.5 md:grid-cols-3">
        {testimonials.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-4 rounded-[9px] border border-[#e1e8ef] bg-[#f8fbfe] p-3"
          >
            <div className="relative w-full overflow-hidden rounded-[16px]" style={{ aspectRatio: "73 / 36" }}>
              <iframe
                loading="lazy"
                title={`${item.name} testimonial video`}
                src={item.videoEmbedSrc}
                className="absolute inset-0 h-full w-full border-0"
                referrerPolicy="origin"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs leading-normal text-[#ffbd4c]" aria-label="5 star rating">
                ★★★★★
              </p>
              <p className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">
                {item.name}
              </p>
              <p className="text-xs tracking-[0.02em] text-[var(--primary)]">BetterLSAT student</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export { TutoringTestimonials }
