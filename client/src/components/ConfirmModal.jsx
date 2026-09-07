import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'danger', // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md bg-[#1e1a26] border border-[#2c2835] rounded-2xl shadow-2xl p-6 text-on-surface overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow highlight */}
        <div
          className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#4cd7f6]'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDanger
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : isWarning
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isDanger ? 'delete_forever' : isWarning ? 'warning' : 'help'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant/90 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2c2835]/60">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-white bg-[#15111d] hover:bg-[#252030] border border-[#2c2835] rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              isDanger
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20 hover:shadow-red-500/40'
                : isWarning
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20'
                : 'bg-gradient-to-r from-[#4cd7f6] to-[#0ea5e9] text-[#0f0b15] font-bold hover:brightness-110'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDanger ? 'delete' : 'check'}
            </span>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
