import { useMemo, useRef, useState } from 'react';
import type { ApiUser } from '../api/client';
import { Avatar } from './Avatar';

type Props = {
  members: ApiUser[];
  onSubmit: (text: string, mentionIds: string[]) => Promise<void> | void;
  placeholder?: string;
};

export function MentionCommentInput({
  members,
  onSubmit,
  placeholder = 'Write a comment… Use @ to mention',
}: Props) {
  const [text, setText] = useState('');
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = useMemo(() => {
    if (!open) return [];
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
    );
  }, [members, open, query]);

  const detectMention = (value: string, cursor: number) => {
    const before = value.slice(0, cursor);
    const match = before.match(/@([^\s@]*)$/);
    if (match) {
      setOpen(true);
      setQuery(match[1] || '');
    } else {
      setOpen(false);
      setQuery('');
    }
  };

  const insertMention = (user: ApiUser) => {
    const el = inputRef.current;
    if (!el) return;
    const cursor = el.selectionStart ?? text.length;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const replaced = before.replace(/@([^\s@]*)$/, `@${user.name} `);
    const next = replaced + after;
    setText(next);
    setMentionIds((ids) => (ids.includes(user.id) ? ids : [...ids, user.id]));
    setOpen(false);
    setQuery('');
    requestAnimationFrame(() => {
      el.focus();
      const pos = replaced.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit(text.trim(), mentionIds);
      setText('');
      setMentionIds([]);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="comment-form mention-form" onSubmit={submit}>
      <div className="mention-wrap">
        <textarea
          ref={inputRef}
          rows={2}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            detectMention(e.target.value, e.target.selectionStart);
          }}
          onKeyUp={(e) =>
            detectMention(
              (e.target as HTMLTextAreaElement).value,
              (e.target as HTMLTextAreaElement).selectionStart,
            )
          }
          onClick={(e) =>
            detectMention(
              (e.target as HTMLTextAreaElement).value,
              (e.target as HTMLTextAreaElement).selectionStart,
            )
          }
        />
        {open && suggestions.length > 0 && (
          <div className="mention-menu">
            {suggestions.slice(0, 6).map((u) => (
              <button
                key={u.id}
                type="button"
                className="mention-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(u);
                }}
              >
                <Avatar user={u} />
                <span>
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        Send
      </button>
    </form>
  );
}

/** Highlight @Name mentions in plain comment text */
export function renderCommentText(text: string) {
  const parts = text.split(/(@[A-Za-z0-9._ -]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="mention-chip">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
