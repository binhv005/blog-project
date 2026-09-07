import React from 'react';
import { useBlog } from '../../context/BlogContext';

export default function AdminHeader({ 
  title = 'Quản lý bài viết', 
  onNewPostClick, 
  onSearchClick,
  onToggleSidebar
}) {
  const { isDatabaseConnected, refetchPosts } = useBlog();

  return (
    <header className="h-16 px-3 sm:px-6 border-b border-[#2c2835]/60 flex items-center justify-between bg-surface/80 backdrop-blur-xl sticky top-0 z-30 gap-2">
      {/* Left: Mobile Menu Toggle + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-lg">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors flex-shrink-0"
          aria-label="Mở menu quản trị"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Search Bar matching HTML */}
        <div 
          onClick={onSearchClick}
          className="flex items-center gap-2 w-full max-w-xs sm:max-w-sm px-3 sm:px-3.5 py-1.5 rounded-xl bg-surface-container-low text-on-surface-variant border border-surface-container-high hover:border-secondary/40 cursor-pointer transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] flex-shrink-0">search</span>
          <span className="text-xs flex-1 text-on-surface-variant select-none truncate">
            Tìm kiếm bài viết...
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-container-highest font-mono text-[10px] text-on-surface border border-surface-container flex-shrink-0">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Database Status Chip */}
        <button
          onClick={refetchPosts}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all border ${
            isDatabaseConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
          }`}
          title={isDatabaseConnected ? 'Đã kết nối MongoDB thành công! Nhấp để đồng bộ lại' : 'Đang ở chế độ Offline/Local Cache. Nhấp để kết nối lại MongoDB'}
          type="button"
        >
          <span className={`w-2 h-2 rounded-full ${isDatabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
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
          aria-label="Chuyển đổi giao diện" 
          onClick={() => alert('Giao diện đang ở chế độ Dark Mode tối ưu cho Quản trị viên')}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" 
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">dark_mode</span>
        </button>

        {/* Notification Bell with Alert Dot */}
        <button 
          aria-label="Thông báo" 
          onClick={() => alert('Bạn có 4 thông báo mới chưa đọc')}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" 
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface"></span>
        </button>

        {/* User Profile Avatar */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 cursor-pointer group" 
          title="Hồ sơ quản trị viên Alex Vũ"
          onClick={() => alert('Alex Vũ - Super Admin')}
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
