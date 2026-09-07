import React, { useState, useEffect } from 'react';

export default function ConsultationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    service: 'Kiến trúc Dữ liệu & AI',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          service: 'Kiến trúc Dữ liệu & AI',
          message: ''
        });
        onClose();
      }, 2500);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#1c152c] to-[#120d20] border border-purple-500/30 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 text-white overflow-hidden">
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
          title="Đóng"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <span className="material-symbols-outlined text-xl text-white">rocket_launch</span>
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold">
              DUDI Software Enterprise
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Đăng Ký Nhận Tư Vấn Dự Án
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          Đội ngũ kiến trúc sư công nghệ DUDI sẽ liên hệ tư vấn giải pháp tối ưu cho doanh nghiệp của bạn trong vòng 24h.
        </p>

        {isSubmitted ? (
          <div className="py-10 text-center flex flex-col items-center justify-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-3xl mb-2">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-white">Gửi thông tin thành công!</h3>
            <p className="text-xs text-slate-300 max-w-sm">
              Cảm ơn bạn đã liên hệ. Chúng tôi đã nhận được thông tin và sẽ phản hồi sớm nhất qua email/số điện thoại đã cung cấp.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Họ và tên / Doanh nghiệp <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A / Công ty ABC"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số điện thoại <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0988 xxx xxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email liên hệ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Giải pháp quan tâm
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c152c] border border-purple-500/20 text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
                >
                  <option value="Kiến trúc Dữ liệu & AI">Kiến trúc Dữ liệu & AI</option>
                  <option value="Chuyển đổi số doanh nghiệp">Chuyển đổi số doanh nghiệp</option>
                  <option value="Hạ tầng Cloud & DevOps">Hạ tầng Cloud & DevOps</option>
                  <option value="Bảo mật & An toàn thông tin">Bảo mật & An toàn thông tin</option>
                  <option value="Phát triển Web/App chuyên sâu">Phát triển Web/App chuyên sâu</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nội dung yêu cầu / Lời nhắn
              </label>
              <textarea
                rows="3"
                placeholder="Mô tả sơ bộ về dự án hoặc yêu cầu công nghệ cần tư vấn..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors resize-none"
              />
            </div>

            {/* Direct Contact Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] font-mono text-slate-400 border-t border-white/5">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-rose-400">mail</span>
                contact@dudi.vn
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#38bdf8]">call</span>
                (+84) 0988 123 456
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    Gửi yêu cầu tư vấn
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
