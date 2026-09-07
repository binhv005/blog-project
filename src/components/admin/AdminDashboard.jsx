import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ViewsChartCard from './ViewsChartCard';
import TimelineUpdatesCard from './TimelineUpdatesCard';
import PopularPostsCard from './PopularPostsCard';
import AtAGlanceCard from './AtAGlanceCard';
import PostsManager from './PostsManager';
import AdminEditor from './AdminEditor';
import { useBlog } from '../../context/BlogContext';

export default function AdminDashboard({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [subView, setSubView] = useState('list'); // 'list', 'editor', 'overview'
  const [editingPost, setEditingPost] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { updatePost } = useBlog();

  const handleEditPost = (post) => {
    setEditingPost(post);
    setSubView('editor');
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setSubView('editor');
  };

  return (
    <div className="bg-[#100c18] font-body text-on-surface antialiased min-h-screen flex flex-row selection:bg-[#ff5167] selection:text-white">
      {/* Left Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          if (tabId === 'dashboard') setSubView('overview');
          else if (tabId === 'posts') setSubView('list');
          setIsMobileSidebarOpen(false);
        }} 
        onOpenHome={() => onNavigate && onNavigate('blog')}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#120d20] min-h-screen">
        {/* If in Editor Mode */}
        {subView === 'editor' ? (
          <AdminEditor 
            key={editingPost ? editingPost.id : 'new-post'}
            postToEdit={editingPost}
            onExit={() => setSubView('list')}
            onNavigate={onNavigate}
          />
        ) : (
          <>
            {/* Top Navbar for List / Overview */}
            <AdminHeader 
              title="QUẢN LÝ BÀI VIẾT"
              onNewPostClick={handleNewPost}
              onSearchClick={() => setSubView('list')}
              onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
            />
            {/* Sub-view Switcher Bar */}
            <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-2 max-w-[1600px] w-full mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#1e1a26] p-1 rounded-xl border border-[#2c2835] overflow-x-auto no-scrollbar">
                <button
                  onClick={handleNewPost}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 text-on-surface-variant hover:text-white flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  <span>Soạn bài mới</span>
                </button>
                <button
                  onClick={() => setSubView('list')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    subView === 'list'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">list_alt</span>
                  <span>Danh sách bài viết</span>
                </button>
                <button
                  onClick={() => setSubView('overview')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    subView === 'overview'
                      ? 'bg-gradient-to-r from-[#03b5d3] to-[#4cd7f6] text-[#003640] font-bold shadow-md'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Tổng quan</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-on-surface-variant">
                <span>DUDI Admin Hub</span>
                <span>•</span>
                <button 
                  onClick={() => onNavigate && onNavigate('blog')}
                  className="text-[#4cd7f6] hover:underline flex items-center gap-1"
                >
                  <span>Xem trang Blog</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 p-3 sm:p-6 max-w-[1600px] w-full mx-auto">
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
                  <PopularPostsCard onOpenAllPosts={() => setSubView('list')} />

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
