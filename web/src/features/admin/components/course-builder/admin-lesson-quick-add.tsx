import { Image as ImageIcon, List, SquarePlay } from "lucide-react"

type AdminLessonQuickAddProps = {
  onAddVideo: () => void
  onAddText: () => void
  onAddImage: () => void
  onAddQuestion: () => void
}

function AdminLessonQuickAdd({ onAddVideo, onAddText, onAddImage, onAddQuestion }: AdminLessonQuickAddProps) {
  const items = [
    { label: "Add Video", icon: SquarePlay, onClick: onAddVideo },
    { label: "Add Text", icon: List, onClick: onAddText },
    { label: "Add Image", icon: ImageIcon, onClick: onAddImage },
    { label: "Add Question", icon: List, onClick: onAddQuestion },
  ] as const

  return (
    <div className="flex w-[128px] shrink-0 flex-col border-l border-[#dfe1e7] bg-white">
      <div className="flex h-[63px] items-center justify-center border-b border-[#dfe1e7] px-4">
        <p className="text-base font-semibold tracking-[0.02em] text-[#1a1b25]">Quick Add</p>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {items.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-[#dfe1e7] bg-white p-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#f6f8fa]"
            onClick={onClick}
          >
            <Icon className="size-6 text-[#666d80]" aria-hidden />
            <span className="text-xs font-medium text-[#666d80]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export { AdminLessonQuickAdd }
