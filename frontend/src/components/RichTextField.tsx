import { useState, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  Link as LinkIcon, List, ListOrdered, Quote, Code,
} from 'lucide-react';

interface Props {
  value: string;
  onChange(html: string): void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick(): void;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ active, disabled, onClick, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

export default function RichTextField({ value, onChange, placeholder }: Props) {
  const [mode, setMode] = useState<'wysiwyg' | 'html'>('wysiwyg');
  const [htmlSource, setHtmlSource] = useState(value);

  // Track whether the last change came from the editor itself (typing)
  const internalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Text eingeben...' }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      internalUpdate.current = true;
      const html = ed.getHTML();
      onChange(html);
      setHtmlSource(html);
    },
  });

  // Sync external value changes (undo, version restore) into TipTap
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (internalUpdate.current) {
      internalUpdate.current = false;
      return;
    }
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
      setHtmlSource(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL eingeben:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const switchToHtml = () => {
    if (editor) setHtmlSource(editor.getHTML());
    setMode('html');
  };

  const switchToWysiwyg = () => {
    if (editor) {
      const current = editor.getHTML();
      editor.commands.setContent(htmlSource);
      if (current !== htmlSource) onChange(htmlSource);
    }
    setMode('wysiwyg');
  };

  if (!editor) return null;

  return (
    <div className="border border-[var(--border)] rounded-md overflow-hidden">
      {/* Mode Tabs */}
      <div className="flex border-b border-[var(--border)] bg-gray-50">
        <button
          type="button"
          onClick={switchToWysiwyg}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            mode === 'wysiwyg'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={switchToHtml}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            mode === 'html'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          HTML
        </button>
      </div>

      {mode === 'wysiwyg' ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-[var(--border)] bg-gray-50/50">
            <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Fett">
              <Bold size={14} />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Kursiv">
              <Italic size={14} />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Unterstrichen">
              <UnderlineIcon size={14} />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-1 self-center" />

            <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Überschrift 2">
              <Heading2 size={14} />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Überschrift 3">
              <Heading3 size={14} />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-1 self-center" />

            <ToolbarButton active={editor.isActive('link')} onClick={setLink} title="Link">
              <LinkIcon size={14} />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-1 self-center" />

            <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Aufzählung">
              <List size={14} />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Nummerierung">
              <ListOrdered size={14} />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Zitat">
              <Quote size={14} />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code">
              <Code size={14} />
            </ToolbarButton>
          </div>

          {/* Editor Content */}
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none p-3 min-h-[120px] focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-gray-300 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:mb-2 [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-1.5"
          />
        </>
      ) : (
        <textarea
          value={htmlSource}
          onChange={(e) => {
            setHtmlSource(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full p-3 min-h-[160px] text-sm font-mono border-none outline-none resize-y"
        />
      )}
    </div>
  );
}
