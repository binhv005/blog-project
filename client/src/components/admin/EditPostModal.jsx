import React, { useState, useEffect } from 'react';

export default function EditPostModal({ isOpen, post, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Công nghệ');
  const [summary, setSummary] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [readTime, setReadTime] = useState('5 phút đọc');
  const [status, setStatus] = useState('published');

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setCategory(post.category || 'Công nghệ');
      setSummary(post.summary || '');
      const contentText = post.content?.map(c => `${c.heading ? '## ' + c.heading + '\n' : ''}${c.text}`).join('\n\n') || '';
      setRawContent(contentText);
      setCoverImage(post.coverImage || '');
      setReadTime(post.readTime || '5 phút đọc');
      setStatus(post.status || 'published');
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Convert raw content into structured sections
    const sections = rawContent.split(/\n## /).map((sec, idx) => {
      if (idx === 0 && !rawContent.startsWith('## ')) {
        return { heading: 'Nội dung', text: sec.trim() };
      }
      const lines = sec.split('\n');
      const heading = lines[0].replace(/^##\s*/, '').trim();
      const text = lines.slice(1).join('\n').trim();
      return { heading: heading || 'Mục ' + (idx + 1), text };
    });

    onSave(post.id, {
      title,
      category,
      summary,
      content: sections.length > 0 ? sections : [{ heading: 'Nội dung', text: rawContent }],
      coverImage: coverImage || post.coverImage,
      readTime,
      status
    });
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
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 dark:bg-[#4cd7f6]" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-on-surface">Chỉnh sửa bài viết</h3>
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
              Tiêu đề bài viết
            </label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all"
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
                Trạng thái
              </label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all"
              >
                <option value="published">Đã xuất bản (Công khai)</option>
                <option value="draft">Bản nháp (Lưu tạm)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
              URL Ảnh bìa (Cover Image)
            </label>
            <input 
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all"
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
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-semibold uppercase text-slate-600 dark:text-on-surface-variant mb-1.5">
              Nội dung bài viết (Sử dụng ## cho tiêu đề đoạn)
            </label>
            <textarea 
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows="6"
              placeholder="## Tiêu đề mục 1&#10;Nội dung chi tiết..."
              className="w-full bg-slate-50 dark:bg-[#15111d] border border-slate-200 dark:border-[#2c2835] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-on-surface focus:outline-none focus:border-sky-500 dark:focus:border-[#4cd7f6] transition-all font-mono text-xs"
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
              className="px-6 py-2 rounded-full font-display font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-[#03b5d3] to-[#4cd7f6] text-[#003640] shadow-[0_0_15px_rgba(76,215,246,0.4)] hover:brightness-110 transition-all"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
