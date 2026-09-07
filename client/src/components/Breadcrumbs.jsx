import React from 'react';
import { useBlog } from '../context/BlogContext';

export default function Breadcrumbs({ onNavigate }) {
  const { activePost, postStatusError } = useBlog();

  const categoryLabel = postStatusError
    ? (postStatusError.type === 'draft' ? 'Bản nháp' : 'Thông báo')
    : (activePost?.category || 'Tin tức');

  const titleLabel = postStatusError
    ? (postStatusError.type === 'draft' ? 'Bài viết chưa xuất bản' : 'Không tìm thấy bài viết')
    : (activePost?.title || 'Chi tiết bài viết');

  return (
    <section className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Back to Blog Button */}
        <button 
          onClick={() => onNavigate && onNavigate('blog')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.09] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium border border-slate-200 dark:border-white/10 transition-all group shadow-sm" 
          type="button"
        >
          <svg className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Quay lại Blog</span>
        </button>

        {/* Breadcrumbs Trail */}
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-2">
          <button onClick={() => onNavigate && onNavigate('blog')} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Trang chủ</button>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <button onClick={() => onNavigate && onNavigate('blog')} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Blog</button>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-slate-500 dark:text-slate-400">{categoryLabel}</span>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-rose-600 dark:text-rose-400 truncate max-w-[220px] sm:max-w-xs md:max-w-md font-medium">
            {titleLabel}
          </span>
        </nav>
      </div>
    </section>
  );
}
