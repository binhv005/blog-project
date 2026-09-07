import React from 'react';

const menuItems = [
  { id: 'posts', label: 'Quản lý bài viết', icon: 'article' },
];

export default function AdminSidebar({ 
  activeTab = 'posts', 
  onSelectTab, 
  onOpenHome,
  isMobileOpen = false,
  onCloseMobile
}) {
  const sidebarContent = (
    <div className="flex flex-col justify-between h-full min-h-screen">
      <div className="flex flex-col">
        {/* Top Brand Box */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-[#2c2835]/60 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => {
              if (onOpenHome) onOpenHome();
              if (onCloseMobile) onCloseMobile();
            }} 
            title="Mở trang chủ DUDI Software"
          >
            <img 
              src="/logo-dudi.webp" 
              alt="DUDI Software Logo" 
              className="w-9 h-9 rounded-xl object-contain shadow-md shadow-[#ff5167]/20 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-[#e8dff1] group-hover:text-rose-600 dark:group-hover:text-[#ffb3b5] transition-colors">
                DUDI
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-[#ad8888] -mt-1 font-semibold">
                SOFTWARE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-[#ff5167]/20 text-rose-600 dark:text-[#ffb3b5] text-[10px] font-mono font-bold tracking-wider border border-rose-200 dark:border-transparent">
              PRO
            </span>
            {/* Close button on mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-slate-500 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-colors"
              title="Đóng thanh bên"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Navigation List - Only Posts */}
        <nav className="flex flex-col py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectTab) onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all w-full text-left group ${
                  isActive
                    ? 'bg-[#ff5167] text-white font-bold shadow-[0_0_15px_rgba(255,81,103,0.3)]'
                    : 'text-slate-600 dark:text-[#ad8888] hover:bg-slate-100 dark:hover:bg-[#2c2835] hover:text-slate-900 dark:hover:text-[#e8dff1]'
                }`}
                type="button"
              >
                <span className={`material-symbols-outlined text-[19px] ${isActive ? 'text-white' : 'text-slate-500 dark:text-[#ad8888] group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Action: Open Client Blog */}
      <div className="p-3 border-t border-slate-200 dark:border-[#2c2835]/60">
        <button 
          onClick={() => {
            if (onOpenHome) onOpenHome();
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-colors w-full border border-transparent hover:border-slate-300 dark:hover:border-[#373340]" 
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          <span>Xem trang Blog Client</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white/95 dark:bg-[#1e1a26]/90 backdrop-blur-xl border-r border-slate-200 dark:border-[#2c2835]/60 flex-col justify-between min-h-screen select-none sticky top-0 h-screen z-40 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#1e1a26] border-r border-slate-200 dark:border-[#2c2835] select-none transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
