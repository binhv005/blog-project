import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';
import { optimizeImageUrl } from '../../utils/mediaOptimizer';
import OptimizedImage from '../common/OptimizedImage';
import ConfirmModal from '../ConfirmModal';

export default function PostsManager({ onEditPost, onOpenNewPost, onNavigate }) {
  const { posts, deletePost, togglePostStatus, selectPost, resetToDefaults } = useBlog();
  const { toast } = useToast();
  const listTopRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('all');
  const [postToDelete, setPostToDelete] = useState(null);

  // Pagination states (Fixed 6 posts per page)
  const POSTS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic categories list directly from posts in database
  const categories = useMemo(() => {
    const postCats = posts
      .map((p) => p.category)
      .filter((c) => c && typeof c === 'string' && c.trim().length > 0);
    const distinct = Array.from(new Set(postCats)).sort();
    return ['Tất cả', ...distinct];
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === 'Tất cả' || post.category === filterCategory;
      const matchesStatus =
        filterStatus === 'all' || post.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [posts, searchTerm, filterCategory, filterStatus]);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  // Pagination calculations
  const totalPosts = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * POSTS_PER_PAGE;
  const endIndex = Math.min(startIndex + POSTS_PER_PAGE, totalPosts);
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    const target = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(target);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
      const title = postToDelete.title || 'Bài viết';
      await deletePost(postToDelete.id);
      toast.success(`Đã xóa bài viết "${title}" thành công!`);
      setPostToDelete(null);
    }
  };

  return (
    <div ref={listTopRef} className="flex flex-col gap-6 w-full pb-28">
      {/* Top Filter & Actions Bar */}
      <div className="bg-white dark:bg-[#1e1a26]/90 border border-slate-200 dark:border-[#2c2835]/80 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 transition-colors">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài viết theo tiêu đề, tác giả..."
            className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-on-surface placeholder-slate-400 dark:placeholder-on-surface-variant/50 focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Categories, Status Filter and Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-2.5 sm:px-3 py-2 text-xs text-slate-800 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all flex-1 sm:flex-initial cursor-pointer font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-white dark:bg-[#1e1a26] text-slate-800 dark:text-on-surface">
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] p-1 text-xs overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap flex-1 sm:flex-initial ${
                filterStatus === 'all'
                  ? 'bg-sky-500/15 dark:bg-[#4cd7f6]/20 text-sky-600 dark:text-[#4cd7f6] font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({posts.length})
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap flex-1 sm:flex-initial ${
                filterStatus === 'published'
                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Đã xuất bản ({posts.filter((p) => p.status === 'published').length})
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap flex-1 sm:flex-initial ${
                filterStatus === 'draft'
                  ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bản nháp ({posts.filter((p) => p.status === 'draft').length})
            </button>
          </div>
        </div>
      </div>

      {/* Posts Table / Card List */}
      <div className="bg-white dark:bg-[#1e1a26]/90 border border-slate-200 dark:border-[#2c2835]/80 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#2c2835]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-on-surface">
              Danh sách bài viết ({filteredPosts.length})
            </h2>
            {totalPages > 1 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-[#4cd7f6]">
                Trang {safeCurrentPage}/{totalPages}
              </span>
            )}
          </div>
          <button
            onClick={onOpenNewPost}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff5167] to-[#e02447] text-white font-display font-bold text-xs tracking-wider uppercase shadow-[0_0_12px_rgba(255,81,103,0.3)] hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Thêm bài mới</span>
          </button>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-on-surface-variant mb-2">
              post_add
            </span>
            <p className="text-slate-500 dark:text-on-surface-variant text-sm font-medium">Không tìm thấy bài viết nào phù hợp.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-[#2c2835]/50">
            {paginatedPosts.map((post) => (
              <div
                key={post.id}
                className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 dark:hover:bg-[#221e2a]/60 transition-colors group"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full">
                  <div className="w-16 h-16 sm:w-20 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#2c2835] flex-shrink-0 border border-slate-200 dark:border-[#373340]/40 mt-0.5 sm:mt-0 shadow-sm">
                    <OptimizedImage
                      src={post.coverImage}
                      alt={post.title}
                      width={80}
                      height={56}
                      sizes="(max-width: 640px) 64px, 80px"
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    {/* Tags, Status & Date Header */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 whitespace-nowrap">
                        {post.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap ${
                          post.status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-on-surface-variant font-medium whitespace-nowrap">
                        {post.date}
                      </span>
                    </div>

                    {/* Post Title */}
                    <h3 
                      onClick={() => selectPost(post.id, true, post.status !== 'published')}
                      className="font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-on-surface group-hover:text-sky-600 dark:group-hover:text-[#4cd7f6] transition-colors line-clamp-2 break-words cursor-pointer hover:underline leading-snug"
                      title={post.title}
                    >
                      {post.title}
                    </h3>
                    
                    {/* Post Metadata with clean whitespace wrapping */}
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-on-surface-variant/80 mt-1 flex items-center gap-x-2.5 gap-y-1 flex-wrap">
                      <span className="flex items-center gap-1 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">visibility</span>
                        <span>{post.views?.toLocaleString?.() || post.views} lượt xem</span>
                      </span>
                      <span className="text-slate-300 dark:text-on-surface-variant/40 hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">Tác giả: {post.author?.name || 'Alex Vũ'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t border-slate-200 dark:border-[#2c2835]/40 sm:border-t-0 w-full sm:w-auto justify-end">
                  {/* View post on blog */}
                  <button
                    onClick={() => selectPost(post.id, true, post.status !== 'published')}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-on-surface-variant hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#15111d] transition-colors border border-transparent hover:border-sky-300 dark:hover:border-[#4cd7f6]/30"
                    title={post.status === 'published' ? 'Xem bài viết trên Blog' : 'Xem trước bản nháp trên Blog'}
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>

                  {/* Toggle publish/draft status */}
                  <button
                    onClick={() => {
                      togglePostStatus(post.id);
                      toast.success(
                        post.status === 'published'
                          ? `Đã chuyển bài viết "${post.title}" về bản nháp`
                          : `Đã xuất bản bài viết "${post.title}"`
                      );
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl transition-colors border ${
                      post.status === 'published'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-transparent hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                        : 'text-amber-600 dark:text-amber-300 bg-amber-50/50 dark:bg-transparent hover:bg-amber-100 dark:hover:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                    }`}
                    title={post.status === 'published' ? 'Chuyển thành bản nháp' : 'Xuất bản bài viết'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {post.status === 'published' ? 'check_circle' : 'unpublished'}
                    </span>
                  </button>

                  {/* Edit post */}
                  <button
                    onClick={() => onEditPost(post)}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#15111d] transition-colors border border-transparent hover:border-slate-300 dark:hover:border-white/20"
                    title="Chỉnh sửa bài viết"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>

                  {/* Delete post */}
                  <button
                    onClick={() => setPostToDelete(post)}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-on-surface-variant hover:text-[#ff5167] hover:bg-rose-50 dark:hover:bg-[#ff5167]/10 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-[#ff5167]/30"
                    title="Xóa bài viết"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPosts > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#2c2835]/80 bg-slate-50/50 dark:bg-[#1a1622]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Summary Info */}
            <div className="text-xs font-display text-slate-500 dark:text-on-surface-variant flex items-center gap-2">
              <span>
                Hiển thị <strong className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</strong> - <strong className="text-slate-900 dark:text-white font-bold">{endIndex}</strong> / <strong className="text-slate-900 dark:text-white font-bold">{totalPosts}</strong> bài viết
              </span>
            </div>

            {/* Right: Page Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 sm:gap-1.5 select-none">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2c2835] bg-white dark:bg-[#15111d] text-slate-700 dark:text-on-surface text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#221e2a] hover:border-sky-400 dark:hover:border-[#4cd7f6]/40 transition-all flex items-center gap-1"
                  title="Trang trước"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span className="hidden sm:inline">Trước</span>
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-xs text-slate-400 dark:text-slate-500 font-bold">
                        ...
                      </span>
                    );
                  }
                  const isActive = page === safeCurrentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[32px] h-8 rounded-xl text-xs font-semibold font-display transition-all flex items-center justify-center ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-500 to-sky-600 dark:from-[#03b5d3] dark:to-[#4cd7f6] text-white shadow-md shadow-sky-500/20 dark:shadow-[#03b5d3]/20 font-bold'
                          : 'bg-white dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] text-slate-700 dark:text-on-surface hover:bg-slate-100 dark:hover:bg-[#221e2a] hover:border-sky-400 dark:hover:border-[#4cd7f6]/40'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2c2835] bg-white dark:bg-[#15111d] text-slate-700 dark:text-on-surface text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#221e2a] hover:border-sky-400 dark:hover:border-[#4cd7f6]/40 transition-all flex items-center gap-1"
                  title="Trang sau"
                >
                  <span className="hidden sm:inline">Sau</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Popup */}
      <ConfirmModal
        isOpen={Boolean(postToDelete)}
        title="Xóa bài viết vĩnh viễn"
        message={`Bạn có chắc chắn muốn xóa bài viết "${postToDelete?.title}"? Dữ liệu bài viết này sẽ không thể khôi phục lại sau khi xóa.`}
        confirmText="Xóa bài viết"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPostToDelete(null)}
      />
    </div>
  );
}

