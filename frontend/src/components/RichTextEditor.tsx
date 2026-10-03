import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  RemoveFormatting,
} from 'lucide-react';
import clsx from 'clsx';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function run(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const save = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    const plain = ref.current.innerText.trim();
    onChange(plain ? html : '');
  };

  const addLink = () => {
    const url = window.prompt('Link URL');
    if (url) run('createLink', url);
    save();
  };

  return (
    <div className={clsx('rte', focused && 'rte-focused')}>
      <div className="rte-toolbar">
        <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); run('bold'); }}>
          <Bold size={14} />
        </button>
        <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); run('italic'); }}>
          <Italic size={14} />
        </button>
        <button type="button" title="Underline" onMouseDown={(e) => { e.preventDefault(); run('underline'); }}>
          <Underline size={14} />
        </button>
        <button type="button" title="Strikethrough" onMouseDown={(e) => { e.preventDefault(); run('strikeThrough'); }}>
          <Strikethrough size={14} />
        </button>
        <span className="rte-sep" />
        <button type="button" title="Bullet list" onMouseDown={(e) => { e.preventDefault(); run('insertUnorderedList'); }}>
          <List size={14} />
        </button>
        <button type="button" title="Numbered list" onMouseDown={(e) => { e.preventDefault(); run('insertOrderedList'); }}>
          <ListOrdered size={14} />
        </button>
        <span className="rte-sep" />
        <button type="button" title="Align left" onMouseDown={(e) => { e.preventDefault(); run('justifyLeft'); }}>
          <AlignLeft size={14} />
        </button>
        <button type="button" title="Align center" onMouseDown={(e) => { e.preventDefault(); run('justifyCenter'); }}>
          <AlignCenter size={14} />
        </button>
        <button type="button" title="Align right" onMouseDown={(e) => { e.preventDefault(); run('justifyRight'); }}>
          <AlignRight size={14} />
        </button>
        <span className="rte-sep" />
        <button type="button" title="Inline code" onMouseDown={(e) => {
          e.preventDefault();
          run('formatBlock', 'pre');
        }}>
          <Code size={14} />
        </button>
        <button type="button" title="Link" onMouseDown={(e) => { e.preventDefault(); addLink(); }}>
          <LinkIcon size={14} />
        </button>
        <span className="rte-sep" />
        <button type="button" title="Undo" onMouseDown={(e) => { e.preventDefault(); run('undo'); }}>
          <Undo2 size={14} />
        </button>
        <button type="button" title="Redo" onMouseDown={(e) => { e.preventDefault(); run('redo'); }}>
          <Redo2 size={14} />
        </button>
        <button type="button" title="Clear format" onMouseDown={(e) => { e.preventDefault(); run('removeFormat'); save(); }}>
          <RemoveFormatting size={14} />
        </button>
      </div>
      <div
        ref={ref}
        className="rte-body"
        contentEditable
        data-placeholder={placeholder || 'Add description…'}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          save();
        }}
        onInput={save}
        suppressContentEditableWarning
      />
    </div>
  );
}
