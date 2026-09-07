import React from 'react';
import { useBlog } from '../../context/BlogContext';

export default function PopularPostsCard({ onOpenAllPosts }) {
  const { popularPosts, selectPost } = useBlog();

  return (
    <section className="rounded-2xl bg-[#1e1a26]/90 border border-[#2c2835]/80 p-6 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <h2 className="font-display font-bold text-lg text-on-surface">Bài viết phổ biến</h2>
        </div>
        <button 
          type="button"
          onClick={onOpenAllPosts}
          className="text-xs font-display font-semibold text-on-surface-variant hover:text-[#4cd7f6] uppercase tracking-wider transition-colors"
        >
          Xem tất cả
        </button>
      </div>

      {/* Posts List */}
      <div className="flex flex-col space-y-3.5">
        {popularPosts.map((post) => (
          <div 
            key={post.id}
            onClick={() => selectPost(post.id)}
            className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-[#221e2a] transition-colors group cursor-pointer"
            title="Nhấp để xem bài viết trên Blog"
          >
            {/* Thumbnail */}
            <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#2c2835] flex items-center justify-center relative border border-white/5">
              <img 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                src={post.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'} 
              />
            </div>

            {/* Post Meta */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-sm text-[#4cd7f6] group-hover:underline line-clamp-2 break-words leading-snug">
                {post.title}
              </h3>
              <div className="font-mono text-xs text-on-surface-variant mt-1 flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                <span className="whitespace-nowrap">{post.views?.toLocaleString?.() || post.views} lượt xem</span>
                <span className="text-on-surface-variant/40 hidden sm:inline">•</span>
                <span className="text-on-surface-variant/70 whitespace-nowrap">{post.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
