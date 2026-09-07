import React, { useState, useEffect } from 'react';
import BlogDetailPage from './BlogDetailPage';
import AdminDashboard from './components/admin/AdminDashboard';
import { BlogProvider } from './context/BlogContext';

export default function App() {
  // Check URL hash or default to 'blog'
  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '');
    if (['blog', 'admin'].includes(hash)) {
      return hash;
    }
    return 'blog';
  };

  const [currentView, setCurrentView] = useState(getInitialView);

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['blog', 'admin'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <BlogProvider onNavigate={handleNavigate}>
      <div className="relative min-h-screen">
        {/* View Content */}
        {currentView === 'blog' && <BlogDetailPage onNavigate={handleNavigate} />}
        {currentView === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}

        {/* Floating Quick Page Switcher Bar */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-[#1e1a26]/90 border border-purple-800/40 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => handleNavigate('blog')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'blog'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
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
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Xem trang Quản trị Admin"
          >
            <span className="material-symbols-outlined text-[15px]">dashboard</span>
            <span>Admin</span>
          </button>
        </div>
      </div>
    </BlogProvider>
  );
}
