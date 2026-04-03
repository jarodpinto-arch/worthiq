"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

export interface DashboardTab {
  id: string;
  title: string;
  variant: string;
  hidden?: boolean;
  widgetId?: string;
  exampleKey?: string;
  manualLayout?: any;
}

interface ManageViewsModalProps {
  open: boolean;
  onClose: () => void;
  tabs: DashboardTab[];
  onChange: (tabs: DashboardTab[]) => void;
  /** Which tab opens when you load the dashboard (persisted by parent). */
  defaultLandingTabId?: string | null;
  onDefaultLandingTabSave?: (tabId: string) => void;
}

export function ManageViewsModal({
  open,
  onClose,
  tabs,
  onChange,
  defaultLandingTabId,
  onDefaultLandingTabSave,
}: ManageViewsModalProps) {
  const [local, setLocal] = useState<DashboardTab[]>(tabs);
  const [landingPick, setLandingPick] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync when opened
  useEffect(() => {
    if (!open) return;
    setLocal(tabs);
    const visible = tabs.filter((t) => !t.hidden);
    const pick =
      defaultLandingTabId && visible.some((t) => t.id === defaultLandingTabId)
        ? defaultLandingTabId
        : visible[0]?.id ?? '';
    setLandingPick(pick);
  }, [open, tabs, defaultLandingTabId]);

  // Close on backdrop click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const toggleVisibility = (id: string) =>
    setLocal((prev) => prev.map((t) => (t.id === id ? { ...t, hidden: !t.hidden } : t)));

  const remove = (id: string) =>
    setLocal((prev) => prev.filter((t) => t.id !== id));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setLocal((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setLocal((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  // Drag-to-reorder
  const onDragStart = (id: string) => setDraggingId(id);
  const onDragOver  = (id: string) => { dragOverId.current = id; };
  const onDragEnd   = () => {
    if (!draggingId || !dragOverId.current || draggingId === dragOverId.current) {
      setDraggingId(null);
      dragOverId.current = null;
      return;
    }
    setLocal((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((t) => t.id === draggingId);
      const toIdx   = next.findIndex((t) => t.id === dragOverId.current);
      const [item]  = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
    setDraggingId(null);
    dragOverId.current = null;
  };

  const save = () => {
    onChange(local);
    const visible = local.filter((t) => !t.hidden);
    const pick = visible.some((t) => t.id === landingPick) ? landingPick : (visible[0]?.id ?? '');
    if (pick) onDefaultLandingTabSave?.(pick);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#0D1017] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Manage Views</h2>
            <p className="mt-0.5 text-xs text-slate-500">Drag to reorder · toggle visibility · delete · default landing tab</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab list */}
        <div className="px-4 py-3 max-h-[60vh] overflow-y-auto space-y-1.5">
          {local.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-600">No views yet. Add one from the dashboard.</p>
          )}
          {local.map((tab, idx) => (
            <div
              key={tab.id}
              draggable
              onDragStart={() => onDragStart(tab.id)}
              onDragOver={(e) => { e.preventDefault(); onDragOver(tab.id); }}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all select-none
                ${draggingId === tab.id
                  ? 'border-worthiq-cyan/40 bg-worthiq-cyan/5 opacity-60'
                  : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                }
                ${tab.hidden ? 'opacity-50' : ''}
              `}
            >
              {/* Drag handle */}
              <GripVertical size={15} className="text-slate-600 cursor-grab shrink-0" />

              {/* Tab name */}
              <span className={`flex-1 text-sm font-semibold truncate ${tab.hidden ? 'text-slate-600' : 'text-slate-200'}`}>
                {tab.title}
              </span>

              {/* Up/down arrows */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="rounded p-1 text-slate-600 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === local.length - 1}
                  className="rounded p-1 text-slate-600 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                >
                  <ChevronDown size={13} />
                </button>
              </div>

              {/* Visibility toggle — Overview always stays available */}
              <button
                onClick={() => toggleVisibility(tab.id)}
                disabled={tab.variant === 'overview'}
                className={`rounded p-1.5 transition ${
                  tab.hidden
                    ? 'text-slate-600 hover:text-slate-300'
                    : 'text-worthiq-cyan hover:text-worthiq-cyan/70'
                } ${tab.variant === 'overview' ? 'opacity-30 cursor-not-allowed' : ''}`}
                title={
                  tab.variant === 'overview'
                    ? 'Overview is always visible'
                    : tab.hidden
                      ? 'Show tab'
                      : 'Hide tab'
                }
              >
                {tab.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>

              {/* Delete (non-default tabs only) */}
              {tab.variant !== 'overview' && tab.variant !== 'cashflow' && (
                <button
                  onClick={() => remove(tab.id)}
                  className="rounded p-1.5 text-slate-700 transition hover:bg-red-500/15 hover:text-red-400"
                  title="Remove view"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Open dashboard on</p>
          <p className="text-xs text-slate-600 mb-2">
            Choose which view loads first. You can still switch tabs anytime.
          </p>
          <div className="space-y-1.5 max-h-[28vh] overflow-y-auto">
            {local.filter((t) => !t.hidden).map((tab) => (
              <label
                key={tab.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-300 hover:border-slate-700"
              >
                <input
                  type="radio"
                  name="worthiq-landing-tab"
                  className="border-slate-600 text-worthiq-cyan focus:ring-worthiq-cyan/40"
                  checked={landingPick === tab.id}
                  onChange={() => setLandingPick(tab.id)}
                />
                <span className="font-medium truncate">{tab.title}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:border-slate-600 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-xl bg-worthiq-cyan px-5 py-2 text-sm font-bold text-black transition hover:bg-worthiq-cyan/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
