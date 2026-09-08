import React, { useMemo } from 'react';
import { useBlog } from '../../context/BlogContext';

export default function AtAGlanceCard() {
  const { stats, isDatabaseConnected, posts } = useBlog();

  // Get distinct categories count
  const distinctCategories = useMemo(() => {
    return new Set(posts.map((p) => p.category).filter(Boolean)).size;
  }, [posts]);

  // Compute dynamic sparklines from posts data
  const sparklines = useMemo(() => {
    const postViews = posts.slice(0, 7).map((p) => p.views || 100);
    const maxV = Math.max(...postViews, 1000);
    const minV = Math.min(...postViews, 0);

    // Sparkline 1: Total Views trend curve
    const pts1 = postViews.map((v, i) => ({
      x: (i / Math.max(postViews.length - 1, 1)) * 90 + 5,
      y: 28 - ((v - minV) / Math.max(maxV - minV, 1)) * 18
    }));
    let line1 = pts1.length > 0 ? `M ${pts1[0].x},${pts1[0].y}` : 'M 5,20 L 95,20';
    for (let i = 0; i < pts1.length - 1; i++) {
      const cx = (pts1[i].x + pts1[i + 1].x) / 2;
      line1 += ` C ${cx},${pts1[i].y} ${cx},${pts1[i + 1].y} ${pts1[i + 1].x},${pts1[i + 1].y}`;
    }
    const lastPt1 = pts1[pts1.length - 1] || { x: 95, y: 15 };
    const area1 = `${line1} L ${lastPt1.x},34 L ${pts1[0]?.x || 5},34 Z`;

    // Sparkline 2: Published curve
    const pubRatio = stats.totalPosts > 0 ? stats.publishedCount / stats.totalPosts : 0.8;
    const pubY = Math.round(26 - pubRatio * 16);
    const line2 = `M 5,26 C 30,${pubY + 6} 65,${pubY - 2} 95,${pubY}`;
    const area2 = `${line2} L 95,34 L 5,34 Z`;

    // Sparkline 3: Posts accumulation curve
    const postY = Math.max(8, 26 - Math.min(stats.totalPosts, 10) * 1.8);
    const line3 = `M 5,26 C 35,${postY + 6} 65,${postY + 2} 95,${postY}`;
    const area3 = `${line3} L 95,34 L 5,34 Z`;

    return {
      line1, area1, lastPt1,
      line2, area2, pubY,
      line3, area3, postY
    };
  }, [posts, stats]);

  const publishPercentage = stats.totalPosts > 0 
    ? Math.round((stats.publishedCount / stats.totalPosts) * 100) 
    : 0;

  return (
    <section className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 border border-slate-200/90 dark:border-[#2c2835]/80 p-5 sm:p-6 flex flex-col justify-between shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-[#4cd7f6]/10 flex items-center justify-center text-sky-600 dark:text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[19px]">insights</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-on-surface leading-none">
                Tổng quan nhanh
              </h2>
              <p className="text-[11px] font-display text-slate-500 dark:text-on-surface-variant/70 mt-1">
                Chỉ số hệ thống & tương tác
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#2c2835]/60 text-slate-600 dark:text-on-surface-variant text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Thời gian thực</span>
          </div>
        </div>

        {/* 3 Metric Mini Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-5">
          {/* Card 1: Tổng bài viết */}
          <div className="group flex flex-col justify-between rounded-xl bg-gradient-to-b from-sky-500/[0.04] to-transparent dark:from-sky-500/[0.08] dark:to-transparent border border-sky-100 dark:border-sky-500/20 p-3 sm:p-3.5 hover:border-sky-400/50 dark:hover:border-[#4cd7f6]/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-display font-medium text-slate-500 dark:text-on-surface-variant line-clamp-1">
                Tổng bài
              </span>
              <span className="material-symbols-outlined text-[15px] text-sky-600 dark:text-[#4cd7f6] opacity-75">
                article
              </span>
            </div>

            <div className="w-full h-8 my-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={sparklines.area3} fill="url(#sparkGradBlue)" />
                <path d={sparklines.line3} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" className="dark:stroke-[#4cd7f6]" />
                <circle cx="95" cy={sparklines.postY} fill="#0284c7" r="3" stroke="#ffffff" strokeWidth="1.5" className="dark:fill-[#4cd7f6] dark:stroke-[#15111d]" />
              </svg>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white leading-tight">
                {stats.totalPosts}
              </span>
              <span className="text-[11px] font-display text-slate-500 dark:text-on-surface-variant/80 hidden sm:inline">
                bài
              </span>
            </div>
          </div>

          {/* Card 2: Đã xuất bản */}
          <div className="group flex flex-col justify-between rounded-xl bg-gradient-to-b from-emerald-500/[0.04] to-transparent dark:from-emerald-500/[0.08] dark:to-transparent border border-emerald-100 dark:border-emerald-500/20 p-3 sm:p-3.5 hover:border-emerald-400/50 dark:hover:border-emerald-400/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-display font-medium text-slate-500 dark:text-on-surface-variant line-clamp-1">
                Đã xuất bản
              </span>
              <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400 opacity-75">
                verified
              </span>
            </div>

            <div className="w-full h-8 my-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={sparklines.area2} fill="url(#sparkGradGreen)" />
                <path d={sparklines.line2} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" className="dark:stroke-emerald-400" />
                <circle cx="95" cy={sparklines.pubY} fill="#10b981" r="3" stroke="#ffffff" strokeWidth="1.5" className="dark:fill-emerald-400 dark:stroke-[#15111d]" />
              </svg>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display font-bold text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 leading-tight">
                {stats.publishedCount}
              </span>
              <span className="text-[10px] font-display font-semibold text-emerald-600/80 dark:text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {publishPercentage}%
              </span>
            </div>
          </div>

          {/* Card 3: Tổng lượt đọc */}
          <div className="group flex flex-col justify-between rounded-xl bg-gradient-to-b from-pink-500/[0.04] to-transparent dark:from-pink-500/[0.08] dark:to-transparent border border-pink-100 dark:border-pink-500/20 p-3 sm:p-3.5 hover:border-pink-400/50 dark:hover:border-[#ec4899]/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-display font-medium text-slate-500 dark:text-on-surface-variant line-clamp-1">
                Lượt đọc
              </span>
              <span className="material-symbols-outlined text-[15px] text-pink-600 dark:text-[#ec4899] opacity-75">
                trending_up
              </span>
            </div>

            <div className="w-full h-8 my-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGradPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={sparklines.area1} fill="url(#sparkGradPink)" />
                <path d={sparklines.line1} fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                <circle cx={sparklines.lastPt1.x} cy={sparklines.lastPt1.y} fill="#ec4899" r="3" stroke="#ffffff" strokeWidth="1.5" className="dark:stroke-[#15111d]" />
              </svg>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white leading-tight">
                {stats.totalViews > 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews.toLocaleString()}
              </span>
              <span className="text-[11px] font-display text-slate-500 dark:text-on-surface-variant/80 hidden sm:inline">
                views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status & Metrics Panel */}
      <div className="rounded-xl bg-slate-50/80 dark:bg-[#221e2a]/80 border border-slate-200/80 dark:border-[#373340]/60 p-3.5 sm:p-4 flex flex-col gap-3 transition-colors">
        {/* Database Status */}
        <div className="flex items-center justify-between text-xs font-display">
          <div className="text-slate-600 dark:text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-on-surface-variant/70">
              database
            </span>
            <span className="font-medium">Trạng thái Database</span>
          </div>

          {isDatabaseConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              MongoDB Live (dudi_blog)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Bộ nhớ Cache Cục bộ
            </span>
          )}
        </div>

        {/* Categories */}
        <div className="flex items-center justify-between text-xs font-display">
          <div className="text-slate-600 dark:text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-on-surface-variant/70">
              category
            </span>
            <span className="font-medium">Chuyên mục đang quản lý</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
            <span>{distinctCategories}</span>
            <span className="font-normal text-[11px] opacity-80">danh mục</span>
          </span>
        </div>

        {/* Drafts */}
        <div className="flex items-center justify-between text-xs font-display">
          <div className="text-slate-600 dark:text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-on-surface-variant/70">
              edit_note
            </span>
            <span className="font-medium">Bài viết nháp</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span>{stats.draftCount}</span>
            <span className="font-normal text-[11px] opacity-80">bài nháp</span>
          </span>
        </div>

        {/* Publication Progress Mini-Bar */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-[#373340]/40">
          <div className="flex items-center justify-between text-[11px] font-display text-slate-500 dark:text-on-surface-variant mb-1.5">
            <span>Tiến độ xuất bản</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{publishPercentage}% hoàn tất</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-[#373340]/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(publishPercentage, 5)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

