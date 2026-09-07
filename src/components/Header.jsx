import React, { useState } from 'react';

export default function Header({ isDarkMode, onToggleTheme, onNavigate, currentView = 'blog' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-purple-950/40 backdrop-blur-md bg-[#0c0915]/80 sticky top-0 z-50 transition-colors">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => {
            if (onNavigate) onNavigate('blog');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 group cursor-pointer"
        >
          <img 
            src="/logo-dudi.webp" 
            alt="DUDI Software Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain shadow-lg shadow-rose-600/20 group-hover:scale-105 transition-transform duration-300"
          />
          <span className="text-white font-bold text-lg sm:text-xl tracking-tight group-hover:text-rose-400 transition-colors">
            DUDI Software
          </span>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-300">
          <button onClick={() => onNavigate && onNavigate('blog')} className="hover:text-white transition-colors">Trang chủ</button>
          <button onClick={() => onNavigate && onNavigate('blog')} className="hover:text-white transition-colors">Về chúng tôi</button>
          <button onClick={() => onNavigate && onNavigate('blog')} className="hover:text-white transition-colors">Dịch vụ</button>
          <button 
            onClick={() => onNavigate && onNavigate('blog')}
            className={`transition-colors ${currentView === 'blog' ? 'text-white font-semibold relative after:content-[\'\'] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-rose-500' : 'hover:text-white'}`}
          >
            Blog
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('admin')}
            className="hover:text-[#4cd7f6] transition-colors flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#1e1a26] border border-[#4cd7f6]/30 text-[#4cd7f6]"
          >
            <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
            <span>Admin</span>
          </button>
        </nav>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Theme Toggle Button */}
          <button 
            aria-label="Đổi theme sáng tối" 
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors" 
            type="button"
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            )}
          </button>

          {/* Language Switcher */}
          <button className="hidden sm:block px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-colors tracking-wide" type="button">
            EN
          </button>

          {/* Primary CTA Contact Button */}
          <a className="hidden sm:inline-block px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full text-white bg-gradient-to-r from-rose-500 via-rose-600 to-blue-600 hover:opacity-95 shadow-md shadow-rose-600/25 transition-all transform hover:-translate-y-0.5" href="#">
            Liên hệ
          </a>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-colors"
            aria-label="Menu"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-purple-950/40 bg-[#120d20] px-4 py-4 flex flex-col gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <button 
            onClick={() => { onNavigate && onNavigate('blog'); setIsMobileMenuOpen(false); }} 
            className="px-3 py-2 text-left text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Trang chủ
          </button>
          <button 
            onClick={() => { onNavigate && onNavigate('blog'); setIsMobileMenuOpen(false); }} 
            className="px-3 py-2 text-left text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Về chúng tôi
          </button>
          <button 
            onClick={() => { onNavigate && onNavigate('blog'); setIsMobileMenuOpen(false); }} 
            className="px-3 py-2 text-left text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Dịch vụ
          </button>
          <button 
            onClick={() => { onNavigate && onNavigate('blog'); setIsMobileMenuOpen(false); }} 
            className="px-3 py-2 text-left text-sm font-medium text-rose-400 font-semibold bg-rose-500/10 rounded-lg transition-colors flex items-center justify-between"
          >
            <span>Blog chi tiết</span>
            <span className="material-symbols-outlined text-[16px]">article</span>
          </button>
          <button 
            onClick={() => { onNavigate && onNavigate('admin'); setIsMobileMenuOpen(false); }} 
            className="px-3 py-2 text-left text-sm font-semibold text-[#4cd7f6] bg-[#4cd7f6]/10 rounded-lg transition-colors flex items-center justify-between"
          >
            <span>Trang quản trị (Admin)</span>
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
          </button>
        </div>
      )}
    </header>
  );
}
