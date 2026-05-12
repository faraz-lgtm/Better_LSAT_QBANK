import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const annotationVariants = cva("w-full border-b border-[#dfe1e7] bg-white", {
  variants: {
    tone: {
      primary: "",
      neutral: "border-border",
    },
  },
  defaultVariants: {
    tone: "primary",
  },
})

type AnnotationProps = React.ComponentProps<"section"> &
  VariantProps<typeof annotationVariants> & {
    title: string
    description: string
  }

function Annotation({ className, tone, title, description, ...props }: AnnotationProps) {
  return (
    <section data-slot="annotation" className={cn(annotationVariants({ tone }), className)} {...props}>
      <div className="h-4 w-full bg-[#0d47a1]" />
      <div className="px-6 py-10 md:px-16">
        <h2 className="text-4xl font-semibold tracking-tight text-[#0d0d12] md:text-[64px] md:leading-[80px]">
          {title}
        </h2>
        <p className="mt-4 max-w-4xl text-lg font-medium text-[#666d80] md:text-2xl md:leading-8">
          {description}
        </p>
      </div>
    </section>
  )
}

export { Annotation, annotationVariants }
