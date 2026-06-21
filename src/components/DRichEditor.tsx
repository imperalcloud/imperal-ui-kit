'use client';

import { useCallback, useContext, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { UIComponent, UIAction } from '../types';
import { FormContext } from './DForm';

// ── Toolbar helpers ──────────────────────────────────────────────────────────

function ToolbarBtn({
  children, active, onClick, title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'p-1.5 rounded text-xs transition-all duration-150',
        active
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-zinc-800 mx-1 flex-shrink-0" />;
}

// ── Main component ───────────────────────────────────────────────────────────

export const DRichEditor: UIComponent = ({ node, onAction }) => {
  const form = useContext(FormContext);
  const {
    content: initContent = '',
    placeholder = 'Start writing...',
    on_save,
    on_change,
    param_name = 'content',
    toolbar = true,
  } = node.props as {
    content?: string;
    placeholder?: string;
    on_save?: UIAction;
    on_change?: UIAction;
    param_name?: string;
    toolbar?: boolean;
  };

  // Debounce timer for on_change
  const changeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fire on_change action (debounced 500ms)
  const fireChange = useCallback((html: string) => {
    if (!on_change || !onAction) return;
    if (changeTimer.current) clearTimeout(changeTimer.current);
    changeTimer.current = setTimeout(() => {
      onAction({
        ...on_change,
        params: { ...(on_change.params || {}), [param_name]: html },
      });
    }, 500);
  }, [on_change, onAction, param_name]);

  // Ctrl+S / Cmd+S keyboard shortcut extension
  const SaveShortcut = Extension.create({
    name: 'saveShortcut',
    addKeyboardShortcuts() {
      return {
        'Mod-s': () => {
          if (on_save && onAction) {
            const html = this.editor.getHTML();
            onAction({
              ...on_save,
              params: { ...(on_save.params || {}), [param_name]: html },
            });
          }
          return true; // prevent browser save dialog
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      SaveShortcut,
    ],
    content: initContent,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // In form mode: keep form state in sync
      if (form) {
        form.setField(param_name, html);
      }
      // Fire on_change action (debounced)
      fireChange(html);
    },
  });

  // Sync initial content into form if inside a Form
  useEffect(() => {
    if (form && initContent) {
      form.setField(param_name, initContent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external content changes (e.g. form reset)
  useEffect(() => {
    if (!editor || !form) return;
    const formVal = form.values[param_name] as string | undefined;
    if (formVal !== undefined && formVal !== editor.getHTML()) {
      editor.commands.setContent(formVal, { emitUpdate: false });
    }
  }, [editor, form, param_name]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (changeTimer.current) clearTimeout(changeTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col rounded-md border border-zinc-700 bg-zinc-900 overflow-hidden">
      {/* Toolbar */}
      {toolbar && editor && (
        <div className="flex items-center flex-wrap gap-0 px-2 py-1.5 border-b border-zinc-800 bg-zinc-950/50">
          <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <span className="font-bold">B</span>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <span className="italic">I</span>
          </ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
            H1
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
            H2
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
            H3
          </ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13" />
              <text x="1" y="8" fontSize="7" fill="currentColor" stroke="none">1</text>
              <text x="1" y="14" fontSize="7" fill="currentColor" stroke="none">2</text>
              <text x="1" y="20" fontSize="7" fill="currentColor" stroke="none">3</text>
            </svg>
          </ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </ToolbarBtn>
          <ToolbarBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M3 12h18" />
            </svg>
          </ToolbarBtn>
          {on_save && (
            <>
              <ToolbarDivider />
              <ToolbarBtn
                active={false}
                onClick={() => {
                  if (onAction && on_save) {
                    onAction({
                      ...on_save,
                      params: { ...(on_save.params || {}), [param_name]: editor.getHTML() },
                    });
                  }
                }}
                title="Save (Ctrl+S)"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </ToolbarBtn>
            </>
          )}
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
};
