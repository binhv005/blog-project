import React from 'react';

export default function ImageUploadModal({
  isOpen = true,
  className = ''
}) {
  if (isOpen === false) return null;

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-black flex flex-col items-center justify-center text-center shadow-xl transition-all select-none ${className}`}>
      {/* Centered Minimal White Spinner */}
      <div className="flex items-center justify-center p-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-[3.5px] border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
}
