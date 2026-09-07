import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../ConfirmModal';

export default function PostsManager({ onEditPost, onOpenNewPost, onNavigate }) {
  const { posts, deletePost, togglePostStatus, selectPost, resetToDefaults } = useBlog();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('all');
  const [postToDelete, setPostToDelete] = useState(null);

  // Filter posts
  const filteredPosts = posts.filter((post) => {
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

  const categories = ['Tất cả', 'Công nghệ', 'AI & Big Data', 'Bảo mật', 'Thiết kế', 'Chính sách & Số hóa'];

  const [isSyncingCloudinary, setIsSyncingCloudinary] = useState(false);

  const handleSyncCloudinary = async () => {
    setIsSyncingCloudinary(true);
    try {
      const res = await fetch('/api/upload/sync-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Đã đồng bộ toàn bộ ảnh lên Cloudinary thành công!');
        window.location.reload();
      } else {
        toast.error('Lỗi đồng bộ: ' + data.message);
      }
    } catch (err) {
      toast.error('Không thể kết nối API Cloudinary: ' + err.message);
    } finally {
      setIsSyncingCloudinary(false);
    }
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
    <div className="flex flex-col gap-6 w-full">
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
            className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-on-surface placeholder-slate-400 dark:placeholder-on-surface-variant/50 focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all"
          />
        </div>

        {/* Categories, Status Filter and Cloudinary Sync */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-2.5 sm:px-3 py-2 text-xs text-slate-800 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all flex-1 sm:flex-initial cursor-pointer"
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
        <div className="p-5 border-b border-slate-200 dark:border-[#2c2835]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-on-surface">
              Danh sách bài viết ({filteredPosts.length})
            </h2>
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
            <p className="text-slate-500 dark:text-on-surface-variant text-sm">Không tìm thấy bài viết nào phù hợp.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-[#2c2835]/50">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 dark:hover:bg-[#221e2a]/60 transition-colors group"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full">
                  <div className="w-16 h-16 sm:w-20 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#2c2835] flex-shrink-0 border border-slate-200 dark:border-[#373340]/40 mt-0.5 sm:mt-0 shadow-sm">
                    <img
                      src={post.coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'}
                      alt={post.title}
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
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-on-surface-variant font-mono whitespace-nowrap">
                        {post.date}
                      </span>
                    </div>

                    {/* Post Title */}
                    <h3 
                      onClick={() => selectPost(post.id)}
                      className="font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-on-surface group-hover:text-sky-600 dark:group-hover:text-[#4cd7f6] transition-colors line-clamp-2 break-words cursor-pointer hover:underline leading-snug"
                      title={post.title}
                    >
                      {post.title}
                    </h3>
                    
                    {/* Post Metadata with clean whitespace wrapping */}
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-on-surface-variant/80 font-mono mt-1 flex items-center gap-x-2.5 gap-y-1 flex-wrap">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
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
                    onClick={() => selectPost(post.id)}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-on-surface-variant hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#15111d] transition-colors border border-transparent hover:border-sky-300 dark:hover:border-[#4cd7f6]/30"
                    title="Xem trước bài viết trên Blog"
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
