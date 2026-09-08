import React, { useState, useEffect, useRef } from 'react';

export default function PromptModal({
  isOpen,
  title = 'Nhập thông tin',
  description = '',
  placeholder = 'https://...',
  defaultValue = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  icon = 'link',
  iconColor = 'sky', // 'sky' | 'rose' | 'purple' | 'emerald' | 'amber'
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, defaultValue]);

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

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  };

  const colorStyles = {
    sky: {
      iconBg: 'bg-sky-500/15 text-sky-600 dark:text-[#4cd7f6] border-sky-500/30 shadow-sky-500/10',
      btn: 'bg-gradient-to-r from-sky-500 to-sky-600 dark:from-[#03b5d3] dark:to-[#4cd7f6] text-white font-bold hover:brightness-110 shadow-sky-500/20',
      borderFocus: 'focus:border-sky-500 dark:focus:border-[#4cd7f6]',
      glow: 'bg-sky-500 dark:bg-[#4cd7f6]'
    },
    rose: {
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-[#ffb3b5] border-rose-500/30 shadow-rose-500/10',
      btn: 'bg-gradient-to-r from-[#ff5167] to-[#e02447] text-white font-bold hover:brightness-110 shadow-rose-500/20',
      borderFocus: 'focus:border-rose-500 dark:focus:border-[#ff5167]',
      glow: 'bg-rose-500'
    },
    purple: {
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30 shadow-purple-500/10',
      btn: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:brightness-110 shadow-purple-500/20',
      borderFocus: 'focus:border-purple-500 dark:focus:border-purple-400',
      glow: 'bg-purple-500'
    },
    emerald: {
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
      btn: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:brightness-110 shadow-emerald-500/20',
      borderFocus: 'focus:border-emerald-500 dark:focus:border-emerald-400',
      glow: 'bg-emerald-500'
    },
    amber: {
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-amber-500/10',
      btn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:brightness-110 shadow-amber-500/20',
      borderFocus: 'focus:border-amber-500 dark:focus:border-amber-400',
      glow: 'bg-amber-500'
    }
  };

  const currentTheme = colorStyles[iconColor] || colorStyles.sky;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1e1a26] border border-slate-200 dark:border-[#2c2835] rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-[#e8dff1] overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div
          className={`absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none ${currentTheme.glow}`}
        />

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-lg ${currentTheme.iconBg}`}
          >
            <span className="material-symbols-outlined text-[26px]">
              {icon}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-on-surface-variant mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className={`w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-[#e8dff1] font-mono placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-inner ${currentTheme.borderFocus}`}
            />
            {value && (
              <button
                type="button"
                onClick={() => setValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Xóa nội dung"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-[#2c2835]/80">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs sm:text-sm font-display font-medium text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#15111d] hover:bg-slate-200 dark:hover:bg-[#252030] border border-slate-200 dark:border-[#2c2835] rounded-xl transition-all"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className={`px-5 py-2 text-xs sm:text-sm font-display font-semibold rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 ${currentTheme.btn}`}
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>{confirmText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
