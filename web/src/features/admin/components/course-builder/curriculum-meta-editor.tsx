type CurriculumMetaEditorProps = {
  badge: string
  titleLabel: string
  title: string
  durationInput: string
  isSaving: boolean
  onTitleChange: (value: string) => void
  onDurationChange: (value: string) => void
  onSave: () => void
  onDelete: () => void
  deleteLabel: string
}

function CurriculumMetaEditor({
  badge,
  titleLabel,
  title,
  durationInput,
  isSaving,
  onTitleChange,
  onDurationChange,
  onSave,
  onDelete,
  deleteLabel,
}: CurriculumMetaEditorProps) {
  return (
    <div className="mx-auto flex max-w-[736px] flex-col gap-6">
      <span className="inline-flex w-fit items-center rounded-full border border-[#dfe1e7] px-[11px] py-[3px] text-[10px] font-bold uppercase leading-[15px] tracking-[0.05em] text-[#666d80]">
        {badge}
      </span>
      <div className="rounded-[10px] border border-[#dfe1e7] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
            <label className="text-sm font-normal leading-6 tracking-[0.02em] text-[#1a1b25]">{titleLabel}</label>
            <input className="admin-input" value={title} onChange={(e) => onTitleChange(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-normal leading-6 tracking-[0.02em] text-[#1a1b25]">Estimated Duration</label>
            <input
              className="admin-input"
              placeholder="e.g. 4h 30m"
              value={durationInput}
              onChange={(e) => onDurationChange(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe1e7] pt-4">
        <button
          type="button"
          className="text-sm font-medium text-[#df1c41] transition-opacity hover:opacity-80"
          onClick={onDelete}
        >
          {deleteLabel}
        </button>
        <button type="button" className="admin-btn admin-btn-primary" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}

export { CurriculumMetaEditor }
