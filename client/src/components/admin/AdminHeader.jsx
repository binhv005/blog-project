import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export default function AdminHeader({ 
  title = 'Quản lý bài viết', 
  onNewPostClick, 
  onSearchClick,
  onToggleSidebar
}) {
  const { isDatabaseConnected, refetchPosts } = useBlog();
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="h-16 px-3 sm:px-6 border-b border-[#2c2835]/60 dark:border-[#2c2835]/60 border-slate-200 flex items-center justify-between bg-white/80 dark:bg-surface/80 backdrop-blur-xl sticky top-0 z-30 gap-2 transition-colors">
      {/* Left: Mobile Menu Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-container-high transition-colors flex-shrink-0"
          aria-label="Mở menu quản trị"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Database Status Chip */}
        <button
          onClick={refetchPosts}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all border ${
            isDatabaseConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
          }`}
          title={isDatabaseConnected ? 'Đã kết nối MongoDB thành công! Nhấp để đồng bộ lại' : 'Đang ở chế độ Offline/Local Cache. Nhấp để kết nối lại MongoDB'}
          type="button"
        >
          <span className={`w-2 h-2 rounded-full ${isDatabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isDatabaseConnected ? 'MongoDB Live' : 'Local Mode'}</span>
        </button>
        {/* + Soạn bài mới CTA */}
        <button
          onClick={onNewPostClick}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff2d55] to-primary-container text-white text-xs font-bold shadow-[0_0_15px_rgba(255,45,85,0.4)] hover:brightness-110 active:scale-95 transition-all"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">edit_document</span>
          <span className="hidden sm:inline">Soạn bài mới</span>
        </button>

        {/* Theme Toggle Button */}
        <button 
          aria-label="Chuyển đổi giao diện Sáng / Tối" 
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-on-surface-variant hover:bg-slate-100 dark:hover:bg-surface-container-high hover:text-slate-900 dark:hover:text-on-surface transition-colors" 
          type="button"
          title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>


        {/* User Profile Avatar */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 cursor-pointer group" 
          title="Hồ sơ quản trị viên Alex Vũ"
          onClick={() => toast.info('Hồ sơ: Alex Vũ - Super Admin (DUDI Software)')}
        >
          <div className="flex flex-col text-right hidden md:flex">
            <span className="text-xs font-semibold text-on-surface leading-tight">Alex Vũ</span>
            <span className="text-[10px] font-mono text-primary font-medium">Super Admin</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[16px] group-hover:translate-y-0.5 transition-transform hidden sm:inline">
            keyboard_arrow_down
          </span>
        </div>
      </div>
    </header>
  );
}
