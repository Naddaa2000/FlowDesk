import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { ApiStatus } from '../api/client';
import clsx from 'clsx';

const PALETTE = [
  '#64748b',
  '#1e3a5f',
  '#7c3aed',
  '#0ea5e9',
  '#10b981',
  '#eab308',
  '#f97316',
  '#ec4899',
  '#db2777',
  '#92400e',
  '#0f766e',
  '#ef4444',
];

type Bucket = 'open' | 'custom' | 'closed';

const BUCKETS: { key: Bucket; label: string }[] = [
  { key: 'open', label: 'Not started' },
  { key: 'custom', label: 'Active' },
  { key: 'closed', label: 'Done / Closed' },
];

function bucketOf(s: ApiStatus): Bucket {
  if (s.type === 'open') return 'open';
  if (s.type === 'closed') return 'closed';
  return 'custom';
}

function normalizeHex(value: string): string | null {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toLowerCase()}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const [, a, b, c] = v;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return null;
}

function ColorPicker({
  color,
  onChange,
  onClose,
  onNativePickStart,
  onNativePickEnd,
}: {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  onNativePickStart?: () => void;
  onNativePickEnd?: () => void;
}) {
  const [hex, setHex] = useState(color);

  useEffect(() => {
    setHex(color);
  }, [color]);

  return (
    <div
      className="status-palette"
      data-status-color-picker
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="status-palette-grid">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={clsx(
              'status-palette-swatch',
              color.toLowerCase() === c.toLowerCase() && 'selected',
            )}
            style={{ background: c }}
            title={c}
            onClick={() => {
              onChange(c);
              onClose();
            }}
          />
        ))}
      </div>
      <div className="status-palette-custom">
        <label className="status-palette-native">
          <span>Custom</span>
          <input
            type="color"
            value={normalizeHex(color) || '#0f766e'}
            onMouseDown={() => onNativePickStart?.()}
            onFocus={() => onNativePickStart?.()}
            onBlur={() => {
              // Native OS picker can blur this input before the user finishes;
              // keep our popover mounted so the dialog isn't torn down mid-pick.
              window.setTimeout(() => onNativePickEnd?.(), 300);
            }}
            onChange={(e) => {
              setHex(e.target.value);
              onChange(e.target.value);
            }}
            onInput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              setHex(value);
              onChange(value);
            }}
          />
        </label>
        <input
          className="status-palette-hex"
          value={hex}
          placeholder="#0f766e"
          onChange={(e) => {
            setHex(e.target.value);
            const next = normalizeHex(e.target.value);
            if (next) onChange(next);
          }}
          onBlur={() => {
            const next = normalizeHex(hex);
            if (next) {
              setHex(next);
              onChange(next);
            } else setHex(color);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const next = normalizeHex(hex);
              if (next) {
                onChange(next);
                onClose();
              }
            }
            if (e.key === 'Escape') onClose();
          }}
        />
      </div>
    </div>
  );
}

