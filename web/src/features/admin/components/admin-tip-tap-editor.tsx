import { useCallback, useEffect, type ReactNode } from "react"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
import Youtube from "@tiptap/extension-youtube"
import type { Editor } from "@tiptap/core"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

function isSafeHttpUrl(raw: string): boolean {
  const t = raw.trim().toLowerCase()
  if (!t) return false
  if (t.startsWith("javascript:") || t.startsWith("data:") || t.startsWith("vbscript:")) return false
  return t.startsWith("https://") || t.startsWith("http://") || t.startsWith("/")
}

function isYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    if (u.hostname === "youtu.be") return true
    if (u.hostname.includes("youtube.com")) return true
  } catch {
    /* ignore */
  }
  return false
}

type AdminTipTapEditorProps = {
  value: string
  onChange: (html: string) => void
  minHeight?: number
  placeholder?: string
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active ? "bg-[#0d47a1] text-white" : "bg-white text-[#1a1b25] hover:bg-[#eef3fb]"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {children}
    </button>
  )
}

function AdminTipTapEditor({ value, onChange, minHeight = 140, placeholder = "Start typing…" }: AdminTipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-[#0d47a1] underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded-md", style: "max-width:100%;height:auto" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "border-collapse border border-[#dfe1e7] text-sm" },
      }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { class: "border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-1 font-semibold" } }),
      TableCell.configure({ HTMLAttributes: { class: "border border-[#dfe1e7] px-2 py-1 align-top" } }),
      Youtube.configure({
        nocookie: true,
        width: 640,
        height: 360,
        HTMLAttributes: { class: "w-full max-w-full rounded-lg", style: "aspect-ratio:16/9;height:auto;width:100%" },
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "max-w-none focus:outline-none px-4 py-3 text-[15px] leading-relaxed text-[#1a1b25] [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#dfe1e7] [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:rounded-md [&_pre]:bg-[#f6f8fa] [&_pre]:p-3 [&_code]:text-sm",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor: ed }: { editor: Editor }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const incoming = (value || "").trim() ? value : "<p></p>"
    const current = editor.getHTML()
    if (incoming === current) return
    editor.commands.setContent(incoming, { emitUpdate: false })
  }, [value, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes("link").href as string | undefined
    const raw = window.prompt("Link URL", prev ?? "https://")
    if (raw === null) return
    const href = raw.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    if (!isSafeHttpUrl(href)) {
      window.alert("Use a safe http(s) or site-relative URL.")
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
  }, [editor])

  const insertImage = useCallback(() => {
    if (!editor) return
    const raw = window.prompt("Image URL (https://…)", "https://")
    if (raw === null) return
    const src = raw.trim()
    if (!src || !isSafeHttpUrl(src)) return
    editor.chain().focus().setImage({ src }).run()
  }, [editor])

  const insertYoutube = useCallback(() => {
    if (!editor) return
    const raw = window.prompt("YouTube URL", "https://www.youtube.com/watch?v=")
    if (raw === null) return
    const src = raw.trim()
    if (!src) return
    if (!isYoutubeUrl(src)) {
      window.alert("Paste a full YouTube watch or youtu.be URL.")
      return
    }
    editor.chain().focus().setYoutubeVideo({ src }).run()
  }, [editor])

  const insertVideoLink = useCallback(() => {
    if (!editor) return
    const raw = window.prompt("Video page URL (Vimeo, direct file, etc.) — inserted as a link", "https://")
    if (raw === null) return
    const href = raw.trim()
    if (!href || !isSafeHttpUrl(href)) return
    editor
      .chain()
      .focus()
      .insertContent({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Open video",
            marks: [{ type: "link", attrs: { href } }],
          },
        ],
      })
      .run()
  }, [editor])

  if (!editor) {
    return <div className="min-h-[120px] animate-pulse rounded-md bg-[#f6f8fa]" style={{ minHeight }} aria-hidden />
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#dfe1e7] bg-white">
      <div className="flex max-h-[220px] flex-wrap items-center gap-1 overflow-y-auto border-b border-[#dfe1e7] bg-[#f6f8fa] px-2 py-2">
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          Undo
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          Redo
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <ToolbarButton title="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          P
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          U
        </ToolbarButton>
        <ToolbarButton title="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          S
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          ◀
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          ◎
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          ▶
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          “”
        </ToolbarButton>
        <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          HR
        </ToolbarButton>
        <ToolbarButton title="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          {"</>"}
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {"{ }"}
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <label className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[#1a1b25] hover:bg-[#eef3fb]" title="Text color">
          A
          <input
            type="color"
            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <ToolbarButton title="Clear color" onClick={() => editor.chain().focus().unsetColor().run()}>
          Plain A
        </ToolbarButton>
        <label className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[#1a1b25] hover:bg-[#eef3fb]" title="Highlight">
          HL
          <input
            type="color"
            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            defaultValue="#fff59d"
            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          />
        </label>
        <ToolbarButton title="Remove highlight" onClick={() => editor.chain().focus().unsetHighlight().run()}>
          No HL
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <ToolbarButton title="Link" onClick={setLink}>
          Link
        </ToolbarButton>
        <ToolbarButton title="Image" onClick={insertImage}>
          Img
        </ToolbarButton>
        <ToolbarButton title="YouTube embed" onClick={insertYoutube}>
          YT
        </ToolbarButton>
        <ToolbarButton title="Other video as link" onClick={insertVideoLink}>
          Vid+
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <ToolbarButton title="Insert 3×3 table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          Table
        </ToolbarButton>
        <ToolbarButton title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
          +Row
        </ToolbarButton>
        <ToolbarButton title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
          +Col
        </ToolbarButton>
        <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
          −Tbl
        </ToolbarButton>
        <span className="mx-1 text-[#dfe1e7]">|</span>
        <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          Clear
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export { AdminTipTapEditor }
