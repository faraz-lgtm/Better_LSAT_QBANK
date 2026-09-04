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
import { mergeAttributes, Node, type Editor } from "@tiptap/core"
import { EditorContent, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, type NodeViewProps } from "@tiptap/react"
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

function isSafeHexColor(raw: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw.trim())
}

const DEFAULT_RECAP_BG = "#0d47a1"
const RECAP_GRADIENT = "linear-gradient(90deg, #0d47a1 0%, #419df8 100%)"

function isRecapDefaultColor(raw: string): boolean {
  return raw.trim().toLowerCase() === DEFAULT_RECAP_BG
}

function LessonSectionView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const label = String(node.attrs.label ?? "")
  const variant = node.attrs.variant === "empty" ? "empty" : "heading"
  const backgroundColor = isSafeHexColor(String(node.attrs.backgroundColor ?? ""))
    ? String(node.attrs.backgroundColor)
    : DEFAULT_RECAP_BG

  if (variant === "heading") {
    return (
      <NodeViewWrapper
        as="section"
        className="lesson-section-editor lesson-callout-editor my-4 flex flex-col gap-2.5 border-l-4 border-solid border-[#0d47a1] pl-[26px]"
        data-lesson-section="true"
        data-variant={variant}
        data-label={label}
        data-bg={backgroundColor}
      >
        <div className="flex items-center gap-2" contentEditable={false}>
          <input
            aria-label="Callout label"
            className="w-full border-0 bg-transparent text-xs font-bold leading-[1.5] tracking-[0.24px] text-[#0d47a1] outline-none placeholder:text-[#9aa4b2]"
            placeholder="Key term · stimulus"
            value={label}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => updateAttributes({ label: e.target.value })}
          />
          <button
            type="button"
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2px] text-[#666d80] hover:bg-[#eef3fb]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => deleteNode()}
            title="Delete section"
          >
            Del
          </button>
        </div>
        <NodeViewContent className="lesson-callout-editor__content min-h-[24px] outline-none" />
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      as="section"
      className="lesson-section-editor lesson-section-empty my-4 rounded-[18px] border border-[#dfe1e7]"
      data-lesson-section="true"
      data-variant={variant}
      data-label={label}
      data-bg={backgroundColor}
      style={isRecapDefaultColor(backgroundColor) ? { background: RECAP_GRADIENT } : { backgroundColor }}
    >
      <div className="mb-4 flex items-center gap-3" contentEditable={false}>
        <input
          aria-label="Section tag"
          className={`min-w-0 flex-1 border-0 bg-transparent text-xs font-bold uppercase leading-[1.5] tracking-[0.24px] outline-none ${
            isRecapDefaultColor(backgroundColor) ? "text-white placeholder:text-[#d7e8ff]" : "text-[#0d47a1] placeholder:text-[#9aa4b2]"
          }`}
          placeholder="RECAP"
          value={label}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => updateAttributes({ label: e.target.value })}
        />
        <label
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium text-[#666d80] hover:bg-[#eef3fb]"
          title="Section background"
        >
          BG
          <input
            type="color"
            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            value={backgroundColor}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (isSafeHexColor(e.target.value)) updateAttributes({ backgroundColor: e.target.value })
            }}
          />
        </label>
        <button
          type="button"
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2px] text-[#666d80] hover:bg-[#eef3fb]"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => deleteNode()}
          title="Delete section"
        >
          Del
        </button>
      </div>
      <NodeViewContent className="lesson-section-editor__content min-h-[48px] outline-none" />
    </NodeViewWrapper>
  )
}

