import React from 'react';
import { useBlog } from '../context/BlogContext';

export default function ArticleHeader() {
  const { activePost } = useBlog();

  if (!activePost) return null;

  return (
    <div className="mb-6">
      {/* Category Tags */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-950/80 text-blue-400 border border-blue-500/30">
          {activePost.tag || activePost.category || 'TIN TỨC'}
        </span>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/20">
          {activePost.subCategory || activePost.category || 'Công nghệ & Đổi mới'}
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.2] mb-6">
        {activePost.title}
      </h1>
    </div>
  );
}