export function StatusManagerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    projects,
    selectedProjectId,
    addStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
  } = useAppStore();

  const project = projects.find((p) => p.id === selectedProjectId);
  const [local, setLocal] = useState<ApiStatus[]>([]);
  const [colorFor, setColorFor] = useState<string | null>(null);
  const [addingBucket, setAddingBucket] = useState<Bucket | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[3]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nativePicking = useRef(false);
  const colorSaveTimer = useRef<number | null>(null);

  // Only reset when the modal opens — not on every project update (saving a
  // color was previously closing the picker mid-interaction).
  useEffect(() => {
    if (!open || !selectedProjectId) return;
    const current = useAppStore
      .getState()
      .projects.find((p) => p.id === selectedProjectId);
    if (!current) return;
    setLocal(
      [...current.statuses].sort((a, b) => a.orderindex - b.orderindex),
    );
    setError('');
    setColorFor(null);
    setAddingBucket(null);
    nativePicking.current = false;
  }, [open, selectedProjectId]);

  useEffect(() => {
    if (!colorFor) return;

    const onPointerDown = (e: PointerEvent) => {
      if (nativePicking.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-status-color-picker], .status-color-wrap')) {
        return;
      }
      setColorFor(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !nativePicking.current) setColorFor(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [colorFor]);

  const grouped = useMemo(() => {
    const map: Record<Bucket, ApiStatus[]> = {
      open: [],
      custom: [],
      closed: [],
    };
    for (const s of local) map[bucketOf(s)].push(s);
    return map;
  }, [local]);

  if (!open || !project) return null;

  const persistOrder = async (next: ApiStatus[]) => {
    setLocal(next);
    setBusy(true);
    setError('');
    try {
      await reorderStatuses(next.map((s) => s.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed');
      setLocal(
        [...project.statuses].sort((a, b) => a.orderindex - b.orderindex),
      );
    } finally {
      setBusy(false);
    }
  };

  const onDragStart = (e: DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const onDropOn = async (
    e: DragEvent,
    targetBucket: Bucket,
    targetId?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    setDragId(null);
    if (!id) return;
    if (targetId && id === targetId) return;

    const moving = local.find((s) => s.id === id);
    if (!moving) return;

    const nextType = targetBucket === 'custom' ? 'custom' : targetBucket;
    const working = local.map((s) =>
      s.id === id ? { ...s, type: nextType } : s,
    );

    if (bucketOf(moving) !== targetBucket) {
      setBusy(true);
      try {
        await updateStatus(id, { type: nextType });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move status');
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    const without = working.filter((s) => s.id !== id);
    const item = working.find((s) => s.id === id)!;
    let insertAt = without.length;
    if (targetId) {
      const idx = without.findIndex((s) => s.id === targetId);
      if (idx >= 0) insertAt = idx;
    } else {
      let lastInBucket = -1;
      without.forEach((s, i) => {
        if (bucketOf(s) === targetBucket) lastInBucket = i;
      });
      if (lastInBucket >= 0) insertAt = lastInBucket + 1;
      else {
        const order: Bucket[] = ['open', 'custom', 'closed'];
        const before = order.slice(0, order.indexOf(targetBucket));
        lastInBucket = -1;
        without.forEach((s, i) => {
          if (before.includes(bucketOf(s))) lastInBucket = i;
        });
        insertAt = lastInBucket + 1;
      }
    }

    const next = [...without];
    next.splice(insertAt, 0, item);
    await persistOrder(next.map((s, i) => ({ ...s, orderindex: i })));
  };

  const rename = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLocal((list) => list.map((s) => (s.id === id ? { ...s, name: trimmed } : s)));
    try {
      await updateStatus(id, { name: trimmed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed');
    }
  };

  const changeColor = (id: string, color: string) => {
    setLocal((list) => list.map((s) => (s.id === id ? { ...s, color } : s)));
    if (colorSaveTimer.current) window.clearTimeout(colorSaveTimer.current);
    colorSaveTimer.current = window.setTimeout(async () => {
      try {
        await updateStatus(id, { color });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Color update failed');
      }
    }, 200);
  };

  const remove = async (id: string, name: string) => {
    if (local.length <= 1) {
      setError('Cannot delete the last status');
      return;
    }
    if (!confirm(`Delete status "${name}"? Tasks will move to another status.`)) return;
    try {
      await deleteStatus(id);
      setLocal((list) => list.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const createInBucket = async (bucket: Bucket) => {
    if (!newName.trim()) return;
    setBusy(true);
    setError('');
    try {
      await addStatus(newName.trim(), newColor, bucket === 'custom' ? 'custom' : bucket);
      const refreshed = useAppStore
        .getState()
        .projects.find((p) => p.id === selectedProjectId);
      if (refreshed) {
        setLocal(
          [...refreshed.statuses].sort((a, b) => a.orderindex - b.orderindex),
        );
      }
      setNewName('');
      setAddingBucket(null);
      setColorFor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const pickerProps = {
    onNativePickStart: () => {
      nativePicking.current = true;
    },
    onNativePickEnd: () => {
      nativePicking.current = false;
    },
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal status-manager"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="status-manager-header">
          <div>
            <h2>Edit {project.name} statuses</h2>
            <p>Drag to reorder. Change colors. Lead & admin only.</p>
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="status-manager-body">
          {BUCKETS.map(({ key, label }) => (
            <section
              key={key}
              className="status-bucket"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropOn(e, key)}
            >
              <div className="status-bucket-title">{label}</div>
              <div className="status-rows">
                {grouped[key].map((s) => (
                  <div
                    key={s.id}
                    className={clsx(
                      'status-row',
                      dragId === s.id && 'status-row-dragging',
                    )}
                    draggable
                    onDragStart={(e) => onDragStart(e, s.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropOn(e, key, s.id)}
                  >
                    <GripVertical size={16} className="status-grip" />
                    <div
                      className="status-color-wrap"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="status-color-btn"
                        style={{ background: s.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorFor(colorFor === s.id ? null : s.id);
                        }}
                        title="Change color"
                      />
                      {colorFor === s.id && (
                        <ColorPicker
                          color={s.color}
                          onChange={(c) => changeColor(s.id, c)}
                          onClose={() => setColorFor(null)}
                          {...pickerProps}
                        />
                      )}
                    </div>
                    <input
                      className="status-name-input"
                      defaultValue={s.name}
                      key={`${s.id}-${s.name}`}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== s.name) {
                          rename(s.id, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="board-col-btn danger"
                      title="Delete"
                      onClick={() => remove(s.id, s.name)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {addingBucket === key ? (
                  <div className="status-add-row">
                    <div
                      className="status-color-wrap"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="status-color-btn"
                        style={{ background: newColor }}
                        onClick={() =>
                          setColorFor(colorFor === '__new__' ? null : '__new__')
                        }
                        title="Pick color"
                      />
                      {colorFor === '__new__' && (
                        <ColorPicker
                          color={newColor}
                          onChange={setNewColor}
                          onClose={() => setColorFor(null)}
                          {...pickerProps}
                        />
                      )}
                    </div>
                    <input
                      autoFocus
                      className="status-name-input"
                      placeholder="Status name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') createInBucket(key);
                        if (e.key === 'Escape') setAddingBucket(null);
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={busy}
                      onClick={() => createInBucket(key)}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="status-add-btn"
                    onClick={() => {
                      setAddingBucket(key);
                      setNewName('');
                      setNewColor(
                        PALETTE[key === 'open' ? 0 : key === 'closed' ? 4 : 3],
                      );
                    }}
                  >
                    <Plus size={14} /> Add status
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>

        {error && (
          <div className="auth-error" style={{ margin: '0 20px 12px' }}>
            {error}
          </div>
        )}

        <div className="status-manager-footer">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {busy ? 'Saving…' : 'Changes save as you edit'}
          </span>
          <button className="btn btn-primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
