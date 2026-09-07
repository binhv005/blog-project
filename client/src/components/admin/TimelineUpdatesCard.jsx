import React from 'react';
import { useBlog } from '../../context/BlogContext';

export default function TimelineUpdatesCard() {
  const { posts, selectPost } = useBlog();

  // Get recent 4 posts or updates
  const recentUpdates = posts.slice(0, 4).map((post, idx) => {
    const dotColors = [
      'border-amber-400 bg-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.6)] text-amber-300',
      'border-[#4cd7f6] bg-[#4cd7f6]/20 shadow-[0_0_8px_rgba(76,215,246,0.6)] text-[#4cd7f6]',
      'border-emerald-400 bg-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.6)] text-emerald-300',
      'border-[#ff5167] bg-[#ff5167]/20 shadow-[0_0_8px_rgba(255,81,103,0.6)] text-[#ffb3b5]'
    ];
    return {
      id: post.id,
      day: post.date ? post.date.split(',')[0] : 'Gần đây',
      time: post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp',
      dotColor: dotColors[idx % dotColors.length].split(' text-')[0],
      titleColor: dotColors[idx % dotColors.length].split(' text-')[1] ? `text-${dotColors[idx % dotColors.length].split(' text-')[1]}` : 'text-white',
      title: post.title,
      desc: `${post.views?.toLocaleString?.() || post.views} lượt xem • Tác giả: ${post.author?.name || 'Alex Vũ'}`,
      hasLine: idx < 3
    };
  });

  return (
    <section className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 border border-slate-200 dark:border-[#2c2835]/80 p-6 flex flex-col justify-between shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-on-surface">Cập nhật mới (MongoDB)</h2>
        <span className="px-2.5 py-0.5 rounded-full bg-[#ff5167]/10 text-rose-600 dark:text-[#ffb3b5] font-mono text-[11px] font-bold">
          {posts.length} bài viết
        </span>
      </div>

      {/* Vertical Timeline List */}
      <div className="flex flex-col space-y-4 my-auto">
        {recentUpdates.map((item) => (
          <div 
            key={item.id} 
            onClick={() => selectPost(item.id)}
            className="flex items-start gap-4 group cursor-pointer"
          >
            {/* Timestamp */}
            <div className="w-20 text-right flex flex-col flex-shrink-0 pt-0.5">
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-on-surface-variant truncate">{item.day}</span>
              <span className="font-mono text-[10px] text-slate-400 dark:text-on-surface-variant/60">{item.time}</span>
            </div>

            {/* Indicator Node + Vertical Line */}
            <div className="pt-1.5 flex flex-col items-center flex-shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full border-2 transition-transform group-hover:scale-125 ${item.dotColor}`} />
              {item.hasLine && <div className="w-0.5 h-10 bg-slate-200 dark:bg-[#2c2835] mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <span className="font-display font-semibold text-sm text-slate-900 dark:text-white transition-colors line-clamp-2 break-words block leading-snug group-hover:text-rose-600 dark:group-hover:text-[#ff5167] group-hover:underline">
                {item.title}
              </span>
              <span className="text-xs text-slate-500 dark:text-on-surface-variant block mt-0.5 break-words font-mono">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
