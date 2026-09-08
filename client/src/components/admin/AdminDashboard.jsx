import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ViewsChartCard from './ViewsChartCard';
import TimelineUpdatesCard from './TimelineUpdatesCard';
import PopularPostsCard from './PopularPostsCard';
import AtAGlanceCard from './AtAGlanceCard';
import PostsManager from './PostsManager';
import AdminEditor from './AdminEditor';
import { useBlog } from '../../context/BlogContext';

// Parse route details from browser URL
const parseAdminRoute = (postsList = []) => {
  const pathname = window.location.pathname;
  const hash = window.location.hash.replace(/^#\/?/, '');
  const path = pathname.startsWith('/admin') ? pathname : (hash.startsWith('admin') ? `/${hash}` : '');

  // 1. New / Create post route
  if (/^\/admin\/(new|create)/i.test(path)) {
    return { subView: 'editor', editingPost: null, slugOrId: null, activeTab: 'posts' };
  }

  // 2. Edit existing post route: /admin/edit/:slugOrId
  const editMatch = path.match(/^\/admin\/edit\/(.+)/i);
  if (editMatch) {
    const slugOrId = decodeURIComponent(editMatch[1]);
    const matched = postsList.find(
      (p) => p.slug === slugOrId || p.id === slugOrId || p._id === slugOrId
    );
    return { subView: 'editor', editingPost: matched || null, slugOrId, activeTab: 'posts' };
  }

  // 3. Overview / Dashboard metrics route
  if (/^\/admin\/(overview|dashboard)/i.test(path)) {
    return { subView: 'overview', editingPost: null, slugOrId: null, activeTab: 'dashboard' };
  }

  // 4. Default Posts List Manager route
  return { subView: 'list', editingPost: null, slugOrId: null, activeTab: 'posts' };
};

export default function AdminDashboard({ onNavigate }) {
  const { posts, updatePost } = useBlog();

  const [activeTab, setActiveTab] = useState(() => parseAdminRoute(posts).activeTab);
  const [subView, setSubView] = useState(() => parseAdminRoute(posts).subView); // 'list', 'editor', 'overview'
  const [editingPost, setEditingPost] = useState(() => parseAdminRoute(posts).editingPost);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync post when direct loading an edit route or when posts finish loading
  useEffect(() => {
    const route = parseAdminRoute(posts);
    if (route.subView === 'editor' && route.slugOrId && !editingPost && posts.length > 0) {
      const found = posts.find(
        (p) => p.slug === route.slugOrId || p.id === route.slugOrId || p._id === route.slugOrId
      );
      if (found) {
        setEditingPost(found);
      }
    }
  }, [posts, editingPost]);

  // Update document title dynamically
  useEffect(() => {
    if (subView === 'editor') {
      if (editingPost?.title) {
        document.title = `Chỉnh sửa: ${editingPost.title} | DUDI Admin`;
      } else {
        document.title = 'Soạn bài viết mới | DUDI Admin';
      }
    } else if (subView === 'overview') {
      document.title = 'Tổng quan hệ thống | DUDI Admin';
    } else {
      document.title = 'Quản lý bài viết | DUDI Admin';
    }
  }, [subView, editingPost]);

  // Programmatic sub-route navigation
  const navigateToSubRoute = useCallback((targetSubView, post = null, pushState = true) => {
    setSubView(targetSubView);

    if (targetSubView === 'editor') {
      setActiveTab('posts');
      setEditingPost(post);
      if (pushState) {
        if (post) {
          const targetSlug = post.slug || post.id;
          const targetPath = `/admin/edit/${targetSlug}`;
          if (window.location.pathname !== targetPath) {
            window.history.pushState({ view: 'admin', sub: 'edit', id: targetSlug }, '', targetPath);
          }
        } else {
          if (window.location.pathname !== '/admin/new') {
            window.history.pushState({ view: 'admin', sub: 'new' }, '', '/admin/new');
          }
        }
      }
    } else if (targetSubView === 'overview') {
      setActiveTab('dashboard');
      setEditingPost(null);
      if (pushState && window.location.pathname !== '/admin/overview') {
        window.history.pushState({ view: 'admin', sub: 'overview' }, '', '/admin/overview');
      }
    } else {
      // 'list'
      setActiveTab('posts');
      setEditingPost(null);
      if (pushState && window.location.pathname !== '/admin/posts' && window.location.pathname !== '/admin') {
        window.history.pushState({ view: 'admin', sub: 'posts' }, '', '/admin/posts');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back / Forward history navigation (popstate & hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseAdminRoute(posts);
      setSubView(route.subView);
      setActiveTab(route.activeTab);
      if (route.subView === 'editor') {
        if (route.slugOrId) {
          const found = posts.find(
            (p) => p.slug === route.slugOrId || p.id === route.slugOrId || p._id === route.slugOrId
          );
          setEditingPost(found || null);
        } else {
          setEditingPost(null);
        }
      } else {
        setEditingPost(null);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [posts]);

  const handleEditPost = (post) => {
    navigateToSubRoute('editor', post);
  };

  const handleNewPost = () => {
    navigateToSubRoute('editor', null);
  };

  return (
    <div className="bg-slate-50 dark:bg-[#100c18] font-body text-slate-900 dark:text-on-surface antialiased min-h-screen flex flex-row selection:bg-[#ff5167] selection:text-white transition-colors duration-300">
      {/* Left Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectTab={(tabId) => {
          if (tabId === 'dashboard') navigateToSubRoute('overview');
          else navigateToSubRoute('list');
          setIsMobileSidebarOpen(false);
        }} 
        onOpenHome={() => onNavigate && onNavigate('blog')}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100/50 dark:bg-[#120d20] min-h-screen transition-colors duration-300">
        {/* If in Editor Mode */}
        {subView === 'editor' ? (
          <AdminEditor 
            key={editingPost ? (editingPost.id || editingPost.slug) : 'new-post'}
            postToEdit={editingPost}
            onExit={() => navigateToSubRoute('list')}
            onNavigate={onNavigate}
          />
        ) : (
          <>
            {/* Top Navbar for List / Overview */}
            <AdminHeader 
              title="QUẢN LÝ BÀI VIẾT"
              onNewPostClick={handleNewPost}
              onSearchClick={() => navigateToSubRoute('list')}
              onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
            />
            {/* Sub-view Switcher Bar */}
            <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-2 max-w-[1600px] w-full mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-[#1e1a26] p-1 rounded-xl border border-slate-200 dark:border-[#2c2835] shadow-sm overflow-x-auto no-scrollbar">
                <button
                  onClick={handleNewPost}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  <span>Soạn bài mới</span>
                </button>
                <button
                  onClick={() => navigateToSubRoute('list')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    subView === 'list'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">list_alt</span>
                  <span>Danh sách bài viết</span>
                </button>
                <button
                  onClick={() => navigateToSubRoute('overview')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    subView === 'overview'
                      ? 'bg-gradient-to-r from-[#03b5d3] to-[#4cd7f6] text-[#003640] font-bold shadow-md'
                      : 'text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Tổng quan</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-on-surface-variant">
                <span>DUDI Admin Hub</span>
                <span>•</span>
                <button 
                  onClick={() => onNavigate && onNavigate('blog')}
                  className="text-sky-600 dark:text-[#4cd7f6] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Xem trang Blog</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 p-3 sm:p-6 pb-28 sm:pb-32 max-w-[1600px] w-full mx-auto">
              {subView === 'list' ? (
                <PostsManager 
                  onEditPost={handleEditPost}
                  onOpenNewPost={handleNewPost}
                  onNavigate={onNavigate}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* TOP-LEFT BOX: Views with Area Wave Chart */}
                  <ViewsChartCard />

                  {/* TOP-RIGHT BOX: Updates with timeline nodes */}
                  <TimelineUpdatesCard />

                  {/* BOTTOM-LEFT BOX: Popular Posts */}
                  <PopularPostsCard onOpenAllPosts={() => navigateToSubRoute('list')} />

                  {/* BOTTOM-RIGHT BOX: At a Glance Overview */}
                  <AtAGlanceCard />
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

