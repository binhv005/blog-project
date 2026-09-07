import React, { useState, useEffect, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';

export default function AdminEditor({ postToEdit, onExit, onNavigate }) {
  const { createPost, updatePost, selectPost } = useBlog();
  const fileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const [targetBlockIndex, setTargetBlockIndex] = useState(null);

  // Document State
  const [title, setTitle] = useState(postToEdit?.title || '');
  const [summary, setSummary] = useState(postToEdit?.summary || '');
  const [category, setCategory] = useState(postToEdit?.category || 'Công nghệ & Kiến trúc phần mềm');
  const [authorName, setAuthorName] = useState(postToEdit?.author?.name || 'Alex Vũ (Super Admin)');
  const [coverImage, setCoverImage] = useState(postToEdit?.coverImage || '');
  const [slug, setSlug] = useState(postToEdit?.slug || '');
  const [metaDesc, setMetaDesc] = useState(postToEdit?.metaDesc || postToEdit?.summary || '');
  const [tags, setTags] = useState(postToEdit?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // Initial Sequential Blocks
  const getInitialBlocks = () => {
    if (postToEdit?.blocks && Array.isArray(postToEdit.blocks) && postToEdit.blocks.length > 0) {
      return postToEdit.blocks;
    }
    if (postToEdit?.content && Array.isArray(postToEdit.content)) {
      const generated = [];
      postToEdit.content.forEach((sec, idx) => {
        if (sec.heading) {
          generated.push({ id: `h-${idx}-${Date.now()}`, type: 'heading', text: sec.heading });
        }
        if (sec.text) {
          generated.push({ id: `p-${idx}-${Date.now()}`, type: 'paragraph', text: sec.text });
        }
        if (sec.quote) {
          generated.push({ id: `q-${idx}-${Date.now()}`, type: 'quote', text: sec.quote, author: sec.quoteAuthor || '' });
        }
      });
      if (postToEdit.images && postToEdit.images.length > 0) {
        postToEdit.images.forEach((img, imgIdx) => {
          generated.splice(Math.min(generated.length, (imgIdx + 1) * 2), 0, {
            id: img.id || `img-${imgIdx}`,
            type: 'image',
            url: img.url,
            caption: img.caption || 'Hình ảnh minh họa (.webp)'
          });
        });
      }
      return generated.length > 0 ? generated : [{ id: `block-init-${Date.now()}`, type: 'paragraph', text: '' }];
    }
    // New empty post starts with 1 empty paragraph block
    return [{ id: `block-init-${Date.now()}`, type: 'paragraph', text: '' }];
  };

  const [blocks, setBlocks] = useState(getInitialBlocks);

  const [isPublic, setIsPublic] = useState(postToEdit ? postToEdit.status !== 'draft' : true);
  const [scheduleTime, setScheduleTime] = useState(
    new Date(Date.now() + 3600 * 1000 * 24).toISOString().slice(0, 16)
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(
    new Date().toTimeString().split(' ')[0]
  );
  const [selectedFormat, setSelectedFormat] = useState('H2');

  // Auto-generate slug when title changes if creating new
  useEffect(() => {
    if (!postToEdit && title.trim()) {
      const generated = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generated);
      if (!metaDesc) {
        setMetaDesc(summary || title);
      }
    }
  }, [title, postToEdit, summary, metaDesc]);

  // Handle autosave timer simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastSavedTime(now.toTimeString().split(' ')[0]);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Compute live word count & reading time
  const fullText = `${title} ${summary} ${blocks.map((b) => b.text || '').join(' ')}`.trim();
  const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMinutes = wordCount > 0 ? (wordCount / 200).toFixed(1) : '0';
  const headingsCount = blocks.filter((b) => b.type === 'heading').length;
  const imageBlocksCount = blocks.filter((b) => b.type === 'image').length + (coverImage ? 1 : 0);

  // Auto resize all textareas to fit entire content without scrolling
  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    Object.values(inputRefs.current).forEach((el) => {
      if (el && el.tagName === 'TEXTAREA') {
        autoResizeTextarea(el);
      }
    });
  }, [blocks, title, summary]);

  // History State for Undo / Redo
  const [history, setHistory] = useState([getInitialBlocks()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Active focus & selection tracking
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const inputRefs = useRef({});

  // Formatting state for toolbar buttons
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isStrikethroughActive, setIsStrikethroughActive] = useState(false);
  const [activeTextColor, setActiveTextColor] = useState('#ff5167');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const [textAlign, setTextAlign] = useState('left'); // 'left' | 'center' | 'right'

  // Push to history on meaningful block change
  const pushHistory = (newBlocks) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(JSON.parse(JSON.stringify(newBlocks)));
    if (updatedHistory.length > 30) updatedHistory.shift();
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setBlocks(JSON.parse(JSON.stringify(history[prevIdx])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setBlocks(JSON.parse(JSON.stringify(history[nextIdx])));
    }
  };

  // Block management functions
  const updateBlock = (id, newFields) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...newFields } : b));
      return updated;
    });
  };

  const deleteBlock = (id) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      const res = filtered.length > 0 ? filtered : [{ id: `b-${Date.now()}`, type: 'paragraph', text: '' }];
      pushHistory(res);
      return res;
    });
  };

  const insertBlockAt = (index, blockData) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      const targetIdx = index >= 0 && index < newBlocks.length ? index : newBlocks.length - 1;
      newBlocks.splice(targetIdx + 1, 0, blockData);
      pushHistory(newBlocks);
      return newBlocks;
    });
    setFocusedBlockId(blockData.id);
  };

  const getActiveIndex = () => {
    if (!focusedBlockId) return blocks.length - 1;
    const idx = blocks.findIndex((b) => b.id === focusedBlockId);
    return idx !== -1 ? idx : blocks.length - 1;
  };

  // LOGIC GROUP 1: Format & Heading Conversion
  const handleFormatDropdownChange = (val) => {
    setSelectedFormat(val);
    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];

    if (currentBlock) {
      if (val === 'H1' || val === 'H2' || val === 'H3') {
        updateBlock(currentBlock.id, {
          type: 'heading',
          level: val,
          text: currentBlock.text || currentBlock.heading || ''
        });
      } else if (val === 'p') {
        updateBlock(currentBlock.id, {
          type: 'paragraph',
          text: currentBlock.text || ''
        });
      } else if (val === 'quote') {
        updateBlock(currentBlock.id, {
          type: 'quote',
          text: currentBlock.text || 'Trích dẫn quan trọng',
          author: currentBlock.author || 'Tác giả'
        });
      } else if (val === 'code') {
        updateBlock(currentBlock.id, {
          type: 'code',
          code: currentBlock.text || currentBlock.code || '// Đoạn mã'
        });
      }
      pushHistory(blocks);
    } else {
      if (val === 'H1' || val === 'H2' || val === 'H3') {
        insertBlockAt(blocks.length - 1, { id: `h-${Date.now()}`, type: 'heading', level: val, text: '' });
      } else if (val === 'p') {
        insertBlockAt(blocks.length - 1, { id: `p-${Date.now()}`, type: 'paragraph', text: '' });
      }
    }
  };

  // LOGIC GROUP 2: Typography Selection Wrapping & Inline Styles
  const wrapSelectedTextOrToggle = (prefix, suffix, styleKey) => {
    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    const el = inputRefs.current[currentBlock?.id];

    if (el && typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number' && el.selectionStart !== el.selectionEnd) {
      // Wrap highlighted text
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const original = el.value || '';
      const selected = original.substring(start, end);
      const replaced = original.substring(0, start) + prefix + selected + suffix + original.substring(end);

      updateBlock(currentBlock.id, { text: replaced });
      pushHistory(blocks);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 50);
    } else if (currentBlock) {
      // Toggle block level styling attribute
      const currentValue = currentBlock[styleKey];
      const updated = { [styleKey]: !currentValue };
      updateBlock(currentBlock.id, updated);
      pushHistory(blocks);
    }
  };

  const handleBoldToggle = () => {
    setIsBoldActive(!isBoldActive);
    wrapSelectedTextOrToggle('**', '**', 'bold');
  };

  const handleItalicToggle = () => {
    setIsItalicActive(!isItalicActive);
    wrapSelectedTextOrToggle('*', '*', 'italic');
  };

  const handleUnderlineToggle = () => {
    setIsUnderlineActive(!isUnderlineActive);
    wrapSelectedTextOrToggle('<u>', '</u>', 'underline');
  };

  const handleStrikethroughToggle = () => {
    setIsStrikethroughActive(!isStrikethroughActive);
    wrapSelectedTextOrToggle('~~', '~~', 'strikethrough');
  };

  const handleColorApply = (color) => {
    setActiveTextColor(color);
    setShowColorPicker(false);
    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    const el = inputRefs.current[currentBlock?.id];

    if (el && typeof el.selectionStart === 'number' && el.selectionStart !== el.selectionEnd) {
      wrapSelectedTextOrToggle(`<span style="color:${color}">`, '</span>', 'color');
    } else if (currentBlock) {
      updateBlock(currentBlock.id, { color });
      pushHistory(blocks);
    }
  };

  const handleHighlightToggle = () => {
    setIsHighlightActive(!isHighlightActive);
    wrapSelectedTextOrToggle('<mark>', '</mark>', 'highlight');
  };

  // LOGIC GROUP 3: Alignment & Quick Block Inserts
  const handleAlignmentChange = (alignDir) => {
    setTextAlign(alignDir);
    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    const el = inputRefs.current[currentBlock?.id];

    // If a specific portion of text is highlighted/selected, align only that part
    if (el && typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number' && el.selectionStart !== el.selectionEnd) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const original = el.value || '';
      const selected = original.substring(start, end);
      
      // Clean previous alignment tags on selection if existing
      const cleanSelected = selected.replace(/^<div align="(left|center|right)">/i, '').replace(/<\/div>$/i, '');
      const prefix = `<div align="${alignDir}">`;
      const suffix = `</div>`;
      const replaced = original.substring(0, start) + prefix + cleanSelected + suffix + original.substring(end);

      updateBlock(currentBlock.id, { text: replaced });
      pushHistory(blocks);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 50);
    } else if (currentBlock) {
      // If no text is highlighted, apply alignment to the active block
      updateBlock(currentBlock.id, { align: alignDir });
      pushHistory(blocks);
    }
  };

  const handleInsertBulletList = (idx = getActiveIndex()) => {
    const currentBlock = blocks[idx];
    if (currentBlock && currentBlock.type === 'paragraph' && currentBlock.text?.trim()) {
      const items = currentBlock.text.split('\n').filter(Boolean);
      updateBlock(currentBlock.id, {
        type: 'list',
        listType: 'bullet',
        items: items.length > 0 ? items : [currentBlock.text]
      });
      pushHistory(blocks);
    } else {
      insertBlockAt(idx, {
        id: `list-${Date.now()}`,
        type: 'list',
        listType: 'bullet',
        items: ['Điểm nổi bật đầu tiên', 'Quy trình và kiến trúc tối ưu']
      });
    }
  };

  const handleInsertNumberedList = (idx = getActiveIndex()) => {
    const currentBlock = blocks[idx];
    if (currentBlock && currentBlock.type === 'paragraph' && currentBlock.text?.trim()) {
      const items = currentBlock.text.split('\n').filter(Boolean);
      updateBlock(currentBlock.id, {
        type: 'list',
        listType: 'numbered',
        items: items.length > 0 ? items : [currentBlock.text]
      });
      pushHistory(blocks);
    } else {
      insertBlockAt(idx, {
        id: `list-${Date.now()}`,
        type: 'list',
        listType: 'numbered',
        items: ['Bước 1: Khởi tạo module hệ thống', 'Bước 2: Triển khai kiểm thử tự động']
      });
    }
  };

  const handleInsertQuote = (idx = getActiveIndex()) => {
    const currentBlock = blocks[idx];
    if (currentBlock && currentBlock.type === 'paragraph' && currentBlock.text?.trim()) {
      updateBlock(currentBlock.id, {
        type: 'quote',
        text: currentBlock.text,
        author: 'Tech Lead'
      });
      pushHistory(blocks);
    } else {
      insertBlockAt(idx, {
        id: `q-${Date.now()}`,
        type: 'quote',
        text: 'Kiến trúc phần mềm tốt là nền tảng cho sự mở rộng vô hạn.',
        author: 'Lead Architect'
      });
    }
  };

  const handleInsertCode = (idx = getActiveIndex()) => {
    const currentBlock = blocks[idx];
    if (currentBlock && currentBlock.type === 'paragraph' && currentBlock.text?.trim()) {
      updateBlock(currentBlock.id, {
        type: 'code',
        code: currentBlock.text
      });
      pushHistory(blocks);
    } else {
      insertBlockAt(idx, {
        id: `c-${Date.now()}`,
        type: 'code',
        code: '// Cấu hình tối ưu hệ thống WebP\nconst config = {\n  format: "webp",\n  quality: 85,\n  cache: true\n};'
      });
    }
  };

  // LOGIC GROUP 4: Media & Inserts
  const handleInsertTable = (idx = getActiveIndex()) => {
    insertBlockAt(idx, {
      id: `tbl-${Date.now()}`,
      type: 'table',
      headers: ['Thành phần', 'Độ trễ', 'Trạng thái'],
      rows: [
        ['API Gateway', '12ms', 'Tối ưu'],
        ['Redis Cache', '2ms', 'Hoạt động tốt'],
        ['Database Node', '28ms', 'Ổn định']
      ]
    });
  };

  const handleInsertVideo = (idx = getActiveIndex()) => {
    const url = prompt('Nhập đường dẫn Video (YouTube Embed hoặc file MP4):', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    if (url) {
      insertBlockAt(idx, {
        id: `vid-${Date.now()}`,
        type: 'video',
        url,
        caption: 'Video minh họa kiến trúc và quy trình vận hành'
      });
    }
  };

  const handleInsertLink = (idx = getActiveIndex()) => {
    const currentBlock = blocks[idx];
    const el = inputRefs.current[currentBlock?.id];
    let selectedText = '';
    if (el && typeof el.selectionStart === 'number' && el.selectionStart !== el.selectionEnd) {
      selectedText = (el.value || '').substring(el.selectionStart, el.selectionEnd);
    }

    const text = prompt('Nhập văn bản hiển thị cho liên kết:', selectedText || 'Tìm hiểu thêm tài liệu kỹ thuật');
    const linkUrl = prompt('Nhập URL đích:', 'https://dudisoftware.com');
    if (text && linkUrl) {
      if (selectedText && el) {
        wrapSelectedTextOrToggle(`[${text}](`, `${linkUrl})`, 'link');
      } else {
        insertBlockAt(idx, {
          id: `p-${Date.now()}`,
          type: 'paragraph',
          text: `👉 [${text}](${linkUrl})`
        });
      }
    }
  };

  const handleInsertDivider = (idx = getActiveIndex()) => {
    insertBlockAt(idx, {
      id: `div-${Date.now()}`,
      type: 'divider'
    });
  };

  // Open file input to insert image at a specific block position
  const triggerImageUploadAt = (index = getActiveIndex()) => {
    setTargetBlockIndex(index);
    fileInputRef.current?.click();
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleFileUpload = async (e, isCover = false) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target.result;
        let finalImageUrl = rawBase64;

        try {
          // Upload directly to Cloudinary
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image: rawBase64,
              folder: isCover ? 'dudi_blog/covers' : 'dudi_blog/blocks' 
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.url) {
              finalImageUrl = data.url;
              console.log('[Cloudinary] Tải ảnh lên thành công:', finalImageUrl);
            }
          }
        } catch (uploadErr) {
          console.warn('[Cloudinary] Không thể tải lên Cloudinary, dùng base64 tạm:', uploadErr);
        } finally {
          setIsUploadingImage(false);
        }

        if (isCover) {
          setCoverImage(finalImageUrl);
        } else {
          const insertIdx = targetBlockIndex !== null ? targetBlockIndex : getActiveIndex();
          const imageBlock = {
            id: `img-${Date.now()}`,
            type: 'image',
            url: finalImageUrl,
            caption: file.name ? `Hình: ${file.name.replace(/\.[^/.]+$/, '')} (.webp)` : 'Hình ảnh minh họa (.webp)'
          };
          const nextParagraph = {
            id: `p-${Date.now() + 1}`,
            type: 'paragraph',
            text: ''
          };

          setBlocks((prev) => {
            const next = [...prev];
            next.splice(insertIdx + 1, 0, imageBlock, nextParagraph);
            pushHistory(next);
            return next;
          });
          if (!coverImage) setCoverImage(finalImageUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertImageUrlAt = (index, url) => {
    if (url) {
      const webpUrl = url.includes('unsplash.com') && !url.includes('fm=webp') ? `${url}&fm=webp` : url;
      const imageBlock = {
        id: `img-${Date.now()}`,
        type: 'image',
        url: webpUrl,
        caption: 'Hình ảnh kiến trúc hệ thống (.webp)'
      };
      const nextParagraph = {
        id: `p-${Date.now() + 1}`,
        type: 'paragraph',
        text: ''
      };

      setBlocks((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, imageBlock, nextParagraph);
        pushHistory(next);
        return next;
      });
      if (!coverImage) setCoverImage(webpUrl);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const formattedTag = newTagInput.startsWith('#') ? newTagInput.trim() : `#${newTagInput.trim()}`;
      if (!tags.includes(formattedTag)) {
        setTags([...tags, formattedTag]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (status = 'published') => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết!');
      return;
    }

    // Structured content derived from blocks for compatibility
    const contentSections = [];
    let currentSection = { heading: '', text: '' };

    blocks.forEach((block) => {
      if (block.type === 'heading') {
        if (currentSection.text || currentSection.heading) {
          contentSections.push(currentSection);
        }
        currentSection = { heading: block.text, text: '' };
      } else if (block.type === 'paragraph') {
        currentSection.text = currentSection.text ? `${currentSection.text}\n\n${block.text}` : block.text;
      } else if (block.type === 'quote') {
        currentSection.quote = block.text;
        currentSection.quoteAuthor = block.author || '';
      }
    });
    if (currentSection.text || currentSection.heading) {
      contentSections.push(currentSection);
    }

    const firstImgBlock = blocks.find((b) => b.type === 'image');

    const postData = {
      title,
      slug: slug || 'bai-viet-moi',
      category,
      summary: summary || 'Tóm tắt bài viết...',
      blocks,
      coverImage: coverImage || firstImgBlock?.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&fm=webp',
      tags: tags.length > 0 ? tags : ['#DUDISoftware', '#TechNews'],
      status,
      authorName: authorName.split(' (')[0],
      authorRole: 'Lead Architect',
      readTime: `${Math.max(1, Math.ceil(wordCount / 200))} phút đọc`,
      content: contentSections.length > 0 ? contentSections : [{ heading: 'Nội dung', text: summary || 'Nội dung bài viết đang được cập nhật.' }]
    };

    if (postToEdit) {
      await updatePost(postToEdit.id, postData);
      alert(`Đã cập nhật bài viết "${title}" vào cơ sở dữ liệu MongoDB thành công!`);
    } else {
      await createPost(postData);
      alert(`Đã ${status === 'published' ? 'xuất bản' : 'lưu nháp'} bài viết "${title}" vào MongoDB thành công!`);
    }

    if (onExit) onExit();
  };

  const handlePreview = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết trước khi xem trước!');
      return;
    }

    const firstImgBlock = blocks.find((b) => b.type === 'image');

    if (postToEdit) {
      await updatePost(postToEdit.id, { title, summary, blocks, category });
      selectPost(postToEdit.id);
    } else {
      const created = await createPost({
        title,
        slug: slug || 'preview-post',
        category,
        summary,
        blocks,
        coverImage: coverImage || firstImgBlock?.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&fm=webp',
        tags: tags.length > 0 ? tags : ['#DUDISoftware'],
        status: 'draft',
        content: [{ heading: 'Nội dung xem trước', text: summary || 'Nội dung đang được soạn thảo...' }]
      });
      selectPost(created.id);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#15111d] text-[#e8dff1] antialiased min-h-screen">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFileUpload(e, false)} 
        accept="image/webp,image/png,image/jpeg,image/gif" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={coverFileInputRef} 
        onChange={(e) => handleFileUpload(e, true)} 
        accept="image/webp,image/png,image/jpeg,image/gif" 
        className="hidden" 
      />

      {/* Sticky Sub-Header / Action Bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 bg-[#1a1426]/95 px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-b border-[#352b48]">
        {/* Breadcrumb & State Badge */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <nav className="flex items-center gap-1 text-[#ad8888] text-xs overflow-x-auto no-scrollbar whitespace-nowrap">
            <button onClick={onExit} className="hover:text-[#ffb3b5] transition-colors flex-shrink-0">
              Quản trị
            </button>
            <span className="material-symbols-outlined text-[14px] flex-shrink-0">chevron_right</span>
            <button onClick={onExit} className="hover:text-[#ffb3b5] transition-colors flex-shrink-0">
              Bài viết
            </button>
            <span className="material-symbols-outlined text-[14px] flex-shrink-0">chevron_right</span>
            <span className="text-[#e8dff1] font-semibold truncate max-w-[120px] sm:max-w-[200px]">
              {postToEdit ? 'Chỉnh sửa' : 'Soạn mới'}
            </span>
          </nav>
          <div className="h-4 w-px bg-[#373340] hidden md:block"></div>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2c2835] text-[#ad8888] font-mono text-[11px] flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Đã tự động lưu: {lastSavedTime}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#2c2835] text-[#ad8888] hover:text-white transition-colors text-xs font-semibold"
            type="button"
            title="Quay lại danh sách"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          <button
            onClick={handlePreview}
            className="group flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#2c2835] text-[#e8dff1] hover:bg-[#3c3745] transition-all shadow-sm text-xs font-semibold"
            type="button"
            title="Xem trước trên Blog"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:text-[#4cd7f6] transition-colors">
              visibility
            </span>
            <span className="hidden sm:inline">Xem trước</span>
          </button>

          <button
            onClick={() => handleSave('draft')}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#2c2835] text-[#ad8888] hover:text-[#e8dff1] hover:bg-[#3c3745] transition-all text-xs font-semibold"
            type="button"
            title="Lưu bản nháp"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span className="hidden sm:inline">Lưu nháp</span>
          </button>

          <button
            onClick={() => handleSave('published')}
            className="relative group flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#ff2d55] to-[#ff5167] text-white text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(255,45,85,0.45)] hover:shadow-[0_0_28px_rgba(255,45,85,0.65)] hover:brightness-110 active:translate-y-px transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            <span>Xuất bản</span>
          </button>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors xl:hidden ${
              isDrawerOpen 
                ? 'bg-[#ff5167]/20 text-[#ffb3b5] border border-[#ff5167]/40' 
                : 'bg-[#2c2835] text-[#ad8888] hover:text-[#ffb3b5]'
            }`}
            title={isDrawerOpen ? 'Đóng bảng cài đặt' : 'Mở bảng cài đặt'}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">view_sidebar</span>
          </button>
        </div>
      </div>

      {/* Floating Toolbar Ribbon (Exact match to requested ribbon with full reactive logic) */}
      <div className="sticky top-[52px] sm:top-[58px] z-20 w-full bg-[#140e20]/95 backdrop-blur-2xl py-2 px-2 sm:px-4 shadow-[0_12px_24px_rgba(0,0,0,0.55)] border-b border-[#352b48]">
        <div className="max-w-[1500px] mx-auto flex items-center justify-start md:justify-center overflow-x-auto py-0.5 no-scrollbar touch-pan-x">
          {/* Main Ribbon Outer Container */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 rounded-2xl bg-[#1a1329] border border-[#483966] shadow-2xl flex-nowrap min-w-max relative">
            
            {/* GROUP 1: Undo / Redo + Heading Dropdown */}
            <div className="flex items-center gap-1 bg-[#1e192a] border border-[#352f44] rounded-xl p-1 shadow-inner">
              <button
                onClick={handleUndo}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-white hover:bg-[#2c2835] active:scale-95 transition-all"
                title="Hoàn tác (Undo - Ctrl+Z)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">undo</span>
              </button>
              <button
                onClick={handleRedo}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-white hover:bg-[#2c2835] active:scale-95 transition-all"
                title="Làm lại (Redo - Ctrl+Y)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">redo</span>
              </button>
              
              <div className="relative inline-flex items-center">
                <select
                  value={selectedFormat}
                  onChange={(e) => handleFormatDropdownChange(e.target.value)}
                  className="appearance-none bg-transparent hover:bg-[#2c2835]/60 text-[#e8dff1] text-xs font-semibold pl-2.5 pr-6 py-1 rounded-lg outline-none cursor-pointer transition-colors"
                >
                  <option className="bg-[#1e1a26] text-[#e8dff1] py-1" value="H2">Tiêu đề H2</option>
                  <option className="bg-[#1e1a26] text-[#e8dff1] py-1" value="H1">Tiêu đề H1</option>
                  <option className="bg-[#1e1a26] text-[#e8dff1] py-1" value="H3">Tiêu đề H3</option>
                  <option className="bg-[#1e1a26] text-[#e8dff1] py-1" value="p">Đoạn văn</option>
                  <option className="bg-[#1e1a26] text-[#e8dff1] py-1" value="quote">Trích dẫn</option>
                  <option className="bg-[#1e1a26] text-[#e8dff1] py-1" value="code">Mã nguồn (Code)</option>
                </select>
                <span className="material-symbols-outlined text-[15px] text-[#ad8888] absolute right-1.5 pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>

            {/* GROUP 2: Typography (B, I, U, S | Color, Pen) */}
            <div className="flex items-center gap-1 bg-[#1e192a] border border-[#352f44] rounded-xl p-1 shadow-inner relative">
              <button
                onClick={handleBoldToggle}
                className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs transition-all ${
                  isBoldActive 
                    ? 'bg-[#482835] text-[#ff8f9c] shadow-sm ring-1 ring-[#ff5167]/40' 
                    : 'text-[#ad8888] hover:text-white hover:bg-[#2c2835]'
                }`}
                title="In đậm chữ (B) - bôi đen hoặc click để bật/tắt"
                type="button"
              >
                B
              </button>

              <button
                onClick={handleItalicToggle}
                className={`w-7 h-7 flex items-center justify-center rounded-lg font-serif italic text-xs font-semibold transition-all ${
                  isItalicActive 
                    ? 'bg-[#482835] text-[#ff8f9c] ring-1 ring-[#ff5167]/40' 
                    : 'text-[#ad8888] hover:text-white hover:bg-[#2c2835]'
                }`}
                title="In nghiêng (I)"
                type="button"
              >
                I
              </button>

              <button
                onClick={handleUnderlineToggle}
                className={`w-7 h-7 flex items-center justify-center rounded-lg underline text-xs font-semibold transition-all ${
                  isUnderlineActive 
                    ? 'bg-[#482835] text-[#ff8f9c] ring-1 ring-[#ff5167]/40' 
                    : 'text-[#ad8888] hover:text-white hover:bg-[#2c2835]'
                }`}
                title="Gạch chân (U)"
                type="button"
              >
                U
              </button>

              <button
                onClick={handleStrikethroughToggle}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  isStrikethroughActive 
                    ? 'bg-[#482835] text-[#ff8f9c] ring-1 ring-[#ff5167]/40' 
                    : 'text-[#ad8888] hover:text-white hover:bg-[#2c2835]'
                }`}
                title="Gạch ngang chữ (S)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">strikethrough_s</span>
              </button>

              {/* Separator */}
              <div className="h-4 w-px bg-[#352f44] mx-0.5"></div>

              {/* Text Color Button with Palette Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="h-7 px-1.5 flex items-center gap-0.5 rounded-lg text-[#ad8888] hover:text-white hover:bg-[#2c2835] transition-all"
                  title="Chọn màu chữ"
                  type="button"
                >
                  <span className="text-xs font-bold underline decoration-2" style={{ textDecorationColor: activeTextColor }}>A</span>
                  <span className="text-[10px] text-[#ad8888] font-bold">-</span>
                </button>

                {showColorPicker && (
                  <div className="absolute top-9 left-0 z-50 p-2 rounded-xl bg-[#1e1a26] border border-[#373340] shadow-2xl flex items-center gap-1.5">
                    {['#ff5167', '#4cd7f6', '#a855f7', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorApply(color)}
                        className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={`Màu ${color}`}
                        type="button"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pen / Highlighter Button (Cyan) */}
              <button
                onClick={handleHighlightToggle}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  isHighlightActive 
                    ? 'bg-[#153443] text-[#4cd7f6] ring-1 ring-[#4cd7f6]/40' 
                    : 'text-[#4cd7f6] hover:bg-[#2c2835]'
                }`}
                title="Đánh dấu Highlight văn bản"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>

            {/* GROUP 3: Alignment, Lists, Quote & Code */}
            <div className="flex items-center gap-1 bg-[#1e192a] border border-[#352f44] rounded-xl p-1 shadow-inner">
              <button
                onClick={() => handleAlignmentChange('left')}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  textAlign === 'left'
                    ? 'bg-[#2b2538] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#ad8888] hover:text-white hover:bg-[#2c2835]'
                }`}
                title="Căn trái (Align Left)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">format_align_left</span>
              </button>

              <button
                onClick={() => handleAlignmentChange('center')}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  textAlign === 'center'
                    ? 'bg-[#2b2538] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#ad8888] hover:text-white hover:bg-[#2c2835]'
                }`}
                title="Căn giữa (Align Center)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">format_align_center</span>
              </button>

              <button
                onClick={() => handleAlignmentChange('right')}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  textAlign === 'right'
                    ? 'bg-[#2b2538] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-[#ad8888] hover:text-white hover:bg-[#2c2835]'
                }`}
                title="Căn phải (Align Right)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">format_align_right</span>
              </button>

              {/* Separator */}
              <div className="h-4 w-px bg-[#352f44] mx-0.5"></div>

              {/* Bullet List */}
              <button
                onClick={() => handleInsertBulletList()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-white hover:bg-[#2c2835] transition-all"
                title="Danh sách gạch đầu dòng"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">format_list_bulleted</span>
              </button>

              {/* Numbered List */}
              <button
                onClick={() => handleInsertNumberedList()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-white hover:bg-[#2c2835] transition-all"
                title="Danh sách đánh số thứ tự"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">format_list_numbered</span>
              </button>

              {/* Quote 99 */}
              <button
                onClick={() => handleInsertQuote()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-white hover:bg-[#2c2835] font-serif font-bold text-xs transition-all"
                title="Khối trích dẫn (Quote)"
                type="button"
              >
                99
              </button>

              {/* Code Block </> */}
              <button
                onClick={() => handleInsertCode()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-white hover:bg-[#2c2835] transition-all"
                title="Khối mã nguồn (Code </>)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">code</span>
              </button>
            </div>

            {/* GROUP 4: Chèn ảnh, Video, Table, Link, Divider */}
            <div className="flex items-center gap-1.5 bg-[#1e192a] border border-[#352f44] rounded-xl p-1 shadow-inner">
              {/* Chèn ảnh button */}
              <button
                onClick={() => triggerImageUploadAt()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#221e2e] text-[#4cd7f6] hover:bg-[#2c2838] hover:brightness-110 transition-all text-xs font-semibold border border-[#3a3348] shadow-sm"
                title="Chèn ảnh định dạng WebP vào vị trí đang chọn"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">add_photo_alternate</span>
                <span>Chèn ảnh</span>
              </button>

              {/* Video Button */}
              <button
                onClick={() => handleInsertVideo()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-[#4cd7f6] hover:bg-[#2c2835] transition-all"
                title="Chèn Video Embed"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">smart_display</span>
              </button>

              {/* Table Button */}
              <button
                onClick={() => handleInsertTable()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-[#4cd7f6] hover:bg-[#2c2835] transition-all"
                title="Chèn bảng dữ liệu 3x3"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">table_chart</span>
              </button>

              {/* Link Button */}
              <button
                onClick={() => handleInsertLink()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-[#4cd7f6] hover:bg-[#2c2835] transition-all"
                title="Chèn liên kết Hyperlink"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">link</span>
              </button>

              {/* Divider Button */}
              <button
                onClick={() => handleInsertDivider()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ad8888] hover:text-[#ff5167] hover:bg-[#2c2835] transition-all"
                title="Chèn đường phân cách (Divider)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">horizontal_rule</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Workspace Grid: Document Canvas & Sidebar Inspector */}
      <div className="px-4 lg:px-8 py-6 w-full max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* MAIN DOCUMENT CANVAS (Word Paper Style in Dark Mode) */}
        <div className="xl:col-span-8 flex flex-col items-center">
          <article className="w-full max-w-[880px] min-h-[900px] bg-[#1c152c] backdrop-blur-xl rounded-2xl p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-[#3e3159] ring-1 ring-purple-500/20 relative overflow-hidden flex flex-col justify-between">
            <div>
              {/* Top subtle luminescent gradient edge */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff5167]/60 to-transparent"></div>

              {/* Cover Image Area Directly Above Title */}
              <div className="mb-6 -mt-2 group/cover relative">
                {coverImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#3e3159] bg-[#140e22] shadow-xl group">
                    <img
                      src={coverImage}
                      alt="Ảnh bìa bài viết"
                      className="w-full h-52 sm:h-72 object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140e22]/90 via-transparent to-black/20 opacity-80 pointer-events-none" />
                    
                    {/* Action Overlay Controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e1533]/90 text-[#ffb3b5] hover:text-white hover:bg-[#ff5167] text-xs font-semibold backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95"
                        title="Tải ảnh mới từ máy tính (.webp)"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        <span>Đổi ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newUrl = prompt('Nhập đường dẫn URL ảnh bìa (.webp, .png, .jpg):', coverImage);
                          if (newUrl !== null && newUrl.trim()) setCoverImage(newUrl.trim());
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e1533]/90 text-[#4cd7f6] hover:text-white hover:bg-[#03b5d3] text-xs font-semibold backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95"
                        title="Chèn URL ảnh trực tiếp"
                      >
                        <span className="material-symbols-outlined text-[16px]">link</span>
                        <span>Đổi URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="p-1.5 rounded-xl bg-[#1e1533]/90 text-rose-400 hover:text-white hover:bg-rose-600 text-xs font-semibold backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95"
                        title="Gỡ ảnh bìa"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#4cd7f6] border border-[#4cd7f6]/30 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">image</span>
                      <span>Ảnh bìa chính (Cover Image)</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#ad8888] hover:text-white hover:bg-[#281e3d] border border-dashed border-[#443660] hover:border-[#ff5167] transition-all group/btn"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#ff5167] group-hover/btn:scale-110 transition-transform">
                        add_photo_alternate
                      </span>
                      <span>+ Thêm ảnh bìa trên tiêu đề</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Nhập đường dẫn URL ảnh bìa (.webp, .png, .jpg):');
                        if (url && url.trim()) setCoverImage(url.trim());
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#ad8888] hover:text-[#4cd7f6] hover:bg-[#281e3d] border border-transparent hover:border-[#4cd7f6]/40 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      <span>Chèn URL ảnh</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Document Title Input Field */}
              <div className="pt-2 pb-4">
                <textarea
                  ref={(el) => {
                    inputRefs.current['doc-title'] = el;
                    autoResizeTextarea(el);
                  }}
                  onFocus={() => setFocusedBlockId('doc-title')}
                  value={title}
                  onInput={(e) => autoResizeTextarea(e.target)}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full bg-transparent resize-none overflow-hidden text-2xl md:text-3xl lg:text-4xl text-white font-display font-bold placeholder-[#9e8eb3] outline-none leading-tight tracking-tight focus:placeholder:opacity-30 transition-all ${
                    textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
                  }`}
                  placeholder="Nhập tiêu đề bài viết tại đây..."
                  rows="1"
                />
              </div>

              {/* Sa-pô / Abstract Lead Input */}
              <div className="pb-6">
                <div className="p-4 rounded-xl bg-[#231b36] shadow-inner border border-[#3c2f57] focus-within:border-[#4cd7f6]/60 transition-colors">
                  <textarea
                    ref={(el) => {
                      inputRefs.current['doc-summary'] = el;
                      autoResizeTextarea(el);
                    }}
                    onFocus={() => setFocusedBlockId('doc-summary')}
                    value={summary}
                    onInput={(e) => autoResizeTextarea(e.target)}
                    onChange={(e) => setSummary(e.target.value)}
                    className={`w-full bg-transparent resize-none overflow-hidden text-base text-[#f1eaff] italic placeholder-[#9e8eb3] outline-none leading-relaxed ${
                      textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
                    }`}
                    placeholder="Đoạn sa-pô giới thiệu tóm tắt bài viết (Excerpt)..."
                    rows="2"
                  />
                </div>
              </div>

              {/* SEQUENTIAL BLOCKS */}
              <div className="space-y-4">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="relative group/block">
                    {/* Render Block: HEADING */}
                    {block.type === 'heading' && (
                      <div className="flex items-center gap-2 pt-2 p-3 rounded-xl bg-[#231b36]/40 border border-[#3c2f57]/50 focus-within:border-[#4cd7f6] transition-colors">
                        <span className="text-[#ff5167] font-mono text-base font-bold select-none">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <input
                          ref={(el) => (inputRefs.current[block.id] = el)}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            setSelectedFormat(block.level || 'H2');
                          }}
                          value={block.text}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          className={`w-full bg-transparent ${
                            block.level === 'H1' ? 'text-2xl md:text-3xl' : block.level === 'H3' ? 'text-lg font-semibold' : 'text-xl'
                          } font-display font-bold text-white placeholder-[#9e8eb3] outline-none pb-1 transition-all ${
                            (block.align || textAlign) === 'center' ? 'text-center' : (block.align || textAlign) === 'right' ? 'text-right' : 'text-left'
                          }`}
                          style={{ color: block.color || undefined }}
                          placeholder={`Tiêu đề mục ${block.level || 'H2'}...`}
                        />
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="opacity-0 group-hover/block:opacity-100 p-1 text-[#ad8888] hover:text-[#ff5167] transition-all"
                          title="Xóa đề mục này"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    )}

                    {/* Render Block: PARAGRAPH */}
                    {block.type === 'paragraph' && (
                      <div className="relative p-3 rounded-xl bg-[#231b36]/40 border border-[#3c2f57]/50 hover:border-purple-500/40 focus-within:border-[#4cd7f6] transition-colors">
                        <textarea
                          ref={(el) => {
                            inputRefs.current[block.id] = el;
                            autoResizeTextarea(el);
                          }}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            setSelectedFormat('p');
                          }}
                          value={block.text}
                          onInput={(e) => autoResizeTextarea(e.target)}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          className={`w-full min-h-[44px] bg-transparent text-[#f1eaff] text-base leading-relaxed placeholder-[#9e8eb3] outline-none resize-none overflow-hidden font-body transition-all ${
                            block.bold || isBoldActive ? 'font-semibold' : 'font-normal'
                          } ${block.italic || isItalicActive ? 'italic' : ''} ${
                            block.underline || isUnderlineActive ? 'underline' : ''
                          } ${block.strikethrough || isStrikethroughActive ? 'line-through' : ''} ${
                            block.highlight || isHighlightActive ? 'bg-[#4cd7f6]/10 px-2 rounded' : ''
                          } ${
                            (block.align || textAlign) === 'center' ? 'text-center' : (block.align || textAlign) === 'right' ? 'text-right' : 'text-left'
                          }`}
                          style={{ color: block.color || undefined }}
                          placeholder="Nhập nội dung đoạn văn bản tại đây..."
                        />
                        {blocks.length > 1 && (
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 p-1 text-[#ad8888] hover:text-[#ff5167] transition-all"
                            title="Xóa đoạn này"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Render Block: LIST */}
                    {block.type === 'list' && (
                      <div className="my-3 p-4 rounded-xl bg-[#221e2a] border border-[#2c2835] relative">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2c2835] text-xs font-mono text-[#ad8888]">
                          <span>{block.listType === 'numbered' ? '🔢 Danh sách số' : '• Danh sách gạch đầu dòng'}</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="text-[#ad8888] hover:text-[#ff5167]"
                            title="Xóa danh sách"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(block.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-2">
                              <span className="text-[#ff5167] font-mono text-xs select-none">
                                {block.listType === 'numbered' ? `${itemIdx + 1}.` : '•'}
                              </span>
                              <input
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...block.items];
                                  newItems[itemIdx] = e.target.value;
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="w-full bg-transparent text-sm text-[#e8dff1] outline-none border-b border-white/5 focus:border-[#4cd7f6] pb-0.5"
                                placeholder="Nhập mục danh sách..."
                              />
                              <button
                                onClick={() => {
                                  const newItems = block.items.filter((_, i) => i !== itemIdx);
                                  updateBlock(block.id, { items: newItems.length > 0 ? newItems : [''] });
                                }}
                                className="text-[#ad8888] hover:text-[#ff5167] p-0.5"
                              >
                                <span className="material-symbols-outlined text-[14px]">remove_circle_outline</span>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}
                            className="text-xs text-[#4cd7f6] hover:underline pt-1 flex items-center gap-1 font-semibold"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            <span>Thêm mục</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Render Block: TABLE */}
                    {block.type === 'table' && (
                      <div className="my-4 rounded-xl overflow-hidden bg-[#221e2a] border border-[#2c2835] relative">
                        <div className="p-2 bg-[#1b1724] flex items-center justify-between border-b border-[#2c2835] text-xs font-mono text-[#4cd7f6]">
                          <span>📊 Bảng dữ liệu</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="text-[#ad8888] hover:text-[#ff5167]"
                            title="Xóa bảng"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <div className="p-3 overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-[#373340]">
                                {(block.headers || []).map((h, hIdx) => (
                                  <th key={hIdx} className="p-2 font-bold text-[#ffb3b5]">
                                    <input
                                      value={h}
                                      onChange={(e) => {
                                        const newHeaders = [...block.headers];
                                        newHeaders[hIdx] = e.target.value;
                                        updateBlock(block.id, { headers: newHeaders });
                                      }}
                                      className="bg-transparent w-full outline-none font-bold text-[#ffb3b5]"
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(block.rows || []).map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-[#2c2835] hover:bg-[#2c2835]/30">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 text-[#e8dff1]">
                                      <input
                                        value={cell}
                                        onChange={(e) => {
                                          const newRows = [...block.rows];
                                          newRows[rIdx][cIdx] = e.target.value;
                                          updateBlock(block.id, { rows: newRows });
                                        }}
                                        className="bg-transparent w-full outline-none text-[#e8dff1]"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-2 flex gap-3">
                            <button
                              onClick={() => {
                                const newRows = [...(block.rows || []), new Array(block.headers?.length || 3).fill('Dữ liệu mới')];
                                updateBlock(block.id, { rows: newRows });
                              }}
                              className="text-xs text-[#4cd7f6] hover:underline font-semibold"
                            >
                              + Thêm dòng
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Render Block: VIDEO */}
                    {block.type === 'video' && (
                      <div className="my-4 rounded-xl bg-[#221e2a] p-3 border border-[#2c2835] relative">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2c2835] text-xs font-mono text-[#4cd7f6]">
                          <span>🎬 Video Embed</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="text-[#ad8888] hover:text-[#ff5167]"
                            title="Xóa video"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2">
                          <iframe
                            src={block.url}
                            title="Video Player"
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                        <input
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          className="w-full text-center bg-transparent text-xs text-[#ad8888] italic outline-none"
                          placeholder="Chú thích video..."
                        />
                      </div>
                    )}

                    {/* Render Block: DIVIDER */}
                    {block.type === 'divider' && (
                      <div className="my-6 relative flex items-center justify-center group/div">
                        <div className="w-full border-t border-[#373340]"></div>
                        <div className="absolute bg-[#1e1a26] px-3 text-[#ad8888] text-xs font-mono flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                          <span>Đường phân cách</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="opacity-0 group-hover/div:opacity-100 ml-2 text-[#ff5167]"
                            title="Xóa phân cách"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Render Block: IN-LINE VISUAL IMAGE (INSERTED BETWEEN PARAGRAPHS) */}
                    {block.type === 'image' && (
                      <div className="my-4 rounded-2xl bg-[#221e2a] p-2 shadow-2xl border border-[#2c2835] relative group/img">
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#100c18]/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-lg opacity-90 group-hover/img:opacity-100 transition-opacity">
                          <span className="text-[10px] font-mono text-[#4cd7f6] px-1.5 py-0.5 rounded bg-[#2c2835]">
                            .webp
                          </span>
                          <button 
                            onClick={() => deleteBlock(block.id)}
                            className="p-1 rounded text-[#ad8888] hover:text-[#ff5167] hover:bg-[#2c2835] transition-colors" 
                            title="Xóa ảnh này"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>

                        {/* Visual Image Rendered */}
                        <div className="relative overflow-hidden rounded-xl bg-[#100c18]">
                          <img 
                            alt={block.caption || 'Ảnh minh họa WebP'} 
                            className="w-full max-h-[420px] object-cover rounded-xl shadow-md transition-transform duration-500 hover:scale-[1.01]" 
                            src={block.url} 
                          />
                        </div>

                        {/* Image Caption */}
                        <div className="mt-2 px-2 text-center">
                          <input 
                            value={block.caption}
                            onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                            className="w-full text-center bg-transparent text-xs text-[#ad8888] italic outline-none hover:text-[#e8dff1] focus:text-[#4cd7f6] transition-colors" 
                            placeholder="Nhập chú thích ảnh (.webp)..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Render Block: QUOTE */}
                    {block.type === 'quote' && (
                      <div className="my-4 pl-5 py-3 bg-[#161127] border-l-4 border-[#ff5167] rounded-r-xl relative">
                        <textarea
                          ref={(el) => {
                            inputRefs.current[block.id] = el;
                            autoResizeTextarea(el);
                          }}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            setSelectedFormat('quote');
                          }}
                          value={block.text}
                          onInput={(e) => autoResizeTextarea(e.target)}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          className="w-full bg-transparent text-base italic text-[#e8dff1] placeholder-[#ad8888]/40 outline-none resize-none overflow-hidden min-h-[44px]"
                          placeholder="Nội dung trích dẫn quan trọng..."
                        />
                        <input
                          value={block.author || ''}
                          onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                          className="w-full bg-transparent text-xs text-[#ffb3b5] placeholder-[#ad8888]/40 outline-none mt-1 font-semibold"
                          placeholder="— Tác giả trích dẫn"
                        />
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 p-1 text-[#ad8888] hover:text-[#ff5167] transition-all"
                          title="Xóa trích dẫn"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    )}

                    {/* Render Block: CODE */}
                    {block.type === 'code' && (
                      <div className="my-4 p-4 rounded-xl bg-[#100c18] border border-[#373340] relative">
                        <textarea
                          ref={(el) => {
                            inputRefs.current[block.id] = el;
                            autoResizeTextarea(el);
                          }}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            setSelectedFormat('code');
                          }}
                          value={block.code || block.text || ''}
                          onInput={(e) => autoResizeTextarea(e.target)}
                          onChange={(e) => updateBlock(block.id, { code: e.target.value, text: e.target.value })}
                          className="w-full min-h-[80px] bg-transparent text-xs font-mono text-[#4cd7f6] placeholder-[#ad8888]/40 outline-none resize-none overflow-hidden leading-relaxed"
                          placeholder="// Nhập mã nguồn tại đây..."
                        />
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 p-1 text-[#ad8888] hover:text-[#ff5167] transition-all"
                          title="Xóa khối code"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    )}

                    {/* IN-BETWEEN INSERTION BAR (Hover to show in-between actions) */}
                    <div className="flex items-center justify-center py-2 opacity-30 hover:opacity-100 transition-opacity my-1">
                      <div className="h-px bg-[#2c2835] flex-1"></div>
                      <div className="flex items-center gap-1.5 px-3 bg-[#1e1a26] py-0.5 rounded-full border border-[#373340] shadow-sm">
                        <button
                          onClick={() => triggerImageUploadAt(idx)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#4cd7f6] hover:text-white px-2 py-0.5 rounded hover:bg-[#2c2835] transition-colors"
                          title="Chèn hình ảnh vào đúng vị trí này"
                        >
                          <span className="material-symbols-outlined text-[14px]">add_photo_alternate</span>
                          <span>Chèn ảnh WebP</span>
                        </button>
                        <span className="text-[#373340]">•</span>
                        <button
                          onClick={() => insertBlockAt(idx, { id: `p-${Date.now()}`, type: 'paragraph', text: '' })}
                          className="text-[11px] font-medium text-[#ad8888] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#2c2835] transition-colors"
                        >
                          + Đoạn văn
                        </button>
                        <span className="text-[#373340]">•</span>
                        <button
                          onClick={() => insertBlockAt(idx, { id: `h-${Date.now()}`, type: 'heading', text: '' })}
                          className="text-[11px] font-medium text-[#ffb3b5] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#2c2835] transition-colors"
                        >
                          + Đề mục
                        </button>
                      </div>
                      <div className="h-px bg-[#2c2835] flex-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Bottom Status Footer */}
            <div className="mt-8 pt-4 border-t border-[#2c2835] flex flex-wrap items-center justify-between text-[#ad8888] text-xs font-medium">
              <div className="flex items-center gap-4">
                <span>Trạng thái: <strong className="text-emerald-400 font-semibold">{isPublic ? 'Sẵn sàng xuất bản' : 'Bản nháp khả dụng'}</strong></span>
                <span>Khối nội dung: <strong className="text-[#e8dff1] font-mono">{blocks.length} khối</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Đã kiểm tra chuẩn SEO &amp; Ảnh WebP</span>
              </div>
            </div>
          </article>
        </div>

        {/* RIGHT-HAND SETTINGS DRAWER / INSPECTOR */}
        <aside 
          className={`xl:col-span-4 flex flex-col gap-4 ${isDrawerOpen ? 'flex' : 'hidden xl:flex'}`} 
          id="inspector-drawer"
        >
          {/* Box 1: Quick Publishing & Scheduling */}
          <div className="rounded-2xl bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-xl border border-[#2c2835] relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2c2835]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb3b5] text-[20px]">tune</span>
                <h3 className="font-display font-bold text-sm text-[#e8dff1]">Cài đặt xuất bản</h3>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${isPublic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#ff5167]/10 text-[#ffb3b5]'}`}>
                {isPublic ? 'PUBLISHED' : 'DRAFT'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Visibility Switch */}
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#e8dff1]">Hiển thị công khai</span>
                  <span className="text-[11px] text-[#ad8888]">Ai cũng có thể truy cập bài viết này</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-[#373340] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff5167]"></div>
                </label>
              </div>

              {/* Publication Time */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#ad8888]">Lên lịch đăng bài</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#15111d] text-[#e8dff1] border border-[#2c2835]">
                  <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">calendar_today</span>
                  <input 
                    type="datetime-local" 
                    value={scheduleTime} 
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-transparent text-[#e8dff1] text-xs outline-none w-full font-mono" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Featured Cover Image */}
          <div className="rounded-2xl bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-xl border border-[#2c2835]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">image</span>
                <h3 className="font-display font-bold text-sm text-[#e8dff1]">Ảnh bìa đại diện (Cover .webp)</h3>
              </div>
              <button 
                onClick={() => coverFileInputRef.current?.click()}
                className="text-xs font-semibold text-[#ffb3b5] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">upload</span>
                <span>{coverImage ? 'Tải ảnh mới' : '+ Tải ảnh'}</span>
              </button>
            </div>

            {/* Thumbnail Preview */}
            {coverImage ? (
              <div className="relative group rounded-xl overflow-hidden bg-[#100c18] shadow-md border border-[#2c2835]">
                <img 
                  alt="Ảnh bìa bài viết" 
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={coverImage} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#100c18] via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#4cd7f6] bg-[#100c18]/80 backdrop-blur-md px-2 py-0.5 rounded">
                    WebP Format
                  </span>
                  <button 
                    onClick={() => setCoverImage('')}
                    className="p-1 rounded bg-[#2c2835]/90 text-[#ffb4ab] hover:bg-[#ff5167] hover:text-white transition-colors" 
                    title="Gỡ ảnh"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => coverFileInputRef.current?.click()}
                className="h-32 rounded-xl border border-dashed border-[#373340] hover:border-[#4cd7f6] flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#15111d]/50 group"
              >
                <span className="material-symbols-outlined text-3xl text-[#ad8888] group-hover:text-[#4cd7f6] transition-colors mb-1">
                  add_photo_alternate
                </span>
                <span className="text-xs text-[#ad8888] group-hover:text-white transition-colors">
                  Nhấp để tải ảnh bìa (.webp)
                </span>
              </div>
            )}
          </div>

          {/* Box 3: Taxonomy & Categorization */}
          <div className="rounded-2xl bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-xl border border-[#2c2835]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#ffb3b5] text-[20px]">category</span>
              <h3 className="font-display font-bold text-sm text-[#e8dff1]">Phân loại &amp; Thẻ tags</h3>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-semibold text-[#ad8888]">Danh mục chính</label>
              <div className="px-3 py-2 rounded-xl bg-[#15111d] text-[#e8dff1] border border-[#2c2835]">
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#15111d] text-[#e8dff1] text-xs outline-none w-full cursor-pointer"
                >
                  <option className="bg-[#15111d]" value="Công nghệ & Kiến trúc phần mềm">Công nghệ &amp; Kiến trúc phần mềm</option>
                  <option className="bg-[#15111d]" value="An ninh mạng & Zero-Trust">An ninh mạng &amp; Zero-Trust</option>
                  <option className="bg-[#15111d]" value="DevOps & Điện toán đám mây">DevOps &amp; Điện toán đám mây</option>
                  <option className="bg-[#15111d]" value="Fintech & Hệ thống chịu tải cao">Fintech &amp; Hệ thống chịu tải cao</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#ad8888]">Thẻ tìm kiếm (Tags)</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#15111d] min-h-[44px] border border-[#2c2835]">
                {tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2c2835] text-[#ffb3b5] text-xs font-medium"
                  >
                    {tag}
                    <span 
                      onClick={() => handleRemoveTag(tag)}
                      className="material-symbols-outlined text-[14px] cursor-pointer hover:text-white"
                    >
                      close
                    </span>
                  </span>
                ))}
                <input 
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="+ Thêm tag (Enter)..." 
                  className="bg-transparent text-[#e8dff1] text-xs outline-none px-1 flex-1 min-w-[100px]" 
                />
              </div>
            </div>
          </div>

          {/* Box 4: Search Engine Optimization (SEO) */}
          <div className="rounded-2xl bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-xl border border-[#2c2835]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]">travel_explore</span>
                <h3 className="font-display font-bold text-sm text-[#e8dff1]">Tối ưu SEO Google</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                {title.trim() ? 'Điểm 94/100' : 'Chưa nhập'}
              </span>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-semibold text-[#ad8888]">Đường dẫn tĩnh (Slug URL)</label>
              <div className="flex items-center px-3 py-2 rounded-xl bg-[#15111d] text-[#e8dff1] text-xs font-mono border border-[#2c2835] overflow-x-auto">
                <span className="text-[#ad8888] select-none">/blog/</span>
                <input 
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="duong-dan-tinh"
                  className="bg-transparent text-[#4cd7f6] outline-none flex-1 font-mono text-xs" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#ad8888]">Thẻ mô tả Meta Description</label>
                <span className="font-mono text-[10px] text-[#ad8888]">{metaDesc.length}/160 ký tự</span>
              </div>
              <textarea 
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="Mô tả tóm tắt cho công cụ tìm kiếm Google..."
                rows="3"
                className="p-3 rounded-xl bg-[#15111d] text-[#e8dff1] text-xs resize-none outline-none leading-relaxed border border-[#2c2835]" 
              />
            </div>
          </div>

          {/* Box 5: Live Telemetry & Writing Analytics */}
          <div className="rounded-2xl bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-xl border border-[#2c2835]">
            <h3 className="font-display font-bold text-sm text-[#e8dff1] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ddb7ff] text-[20px]">analytics</span>
              <span>Chỉ số tài liệu</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#15111d] flex flex-col border border-[#2c2835]">
                <span className="text-[11px] text-[#ad8888]">Số lượng từ</span>
                <span className="font-mono font-bold text-xl text-[#e8dff1] mt-0.5">{wordCount}</span>
                <span className="font-mono text-[10px] text-emerald-400 mt-0.5">
                  {wordCount > 300 ? 'Đạt chuẩn chuyên sâu' : 'Đang soạn thảo'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#15111d] flex flex-col border border-[#2c2835]">
                <span className="text-[11px] text-[#ad8888]">Thời gian đọc</span>
                <span className="font-mono font-bold text-xl text-[#4cd7f6] mt-0.5">
                  ~{readTimeMinutes}<span className="text-xs font-sans ml-1">phút</span>
                </span>
                <span className="font-mono text-[10px] text-[#ad8888] mt-0.5">Tương tác trực quan</span>
              </div>

              <div className="p-3 rounded-xl bg-[#15111d] flex flex-col border border-[#2c2835]">
                <span className="text-[11px] text-[#ad8888]">Cấu trúc đề mục</span>
                <span className="font-mono font-bold text-sm text-[#e8dff1] mt-0.5">{headingsCount} Mục H2</span>
                <span className="font-mono text-[10px] text-[#ffb3b5] mt-0.5">Mạch lạc</span>
              </div>

              <div className="p-3 rounded-xl bg-[#15111d] flex flex-col border border-[#2c2835]">
                <span className="text-[11px] text-[#ad8888]">Tài nguyên ảnh (.webp)</span>
                <span className="font-mono font-bold text-sm text-[#e8dff1] mt-0.5">{imageBlocksCount} Khối</span>
                <span className="font-mono text-[10px] text-[#4cd7f6] mt-0.5">WebP Tối ưu</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
