import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';

export default function NewPostModal({ isOpen, onClose }) {
  const { createPost } = useBlog();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Công nghệ');
  const [summary, setSummary] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('published');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const sections = rawContent.split(/\n## /).map((sec, idx) => {
      if (idx === 0 && !rawContent.startsWith('## ')) {
        return { heading: 'Nội dung', text: sec.trim() };
      }
      const lines = sec.split('\n');
      const heading = lines[0].replace(/^##\s*/, '').trim();
      const text = lines.slice(1).join('\n').trim();
      return { heading: heading || 'Mục ' + (idx + 1), text };
    });

    createPost({
      title,
      category,
      summary,
      rawContent,
      content: sections.length > 0 && sections[0].text ? sections : [{ heading: 'Nội dung', text: summary || 'Nội dung bài viết...' }],
      coverImage: coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      status
    });

    toast.success(`Bài viết "${title}" đã được tạo thành công!`);
    setTitle('');
    setSummary('');
    setRawContent('');
    setCoverImage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1e1a26] border border-slate-200 dark:border-[#373340] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2c2835]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5167]" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-on-surface">Tạo bài viết mới</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
              Tiêu đề bài viết <span className="text-[#ff5167]">*</span>
            </label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              required
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-on-surface-variant/50 focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] focus:ring-1 focus:ring-sky-500 dark:focus:ring-[#4cd7f6] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
                Chuyên mục
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all"
              >
                <option value="Công nghệ">Công nghệ</option>
                <option value="Thiết kế">Thiết kế</option>
                <option value="Kinh doanh">Kinh doanh</option>
                <option value="Bảo mật">Bảo mật</option>
                <option value="AI & Big Data">AI & Big Data</option>
                <option value="Chính sách & Số hóa">Chính sách & Số hóa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
                Trạng thái xuất bản
              </label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all"
              >
                <option value="published">Xuất bản ngay (Công khai)</option>
                <option value="draft">Lưu bản nháp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
              URL Ảnh bìa (Cover Image URL)
            </label>
            <input 
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-on-surface-variant/50 focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
              Tóm tắt nội dung (Sa-pô)
            </label>
            <textarea 
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tóm tắt bài viết..."
              rows="3"
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-on-surface-variant/50 focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
              Nội dung bài viết (Sử dụng ## để phân đoạn mục)
            </label>
            <textarea 
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows="5"
              placeholder="## 01. Giới thiệu tổng quan&#10;Nội dung phần 1...&#10;&#10;## 02. Giải pháp công nghệ&#10;Nội dung phần 2..."
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-on-surface-variant/50 focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all resize-none font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#2c2835]">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-on-surface-variant hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-transparent hover:bg-slate-200 dark:hover:bg-[#2c2835] transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="px-6 py-2 rounded-full font-display font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-[#ff5167] to-[#e02447] shadow-[0_0_15px_rgba(255,81,103,0.4)] hover:brightness-110 transition-all"
            >
              Tạo bài viết
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