const LessonSection = Node.create({
  name: "lessonSection",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      label: {
        default: "Key term · stimulus",
        parseHTML: (element) => element.getAttribute("data-label") ?? "Key term · stimulus",
        renderHTML: (attributes) => ({ "data-label": attributes.label || "" }),
      },
      variant: {
        default: "heading",
        parseHTML: (element) => (element.getAttribute("data-variant") === "empty" ? "empty" : "heading"),
        renderHTML: (attributes) => ({ "data-variant": attributes.variant === "empty" ? "empty" : "heading" }),
      },
      backgroundColor: {
        default: DEFAULT_RECAP_BG,
        parseHTML: (element) => {
          const fromData = element.getAttribute("data-bg") ?? ""
          if (isSafeHexColor(fromData)) return fromData.trim()
          const fromStyle = element.style?.backgroundColor ?? ""
          if (isSafeHexColor(fromStyle)) return fromStyle.trim()
          return DEFAULT_RECAP_BG
        },
        renderHTML: (attributes) => {
          const color = isSafeHexColor(String(attributes.backgroundColor ?? ""))
            ? String(attributes.backgroundColor)
            : DEFAULT_RECAP_BG
          const padding = attributes.variant === "empty" ? "padding: 14px 16px;" : ""
          return { "data-bg": color, style: `background-color: ${color}; ${padding}`.trim() }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: "section[data-lesson-section]" }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const isEmpty = node.attrs.variant === "empty"
    return [
      "section",
      mergeAttributes(HTMLAttributes, {
        "data-lesson-section": "true",
        class: isEmpty ? "lesson-section lesson-section-empty" : "lesson-section",
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(LessonSectionView)
  },
})

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
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      LessonSection,
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
          "lesson-tiptap-editor max-w-none focus:outline-none px-4 py-3 text-[15px] leading-relaxed text-[#1a1b25] [&_h1]:m-0 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-[1.3] [&_h1]:text-[#36394a] [&_h2]:m-0 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-[1.3] [&_h2]:text-[#36394a] [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_p]:mb-3 [&_p]:text-base [&_p]:leading-[1.5] [&_p]:tracking-[0.32px] [&_p]:text-[#36394a] [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#dfe1e7] [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:rounded-md [&_pre]:bg-[#f6f8fa] [&_pre]:p-3 [&_code]:text-sm",
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

  const insertLessonSection = useCallback((variant: "heading" | "empty") => {
    if (!editor) return
    if (variant === "empty") {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "lessonSection",
          attrs: { variant: "empty", label: "RECAP", backgroundColor: DEFAULT_RECAP_BG },
          content: [{ type: "paragraph" }],
        })
        .run()
      return
    }
    editor
      .chain()
      .focus()
      .insertContent({
        type: "lessonSection",
        attrs: { variant: "heading", label: "Key term · stimulus", backgroundColor: "#ffffff" },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The paragraph above the question stem. Every argument you analyse lives there.",
              },
            ],
          },
        ],
      })
      .run()
  }, [editor])

  const setSectionBackground = useCallback(
    (color: string) => {
      if (!editor || !isSafeHexColor(color)) return
      editor.chain().focus().updateAttributes("lessonSection", { backgroundColor: color }).run()
    },
    [editor],
  )

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
        <ToolbarButton
          title="Section with heading"
          active={editor.isActive("lessonSection", { variant: "heading" })}
          onClick={() => insertLessonSection("heading")}
        >
          Sec+H
        </ToolbarButton>
        <ToolbarButton
          title="Empty section"
          active={editor.isActive("lessonSection", { variant: "empty" })}
          onClick={() => insertLessonSection("empty")}
        >
          Empty Sec
        </ToolbarButton>
        <label
          className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
            editor.isActive("lessonSection") ? "bg-white text-[#1a1b25] hover:bg-[#eef3fb]" : "cursor-not-allowed opacity-40"
          }`}
          title="Section background color (default is recap gradient)"
        >
          Sec BG
          <input
            type="color"
            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            disabled={!editor.isActive("lessonSection")}
            value={
              isSafeHexColor(String(editor.getAttributes("lessonSection").backgroundColor ?? ""))
                ? String(editor.getAttributes("lessonSection").backgroundColor)
                : "#ffffff"
            }
            onChange={(e) => setSectionBackground(e.target.value)}
          />
        </label>
        <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </ToolbarButton>
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
        <ToolbarButton title="Insert divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          Divider
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
