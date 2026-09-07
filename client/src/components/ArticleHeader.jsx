import React from 'react';
import { useBlog } from '../context/BlogContext';
import { optimizeImageUrl } from '../utils/mediaOptimizer';

export default function ArticleHeader() {
  const { activePost } = useBlog();

  if (!activePost) return null;

  const optimizedCover = optimizeImageUrl(activePost.coverImage, { width: 1200, quality: 85 });

  return (
    <div className="mb-6">
      {/* Featured Hero Cover Image at Top */}
      {activePost.coverImage && (
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-[#151025] shadow-xl dark:shadow-2xl group mb-6">
          <img
            alt={activePost.title}
            className="w-full max-h-[480px] object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            src={optimizedCover}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 rounded-2xl pointer-events-none" />
        </div>
      )}

      {/* Category Tags */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm">
          {activePost.tag || activePost.category || 'TIN TỨC'}
        </span>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 shadow-sm">
          {activePost.subCategory || activePost.category || 'Công nghệ & Đổi mới'}
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2] mb-6">
        {activePost.title}
      </h1>
    </div>
  );
}
