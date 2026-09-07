import React from 'react';
import { useBlog } from '../context/BlogContext';

export default function Breadcrumbs({ onNavigate }) {
  const { activePost } = useBlog();

  return (
    <section className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Back to Blog Button */}
        <button 
          onClick={() => onNavigate && onNavigate('blog')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.09] text-slate-300 hover:text-white text-sm font-medium border border-white/10 transition-all group" 
          type="button"
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Quay lại Blog</span>
        </button>

        {/* Breadcrumbs Trail */}
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-slate-400 flex items-center space-x-2">
          <button onClick={() => onNavigate && onNavigate('blog')} className="hover:text-slate-200 transition-colors">Trang chủ</button>
          <span className="text-slate-600">/</span>
          <button onClick={() => onNavigate && onNavigate('blog')} className="hover:text-slate-200 transition-colors">Blog</button>
          <span className="text-slate-600">/</span>
          <span className="hover:text-slate-200 transition-colors text-slate-400">{activePost?.category || 'Tin tức'}</span>
          <span className="text-slate-600">/</span>
          <span className="text-rose-400 truncate max-w-[220px] sm:max-w-xs md:max-w-md font-medium">
            {activePost?.title || 'Chi tiết bài viết'}
          </span>
        </nav>
      </div>
    </section>
  );
}
