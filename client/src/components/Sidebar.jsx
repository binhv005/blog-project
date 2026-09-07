import React, { useState } from 'react';
import { useBlog } from '../context/BlogContext';
import { optimizeImageUrl } from '../utils/mediaOptimizer';
import ConsultationModal from './ConsultationModal';

const categoryColorMap = {
  'Công nghệ': 'bg-[#38bdf8]',
  'AI & Big Data': 'bg-[#a855f7]',
  'Bảo mật': 'bg-[#f59e0b]',
  'Thiết kế': 'bg-[#ec4899]',
  'Chính sách & Số hóa': 'bg-[#10b981]',
};

export default function Sidebar() {
  const { posts, publishedPosts, activePostId, selectPost } = useBlog();
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  // Filter only published posts (exclude draft/hidden posts)
  const visiblePosts = publishedPosts || posts.filter((p) => (p.status || 'published') === 'published');

  // Get related posts (exclude currently active post and hidden posts)
  const relatedPosts = visiblePosts.filter((p) => p.id !== activePostId).slice(0, 4);

  // Group counts by category for visible posts
  const categoryCounts = visiblePosts.reduce((acc, p) => {
    const cat = p.category || 'Khác';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoriesList = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    count: categoryCounts[cat],
    barColor: categoryColorMap[cat] || 'bg-[#38bdf8]'
  }));

  return (
    <aside className="lg:col-span-4 space-y-8 sticky top-24 self-start">
      
      {/* CARD 1: BÀI VIẾT LIÊN QUAN */}
      <div className="bg-white dark:bg-[#141024]/90 border border-slate-200 dark:border-purple-900/30 rounded-3xl p-6 shadow-sm dark:shadow-xl backdrop-blur-sm transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            BÀI VIẾT LIÊN QUAN
          </h2>
          <span className="text-xs font-mono text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/20">
            {relatedPosts.length} bài
          </span>
        </div>

        <div className="space-y-4">
          {relatedPosts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4 italic">
              Hiện chưa có bài viết liên quan khác.
            </p>
          ) : (
            relatedPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => {
                  selectPost(post.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/5" 
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex-shrink-0 shadow-sm">
                  <img 
                    src={optimizeImageUrl(post.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475', { width: 140, quality: 75 })} 
                    alt={post.title} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400 font-medium">
                    {post.date}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CARD 2: CHUYÊN MỤC BÀI VIẾT */}
      <div className="bg-white dark:bg-[#141024]/90 border border-slate-200 dark:border-purple-900/30 rounded-3xl p-6 shadow-sm dark:shadow-xl backdrop-blur-sm transition-colors">
        <h2 className="text-base font-bold tracking-wider text-slate-900 dark:text-white uppercase mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
          CHUYÊN MỤC BÀI VIẾT
        </h2>

        <div className="space-y-3">
          {categoriesList.map((cat, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${cat.barColor} group-hover:scale-125 transition-transform`} />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {cat.name}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-[#4cd7f6] transition-colors bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 3: CTA TƯ VẤN DỰ ÁN */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-[#1b1435] to-[#2a133d] dark:from-[#1b1435] dark:via-[#2a133d] dark:to-[#3b1235] border border-rose-500/20 text-center relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <span className="material-symbols-outlined text-4xl text-rose-400 mb-3 block">
          rocket_launch
        </span>
        <h3 className="font-bold text-lg text-white mb-2">
          Đồng hành chuyển đổi số cùng DUDI Software
        </h3>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Tư vấn kiến trúc dữ liệu và phát triển nền tảng công nghệ chuyên sâu chuẩn quốc tế.
        </p>
        <button 
          type="button"
          onClick={() => setIsConsultationOpen(true)}
          className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all"
        >
          Nhận tư vấn ngay
        </button>
      </div>

      {/* Consultation Popup Modal */}
      <ConsultationModal 
        isOpen={isConsultationOpen} 
        onClose={() => setIsConsultationOpen(false)} 
      />

    </aside>
  );
}
