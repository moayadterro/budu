'use client'

import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { Button } from './button'
import { Icon, type IconName } from './icon'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

/**
 * Word-like text editor (Tiptap): headings, bold / italic / strike, lists, quotes, links, undo.
 * The HTML goes into a hidden input `name`, so it works inside a normal <form action>. The server must
 * still clean it (IOMAD does, with HTMLPurifier) — never trust what the browser sends.
 */
export function RichTextEditor({ name, defaultValue = '', label }: { name: string; defaultValue?: string; label: string }) {
  const [html, setHtml] = useState(defaultValue)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'] },
      }),
    ],
    content: defaultValue,
    immediatelyRender: false, // rendered on the server first (Next)
    editorProps: {
      attributes: {
        class: 'rich-text min-h-48 px-3 py-2 outline-none',
        'aria-label': label,
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? '' : editor.getHTML()),
  })

  return (
    <div className="rounded-md border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <input type="hidden" name={name} value={html} />
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const t = useT()
  const s = t.editor
  const on = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      undo: e.can().undo(),
      redo: e.can().redo(),
    }),
  })
  const c = () => editor.chain().focus()
  return (
    <div role="toolbar" aria-label={s.toolbar} className="flex flex-wrap items-center gap-0.5 border-b p-1">
      <Tool icon="bold" label={s.bold} active={on.bold} onClick={() => c().toggleBold().run()} />
      <Tool icon="italic" label={s.italic} active={on.italic} onClick={() => c().toggleItalic().run()} />
      <Tool icon="strike" label={s.strike} active={on.strike} onClick={() => c().toggleStrike().run()} />
      <Sep />
      <Tool icon="h2" label={s.h2} active={on.h2} onClick={() => c().toggleHeading({ level: 2 }).run()} />
      <Tool icon="h3" label={s.h3} active={on.h3} onClick={() => c().toggleHeading({ level: 3 }).run()} />
      <Sep />
      <Tool icon="listBullet" label={s.bullet} active={on.bullet} onClick={() => c().toggleBulletList().run()} />
      <Tool icon="listNumber" label={s.ordered} active={on.ordered} onClick={() => c().toggleOrderedList().run()} />
      <Tool icon="quote" label={s.quote} active={on.quote} onClick={() => c().toggleBlockquote().run()} />
      <Sep />
      <LinkTool editor={editor} active={on.link} />
      <Sep />
      <Tool icon="undo" label={s.undo} disabled={!on.undo} onClick={() => c().undo().run()} />
      <Tool icon="redo" label={s.redo} disabled={!on.redo} onClick={() => c().redo().run()} />
    </div>
  )
}

function Tool({ icon, label, active, disabled, onClick }: { icon: IconName; label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(active && 'bg-muted text-foreground')}
    >
      <Icon name={icon} className="rtl:-scale-x-100" />
    </Button>
  )
}

const Sep = () => <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />

/** Add / change / remove a link on the selected text. */
function LinkTool({ editor, active }: { editor: Editor; active: boolean }) {
  const t = useT()
  const s = t.editor
  const [open, setOpen] = useState(false)
  const [href, setHref] = useState('')
  const apply = () => {
    const url = href.trim()
    const chain = editor.chain().focus().extendMarkRange('link')
    if (!url) chain.unsetLink().run()
    else chain.setLink({ href: /^(https?:|mailto:)/i.test(url) ? url : `https://${url}` }).run()
    setOpen(false)
  }
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setHref((editor.getAttributes('link').href as string | undefined) ?? '')
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={s.link} title={s.link} aria-pressed={active} className={cn(active && 'bg-muted')}>
          <Icon name="link" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <Row>
          <Input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                apply()
              }
            }}
            placeholder="https://…"
            aria-label={s.linkAddress}
            autoFocus
          />
          <Button type="button" size="sm" onClick={apply}>
            {s.apply}
          </Button>
        </Row>
      </PopoverContent>
    </Popover>
  )
}

const Row = ({ children }: { children: ReactNode }) => <div className="flex items-center gap-2">{children}</div>

/** Show HTML from the editor. Only for HTML cleaned on the server (IOMAD's HTMLPurifier). */
export function RichText({ html, className }: { html: string; className?: string }) {
  return <div className={cn('rich-text', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
