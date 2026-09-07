import React, { useMemo } from 'react';
import { useBlog } from '../../context/BlogContext';

export default function AtAGlanceCard() {
  const { stats, isDatabaseConnected, posts } = useBlog();

  // Get distinct categories count
  const distinctCategories = new Set(posts.map((p) => p.category)).size;

  // Compute dynamic sparklines from posts data
  const sparklines = useMemo(() => {
    const postViews = posts.slice(0, 6).map((p) => p.views || 100);
    const maxV = Math.max(...postViews, 1000);
    const minV = Math.min(...postViews, 0);

    // Sparkline 1: Views trend
    const pts1 = postViews.map((v, i) => ({
      x: (i / Math.max(postViews.length - 1, 1)) * 90 + 5,
      y: 30 - ((v - minV) / Math.max(maxV - minV, 1)) * 22
    }));
    let path1 = pts1.length > 0 ? `M ${pts1[0].x},${pts1[0].y}` : 'M 0,20 L 100,20';
    for (let i = 0; i < pts1.length - 1; i++) {
      const cx = (pts1[i].x + pts1[i + 1].x) / 2;
      path1 += ` C ${cx},${pts1[i].y} ${cx},${pts1[i + 1].y} ${pts1[i + 1].x},${pts1[i + 1].y}`;
    }

    // Sparkline 2: Published proportion curve
    const pubRatio = stats.totalPosts > 0 ? stats.publishedCount / stats.totalPosts : 0.8;
    const pubY = Math.round(30 - pubRatio * 20);
    const path2 = `M 0,26 Q 30,${pubY + 4} 60,${pubY} T 100,${pubY - 2}`;

    // Sparkline 3: Posts accumulation
    const path3 = `M 0,${30 - (stats.totalPosts * 2)} Q 35,${24 - stats.totalPosts} 70,${18 - stats.totalPosts} L 100,10`;

    return { path1, path2, path3, lastPt1: pts1[pts1.length - 1] || { x: 90, y: 20 } };
  }, [posts, stats]);

  return (
    <section className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 border border-slate-200 dark:border-[#2c2835]/80 p-6 flex flex-col justify-between shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 dark:bg-[#4cd7f6]" />
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-on-surface">Tổng quan nhanh</h2>
          </div>
          <span className="material-symbols-outlined text-sky-600 dark:text-[#4cd7f6] text-[20px]">query_stats</span>
        </div>

        {/* 3 Mini Sparkline Cards Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Mini Metric 1: Total Posts */}
          <div className="flex flex-col rounded-xl bg-slate-50 dark:bg-[#221e2a] border border-slate-200 dark:border-[#373340]/40 p-3 hover:border-sky-500/40 dark:hover:border-[#4cd7f6]/40 transition-colors">
            <div className="w-full h-10 mb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36">
                <path d={sparklines.path3} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" className="dark:stroke-[#4cd7f6]" />
                <circle cx="100" cy="10" fill="#0284c7" r="3" stroke="#ffffff" strokeWidth="1.5" className="dark:fill-[#4cd7f6] dark:stroke-[#15111d]" />
              </svg>
            </div>
            <span className="font-mono font-bold text-xl text-slate-900 dark:text-on-surface">{stats.totalPosts}</span>
            <span className="font-display text-xs text-slate-500 dark:text-on-surface-variant">Tổng bài viết</span>
          </div>

          {/* Mini Metric 2: Published */}
          <div className="flex flex-col rounded-xl bg-slate-50 dark:bg-[#221e2a] border border-slate-200 dark:border-[#373340]/40 p-3 hover:border-emerald-500/40 dark:hover:border-emerald-400/40 transition-colors">
            <div className="w-full h-10 mb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36">
                <path d={sparklines.path2} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                <circle cx="100" cy="12" fill="#10b981" r="3" stroke="#ffffff" strokeWidth="1.5" className="dark:stroke-[#15111d]" />
              </svg>
            </div>
            <span className="font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400">{stats.publishedCount}</span>
            <span className="font-display text-xs text-slate-500 dark:text-on-surface-variant">Đã xuất bản</span>
          </div>

          {/* Mini Metric 3: Total Views */}
          <div className="flex flex-col rounded-xl bg-slate-50 dark:bg-[#221e2a] border border-slate-200 dark:border-[#373340]/40 p-3 hover:border-pink-500/40 dark:hover:border-[#ec4899]/40 transition-colors">
            <div className="w-full h-10 mb-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36">
                <path d={sparklines.path1} fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                <circle cx={sparklines.lastPt1.x} cy={sparklines.lastPt1.y} fill="#ec4899" r="3" stroke="#ffffff" strokeWidth="1.5" className="dark:stroke-[#15111d]" />
              </svg>
            </div>
            <span className="font-mono font-bold text-xl text-slate-900 dark:text-on-surface">
              {stats.totalViews > 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews}
            </span>
            <span className="font-display text-xs text-slate-500 dark:text-on-surface-variant">Tổng lượt đọc</span>
          </div>
        </div>
      </div>

      {/* System Status & Performance Indicators */}
      <div className="rounded-xl bg-slate-50 dark:bg-[#221e2a]/80 border border-slate-200 dark:border-[#373340]/50 p-4 flex flex-col gap-3 transition-colors">
        <div className="flex items-center justify-between text-xs font-display">
          <span className="text-slate-600 dark:text-on-surface-variant flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDatabaseConnected ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
            Trạng thái Database
          </span>
          <span className={`font-mono font-semibold ${isDatabaseConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {isDatabaseConnected ? 'MongoDB Live (dudi_blog)' : 'Bộ nhớ Cache Cục bộ'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs font-display">
          <span className="text-slate-600 dark:text-on-surface-variant">Chuyên mục đang quản lý</span>
          <span className="text-purple-700 dark:text-purple-300 font-mono font-semibold">{distinctCategories} danh mục</span>
        </div>
        <div className="flex items-center justify-between text-xs font-display">
          <span className="text-slate-600 dark:text-on-surface-variant">Bài viết nháp</span>
          <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">{stats.draftCount} bài nháp</span>
        </div>
      </div>
    </section>
  );
}
