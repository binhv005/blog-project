import React from 'react';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import ArticleHeader from './components/ArticleHeader';
import ArticleBody from './components/ArticleBody';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import { useTheme } from './context/ThemeContext';
import { useBlog } from './context/BlogContext';
import { useToast } from './context/ToastContext';

export default function BlogDetailPage({ onNavigate }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { 
    postStatusError, 
    publishedPosts, 
    selectPost, 
    activePost,
    isPreviewMode, 
    clearPreviewPost,
    togglePostStatus
  } = useBlog();
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-rose-500 selection:text-white bg-[#f8fafc] dark:bg-[#100c18] text-slate-900 dark:text-[#e8dff1] transition-colors duration-300">
      {/* Live Preview Mode Banner */}
      {isPreviewMode && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 text-white px-4 py-2 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm backdrop-blur-md border-b border-white/20">
          <div className="flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-[20px] animate-pulse text-amber-200">visibility</span>
            <span>CHẾ ĐỘ XEM TRƯỚC (PREVIEW MODE)</span>
            <span className="hidden sm:inline font-normal text-white/80">• Nội dung tạm thời chỉ hiển thị cho quản trị viên</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                clearPreviewPost();
                if (onNavigate) {
                  if (activePost?.slug || activePost?.id) {
                    onNavigate('admin', `edit/${activePost.slug || activePost.id}`);
                  } else {
                    onNavigate('admin');
                  }
                }
              }}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-all flex items-center gap-1 border border-white/30 text-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">edit_note</span>
              <span>Tiếp tục chỉnh sửa</span>
            </button>

            <button
              onClick={async () => {
                if (activePost?.id) {
                  await togglePostStatus(activePost.id);
                  clearPreviewPost();
                  toast.success(`Đã xuất bản bài viết "${activePost.title}" thành công!`);
                }
              }}
              className="px-3 py-1 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all flex items-center gap-1 shadow-md text-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-600">rocket_launch</span>
              <span>Xuất bản ngay</span>
            </button>

            <button
              onClick={() => {
                clearPreviewPost();
                if (onNavigate) onNavigate('admin', 'posts');
              }}
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              title="Thoát chế độ xem trước"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <Header isDarkMode={isDarkMode} onToggleTheme={toggleTheme} onNavigate={onNavigate} />

      {/* SubNavigation & Breadcrumbs */}
      <Breadcrumbs onNavigate={onNavigate} />

      {/* Main Content Grid */}
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Left Column: Article Content or Draft Notice (8 cols) */}
          <article className="lg:col-span-8 flex flex-col">
            {postStatusError?.type === 'draft' ? (
              <div className="bg-white dark:bg-[#141024]/90 border border-amber-300/70 dark:border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-xl text-center flex flex-col items-center my-4 animate-fade-in backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20 shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">unpublished</span>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Bản nháp • Chưa xuất bản
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                  Bài viết này hiện chưa được công khai
                </h2>

                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-lg mb-6 leading-relaxed">
                  Bài viết <span className="font-semibold text-slate-900 dark:text-white">"{postStatusError.post?.title || postStatusError.slug}"</span> đang ở trạng thái <strong>Bản nháp (Draft)</strong> và không thể xem qua đường dẫn công khai.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      if (publishedPosts && publishedPosts.length > 0) {
                        selectPost(publishedPosts[0].id);
                      } else if (onNavigate) {
                        onNavigate('blog');
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    <span>Đọc bài viết đã xuất bản</span>
                  </button>

                  <button
                    onClick={() => onNavigate && onNavigate('admin', `edit/${postStatusError.post?.slug || postStatusError.post?.id || postStatusError.slug}`)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-300 dark:border-white/10 transition-all flex items-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    <span>Mở trong Quản trị (Admin)</span>
                  </button>
                </div>
              </div>
            ) : postStatusError?.type === 'not_found' ? (
              <div className="bg-white dark:bg-[#141024]/90 border border-slate-200 dark:border-purple-900/30 rounded-3xl p-6 sm:p-10 shadow-xl text-center flex flex-col items-center my-4 animate-fade-in backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 border border-rose-500/20 shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">search_off</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 mb-3">
                  Lỗi 404 • Không tìm thấy bài viết
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                  Không tìm thấy bài viết
                </h2>

                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-lg mb-6 leading-relaxed">
                  Đường dẫn bài viết <code className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 font-mono text-xs">/blog/{postStatusError.slug}</code> không tồn tại hoặc đã được chuyển/xóa.
                </p>

                <button
                  onClick={() => {
                    if (publishedPosts && publishedPosts.length > 0) {
                      selectPost(publishedPosts[0].id);
                    } else if (onNavigate) {
                      onNavigate('blog');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Về danh sách bài viết</span>
                </button>
              </div>
            ) : (
              <>
                <ArticleHeader />
                <ArticleBody />
              </>
            )}
          </article>

          {/* Right Column: Sidebar (4 cols - Sticky) */}
          <Sidebar />

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

