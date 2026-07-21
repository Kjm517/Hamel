import { useState, type ReactNode } from 'react';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

export interface SortableItem {
  id: string;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  /** Optional class on each row wrapper */
  rowClassName?: string;
}

/** Drag-and-drop reorder list (native HTML5). */
export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  rowClassName = '',
}: SortableListProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDragId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragId && dragId !== id) setOverId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
    setDragId(null);
    setOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDrop={() => handleDrop(item.id)}
          className={`flex gap-2 rounded-lg border bg-white transition-shadow ${rowClassName} ${
            dragId === item.id ? 'opacity-50 border-[#0EA5E9]' : 'border-gray-200'
          } ${overId === item.id && dragId !== item.id ? 'ring-2 ring-[#0EA5E9]/40' : ''}`}
        >
          <div
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            className="hidden shrink-0 cursor-grab active:cursor-grabbing items-center justify-center px-2 text-gray-400 hover:text-[#0EA5E9] bg-gray-50 rounded-l-lg border-r border-gray-100 self-stretch sm:flex"
            title="Drag to reorder"
          >
            <GripVertical size={18} />
          </div>
          <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 self-stretch rounded-l-lg border-r border-gray-100 bg-gray-50 px-1 py-1 sm:hidden">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 transition-colors hover:bg-white hover:text-[#0EA5E9] disabled:opacity-30"
              aria-label="Move up"
              title="Move up"
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 transition-colors hover:bg-white hover:text-[#0EA5E9] disabled:opacity-30"
              aria-label="Move down"
              title="Move down"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="flex-1 min-w-0 py-1">{renderItem(item, index)}</div>
        </div>
      ))}
    </div>
  );
}
