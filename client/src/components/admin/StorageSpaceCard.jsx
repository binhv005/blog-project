import React from 'react';

const storageResources = [
  { label: 'Âm thanh', count: '74', icon: 'music_note', iconColor: 'text-amber-400' },
  { label: 'Videos', count: '124', icon: 'play_circle', iconColor: 'text-[#4cd7f6]' },
  { label: 'Hình ảnh', count: '7,342', icon: 'photo_library', iconColor: 'text-[#ff5167]' },
  { label: 'Tệp khác', count: '93,946', icon: 'attachment', iconColor: 'text-[#ddb7ff]' },
];

export default function StorageSpaceCard() {
  return (
    <section className="rounded-2xl bg-[#1e1a26]/90 border border-[#2c2835]/80 p-6 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-base text-on-surface">Dung lượng lưu trữ</h2>
        <button 
          type="button" 
          onClick={() => alert('Mở bảng giá nâng cấp gói PRO')}
          className="text-xs font-mono text-[#4cd7f6] hover:underline cursor-pointer"
        >
          Nâng cấp gói PRO
        </button>
      </div>

      {/* Progress Bar Block matching Image 2 */}
      <div className="relative w-full h-10 rounded-xl bg-[#221e2a] border border-[#373340]/50 p-1 flex items-center overflow-hidden mb-4">
        {/* 32% Filled Area */}
        <div className="h-full w-[32%] rounded-lg bg-gradient-to-r from-[#03b5d3] to-[#4cd7f6] flex items-center justify-center shadow-[0_0_12px_rgba(76,215,246,0.3)]">
          <span className="font-display font-bold text-xs text-[#003640] whitespace-nowrap px-2">
            32% Đã dùng
          </span>
        </div>
        {/* Remaining Text on Right */}
        <span className="ml-auto pr-3 font-mono text-xs text-on-surface-variant font-medium">
          3.2GB / 10GB
        </span>
      </div>

      {/* 4 Resource Count Categories */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-1">
        {storageResources.map((res, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-on-surface/80">
            <span className={`material-symbols-outlined text-[18px] ${res.iconColor}`}>
              {res.icon}
            </span>
            <span className="font-mono text-on-surface font-semibold">{res.count}</span>
            <span className="text-on-surface-variant">{res.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
