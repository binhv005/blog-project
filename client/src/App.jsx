import React, { useState, useEffect } from 'react';
import BlogDetailPage from './BlogDetailPage';
import AdminDashboard from './components/admin/AdminDashboard';
import { BlogProvider } from './context/BlogContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function parseCurrentRoute() {
  const pathname = window.location.pathname;
  const hash = window.location.hash.replace(/^#\/?/, '');

  if (pathname.startsWith('/admin') || hash.startsWith('admin')) {
    return { view: 'admin' };
  }
  return { view: 'blog' };
}

function AppContent() {
  const [currentView, setCurrentView] = useState(() => parseCurrentRoute().view);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleNavigate = (view, slugOrSub = null) => {
    setCurrentView(view);
    if (view === 'admin') {
      let targetPath = '/admin/posts';
      if (slugOrSub) {
        targetPath = slugOrSub.startsWith('/admin') ? slugOrSub : `/admin/${slugOrSub.replace(/^\//, '')}`;
      } else if (window.location.pathname.startsWith('/admin')) {
        targetPath = window.location.pathname;
      }
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view: 'admin' }, '', targetPath);
      }
    } else {
      if (slugOrSub) {
        const cleanSlug = slugOrSub.startsWith('/blog/') ? slugOrSub.replace('/blog/', '') : slugOrSub;
        const targetPath = `/blog/${cleanSlug}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ view: 'blog', slug: cleanSlug }, '', targetPath);
        }
      } else {
        if (!window.location.pathname.startsWith('/blog') && window.location.pathname !== '/') {
          window.history.pushState({ view: 'blog' }, '', '/blog');
        }
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setCurrentView(route.view);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  return (
    <BlogProvider onNavigate={handleNavigate}>
      <div className="relative min-h-screen transition-colors duration-300">
        {/* View Content */}
        {currentView === 'blog' && <BlogDetailPage onNavigate={handleNavigate} />}
        {currentView === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}

        {/* Floating Quick Page Switcher Bar */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-[#1e1a26]/90 border border-slate-200 dark:border-purple-800/40 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => handleNavigate('blog')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'blog'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
            title="Xem trang Blog chi tiết"
          >
            <span className="material-symbols-outlined text-[15px]">article</span>
            <span>Blog</span>
          </button>

          <button
            onClick={() => handleNavigate('admin')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'bg-gradient-to-r from-[#03b5d3] to-[#4cd7f6] text-[#003640] font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
            title="Xem trang Quản trị Admin"
          >
            <span className="material-symbols-outlined text-[15px]">dashboard</span>
            <span>Admin</span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-purple-800/50 mx-0.5"></div>

          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-all"
            title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>
    </BlogProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
