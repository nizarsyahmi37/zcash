'use client';

import { useState } from 'react';
import { CLUSTER_COLORS } from '@/types';

interface ClusterFormProps {
  initialName?: string;
  initialDescription?: string;
  initialColor?: string;
  onSubmit: (name: string, description: string, color: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ClusterForm({
  initialName = '',
  initialDescription = '',
  initialColor = CLUSTER_COLORS[0],
  onSubmit,
  onCancel,
  submitLabel = 'Create Cluster',
}: ClusterFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [color, setColor] = useState(initialColor);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim(), color);
    if (!initialName) {
      setName('');
      setDescription('');
      setColor(CLUSTER_COLORS[0]);
      setIsExpanded(false);
    }
  };

  if (!isExpanded && !initialName) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all hover:border-yellow-500 hover:text-yellow-400"
        style={{ borderColor: '#333', color: '#666' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create New Cluster
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl shadow-lg p-5 border" style={{ background: 'rgba(26, 26, 26, 0.8)', borderColor: '#2d2d2d' }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#f5e6c8' }}>
        {initialName ? 'Edit Cluster' : 'Create New Cluster'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>
            Cluster Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Savings, Trading"
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: '#1a1a1a', borderColor: '#333', color: '#f5e6c8' }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#999' }}>
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Long-term savings"
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: '#1a1a1a', borderColor: '#333', color: '#f5e6c8' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#999' }}>
            Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {CLUSTER_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-yellow-400 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          type="submit"
          className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
          style={{ background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', color: '#000' }}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{ borderColor: '#333', color: '#999' }}
          >
            Cancel
          </button>
        )}
        {!initialName && onCancel && (
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setName('');
              setDescription('');
            }}
            className="px-4 py-2"
            style={{ color: '#666' }}
          >
            Close
          </button>
        )}
      </div>
    </form>
  );
}