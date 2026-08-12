function AdminTopbar() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex h-14 w-full max-w-[1168px] items-center justify-end px-6">
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">JD</div>
        </div>
      </div>
    </header>
  )
}

export { AdminTopbar }
