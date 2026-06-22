import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const textSlides = [
  {
    title: "Master the LSAT with structured prep",
    body: "Course lessons, question explanations, drills, and analytics in one place—built to help you study smarter and track real progress.",
  },
  {
    title: "Learn with video explanations",
    body: "Walk through real LSAT questions with clear, step-by-step breakdowns so you understand the reasoning—not just the answer.",
  },
  {
    title: "Practice drills and full sections on demand",
    body: "Build speed and accuracy with targeted LR and RC drills, timed sections, and PrepTests that mirror test-day conditions.",
  },
] as const

const sidebarPreviewImage = "/auth/app-preview-questions.png"

function AuthSidebar() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % textSlides.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <aside className="auth-sidebar">
      <div className="auth-sidebar-ellipse" aria-hidden />
      <img src="/auth/sidebar-shape.svg" alt="" className="auth-sidebar-shape" aria-hidden />
      <div className="auth-sidebar-preview-wrap" aria-hidden>
        <div className="auth-sidebar-preview-track">
          <img src={sidebarPreviewImage} alt="" className="auth-sidebar-preview" />
        </div>
        <div className="auth-sidebar-preview-fade" />
      </div>
      <div className="auth-sidebar-copy">
        <div className="auth-sidebar-text" aria-live="polite">
          {textSlides.map((slide, index) => (
            <div
              key={slide.title}
              className={cn(
                "auth-sidebar-text-slide",
                index === activeSlide && "auth-sidebar-text-slide--active",
              )}
            >
              <h2 className="auth-sidebar-title">{slide.title}</h2>
              <p className="auth-sidebar-body">{slide.body}</p>
            </div>
          ))}
        </div>
        <div className="auth-sidebar-dots" role="tablist" aria-label="Feature highlights">
          {textSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeSlide}
              className={index === activeSlide ? "auth-sidebar-dot auth-sidebar-dot--active" : "auth-sidebar-dot"}
              aria-label={`Show slide ${index + 1}`}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}

export { AuthSidebar }
