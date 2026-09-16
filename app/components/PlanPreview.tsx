'use client';

import { useState } from 'react';

interface PlanPreviewProps {
  initialPlan: string | null;
}

export default function PlanPreview({ initialPlan }: PlanPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!initialPlan) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition"
      >
        Preview Plan ↗
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white text-sm font-semibold uppercase tracking-wider">Plan Preview</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white text-xs uppercase font-mono"
              >
                Close [X]
              </button>
            </div>
            <div className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
              {initialPlan}
            </div>
          </div>
        </div>
      )}
    </>
  );
}