import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-purple-950/40 py-12 mt-20 bg-slate-100 dark:bg-[#090710]/95 backdrop-blur-sm transition-colors">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Footer Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-dudi.webp" 
              alt="DUDI Software Logo" 
              className="w-9 h-9 rounded-xl object-contain shadow-md"
            />
            <div>
              <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">DUDI Software Co., Ltd</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kiến tạo hạ tầng số bảo mật và giải pháp trải nghiệm người dùng tương lai.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Chính sách bảo mật</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Điều khoản dịch vụ</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Sơ đồ trang</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Liên hệ báo chí</a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          <p>© 2026 DUDI Software. All rights reserved. Bản quyền nội dung và công nghệ thuộc về DUDI Software.</p>
        </div>

      </div>
    </footer>
  );
}
