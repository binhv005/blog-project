import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';
import { compressImageFile, optimizeImageUrl, formatVideoEmbedUrl } from '../../utils/mediaOptimizer';
import OptimizedImage from '../common/OptimizedImage';
import PromptModal from '../common/PromptModal';
import ImageUploadModal from '../common/ImageUploadModal';

// Helper to convert legacy Markdown to HTML for initial block load
function mdToHtml(str) {
  if (!str) return '';
  return str
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-3 max-h-[420px] max-w-full rounded-xl object-cover block mx-auto shadow-lg" />')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)([^\*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#4cd7f6] hover:underline">$1</a>');
}

// Clean redundant/nested align tags if present
function cleanAlignTags(str) {
  if (!str) return '';
  let cleaned = str;
  while (/<div align="(?:left|center|right)"[^>]*>([\s\S]*?)<\/div>/i.test(cleaned)) {
    cleaned = cleaned.replace(/<div align="(?:left|center|right)"[^>]*>([\s\S]*?)<\/div>/gi, '$1');
  }
  cleaned = cleaned
    .replace(/<div align="(?:left|center|right)"[^>]*>/gi, '')
    .replace(/<\/div>/gi, '');
  return cleaned;
}

// Parse embedded images inside paragraph if any
function parseParagraphParts(rawText) {
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  const parts = [];
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(rawText || '')) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: rawText.substring(lastIdx, match.index) });
    }
    parts.push({ type: 'image', caption: match[1], url: match[2], raw: match[0] });
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < (rawText || '').length) {
    parts.push({ type: 'text', content: rawText.substring(lastIdx) });
  }
  if (parts.length === 0) {
    parts.push({ type: 'text', content: rawText || '' });
  }
  return parts;
}

// Helper to clean pasted HTML: strictly strip background colors, text colors, font overrides, and external styles
function cleanPastedHtml(html) {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove meta, style, script, link tags
    doc.querySelectorAll('meta, style, script, link').forEach((el) => el.remove());

    // Unwrap or clean legacy <font> tags
    doc.querySelectorAll('font').forEach((fontEl) => {
      const parent = fontEl.parentNode;
      if (parent) {
        while (fontEl.firstChild) {
          parent.insertBefore(fontEl.firstChild, fontEl);
        }
        parent.removeChild(fontEl);
      }
    });

    const allElements = doc.body.querySelectorAll('*');
    allElements.forEach((el) => {
      // 1. Remove background color and background styles
      el.style.backgroundColor = '';
      el.style.background = '';
      el.style.backgroundImage = '';
      el.style.backgroundClip = '';
      el.removeAttribute('bgcolor');

      // 2. Remove ALL text colors completely (no copied colors from external docs)
      el.style.color = '';
      el.removeAttribute('color');

      // 3. Remove default document font-family, font-size, and line-height overrides
      el.style.fontFamily = '';
      el.style.fontSize = '';
      el.style.lineHeight = '';

      // 4. Remove MS Word / Google Docs specific classes
      if (el.className) {
        const cleanedClass = el.className
          .split(' ')
          .filter((c) => !c.startsWith('Mso') && !c.startsWith('docs-') && !c.startsWith('Apple-'))
          .join(' ');
        if (cleanedClass) {
          el.className = cleanedClass;
        } else {
          el.removeAttribute('class');
        }
      }

      // 5. Ensure all images and figures are automatically centered
      if (el.tagName.toLowerCase() === 'img') {
        el.className = 'my-3 max-h-[420px] max-w-full rounded-xl object-cover block mx-auto shadow-lg text-center';
        el.removeAttribute('align');
      }
      if (el.tagName.toLowerCase() === 'figure') {
        el.className = 'my-4 text-center block mx-auto';
        el.removeAttribute('align');
      }

      // Remove style attribute if empty
      if (!el.getAttribute('style') || el.getAttribute('style').trim() === '') {
        el.removeAttribute('style');
      }
    });

    return doc.body.innerHTML || html;
  } catch (_) {
    return html;
  }
}

// Rich WYSIWYG ContentEditable Block Component
function RichEditableBlock({
  html,
  onChange,
  onFocus,
  onBlur,
  onSelectionChange,
  onPasteImage,
  placeholder,
  className = '',
  style = {},
  inputRef,
  onKeyDown,
  blockId
}) {
  const innerRef = useRef(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (inputRef) {
      if (typeof inputRef === 'function') {
        inputRef(innerRef.current);
      } else {
        inputRef.current = innerRef.current;
      }
    }
  }, [inputRef]);

  // Sync content when changed from outside (e.g. initial load, undo/redo)
  useEffect(() => {
    if (innerRef.current) {
      const current = innerRef.current.innerHTML;
      const target = html || '';
      if (current !== target) {
        innerRef.current.innerHTML = target;
      }
    }
  }, [html]);

  const handleInput = (e) => {
    if (isComposingRef.current) return;
    const newHtml = e.currentTarget.innerHTML;
    const isCleanEmpty = !newHtml || newHtml === '<br>' || newHtml === '<p><br></p>';
    onChange(isCleanEmpty ? '' : newHtml);
  };

  const handlePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    // 1. Check if an image file is in clipboard (e.g. screenshot, Snipping Tool, copied image)
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file && onPasteImage) {
            e.preventDefault();
            onPasteImage(file);
            return;
          }
        }
      }
    }

    const htmlData = clipboardData.getData('text/html');
    const plainText = clipboardData.getData('text/plain');

    e.preventDefault();
    if (htmlData && htmlData.trim()) {
      const cleanHtml = cleanPastedHtml(htmlData);
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (plainText) {
      document.execCommand('insertText', false, plainText);
    }

    if (innerRef.current) {
      const newHtml = innerRef.current.innerHTML;
      const isCleanEmpty = !newHtml || newHtml === '<br>' || newHtml === '<p><br></p>';
      onChange(isCleanEmpty ? '' : newHtml);
    }
  };

  return (
    <div
      ref={innerRef}
      contentEditable
      suppressContentEditableWarning
      data-block-id={blockId}
      onInput={handleInput}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onCompositionEnd={(e) => {
        isComposingRef.current = false;
        handleInput(e);
      }}
      onPaste={handlePaste}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        onFocus?.(e);
        onSelectionChange?.(e);
      }}
      onBlur={(e) => {
        onBlur?.(e);
      }}
      onKeyUp={onSelectionChange}
      onMouseUp={onSelectionChange}
      onSelect={onSelectionChange}
      className={`${className} outline-none cursor-text`}
      style={style}
      data-placeholder={placeholder}
    />
  );
}

// Convert File to Base64 Data URL to prevent transient blob ERR_FILE_NOT_FOUND issues
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Interactive Resizable Image Block Component
function ResizableImageBlock({
  block,
  onUpdate,
  onDelete,
  onReplace,
  onPaste,
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialWidthPx, setInitialWidthPx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  const currentWidth = block.width || '100%';
  const currentAlign = block.align || 'center';

  // Handle Drag to Resize width
  const handleMouseDownResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragStartX(e.clientX);
    if (containerRef.current) {
      setInitialWidthPx(containerRef.current.offsetWidth);
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement?.offsetWidth || window.innerWidth;
      const deltaX = (e.clientX - dragStartX) * 2;
      const newPx = Math.max(120, Math.min(parentWidth, initialWidthPx + deltaX));
      const percentage = Math.round((newPx / parentWidth) * 100);
      const clampedPercent = Math.max(20, Math.min(100, percentage));
      onUpdate({ width: `${clampedPercent}%` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dragStartX, initialWidthPx, onUpdate]);

  const alignClass =
    currentAlign === 'left'
      ? 'mr-auto items-start text-left'
      : currentAlign === 'right'
      ? 'ml-auto items-end text-right'
      : 'mx-auto items-center text-center';

  return (
    <div
      className={`my-6 max-w-full flex flex-col ${alignClass} group/img relative transition-all duration-200`}
      style={{ width: currentWidth }}
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image Container */}
      <div className="relative w-full rounded-2xl overflow-hidden group/preview">
        <OptimizedImage
          src={block.url}
          alt={block.caption || 'Ảnh minh họa WebP'}
          sizes="(max-width: 768px) 100vw, 1000px"
          containerClassName="w-full max-h-[520px] rounded-2xl"
          className="w-full max-h-[520px] object-cover rounded-2xl block mx-auto transition-transform duration-500 hover:scale-[1.005]"
        />

        {/* Action Buttons (top right on hover) */}
        <div className="absolute top-3 right-3 opacity-0 group-hover/preview:opacity-100 flex items-center gap-1.5 backdrop-blur-md bg-slate-900/80 p-1 rounded-xl shadow-md transition-all z-10">
          {onPaste && (
            <button
              type="button"
              onClick={onPaste}
              className="p-1.5 rounded-lg text-purple-300 hover:bg-purple-600 hover:text-white transition-all active:scale-95"
              title="Dán ảnh thay thế từ clipboard (Ctrl+V)"
            >
              <span className="material-symbols-outlined text-[16px]">content_paste</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReplace}
            className="p-1.5 rounded-lg text-sky-300 hover:bg-sky-600 hover:text-white transition-all active:scale-95"
            title="Đổi ảnh từ máy tính"
          >
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-all active:scale-95"
            title="Xóa ảnh"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>

        {/* Corner Drag Resize Handle (Bottom-Right) */}
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-black/70 hover:bg-[#ff5167] text-white flex items-center justify-center cursor-nwse-resize shadow-md backdrop-blur-md opacity-0 group-hover/preview:opacity-100 transition-opacity z-10"
          title="Kéo để thay đổi kích thước ảnh"
        >
          <span className="material-symbols-outlined text-[14px]">drag_pan</span>
        </div>
      </div>

      {/* Caption Input */}
      <div className="w-full mt-2 text-center">
        <input
          value={block.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          className="w-full text-center bg-transparent text-xs text-slate-500 dark:text-[#a898be] italic outline-none hover:text-slate-700 dark:hover:text-[#e8dff1] focus:text-sky-600 dark:focus:text-[#4cd7f6] transition-colors"
          placeholder="Nhập chú thích ảnh (.webp)..."
        />
      </div>
    </div>
  );
}

// Interactive Resizable Column Image Component (with vertical drag resize handle, aspect ratio presets, paste controls and quick actions)
function ColumnImageResizable({
  imageUrl,
  caption,
  imageHeight,
  onUpdate,
  onUploadClick,
  onPasteClick,
  onDelete,
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialHeightPx, setInitialHeightPx] = useState(0);
  const containerRef = useRef(null);

  const isCustomPx = Boolean(imageHeight && typeof imageHeight === 'string' && imageHeight.includes('px'));
  const currentRatio = !imageHeight || imageHeight === 'auto' ? 'auto' : imageHeight;

  const getContainerStyle = () => {
    if (isCustomPx) return { height: imageHeight };
    if (imageHeight === '16:9') return { aspectRatio: '16/9' };
    if (imageHeight === '4:3') return { aspectRatio: '4/3' };
    if (imageHeight === '1:1') return { aspectRatio: '1/1' };
    return { aspectRatio: '4/3' }; // Default harmonious proportional ratio
  };

  const handleMouseDownResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragStartY(e.clientY);
    if (containerRef.current) {
      setInitialHeightPx(containerRef.current.offsetHeight);
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - dragStartY;
      const newHeight = Math.max(100, Math.min(800, initialHeightPx + deltaY));
      onUpdate({ height: `${newHeight}px` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dragStartY, initialHeightPx, onUpdate]);

  return (
    <div className="relative group/colimg flex flex-col items-center w-full">
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden transition-all duration-200"
        style={getContainerStyle()}
      >
        <OptimizedImage
          src={imageUrl}
          alt={caption || 'Ảnh cột'}
          containerClassName="w-full h-full rounded-2xl"
          className="w-full h-full object-cover rounded-2xl block mx-auto"
        />

        {/* Action & Aspect Ratio Controls Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/colimg:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              onClick={onUploadClick}
              className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md active:scale-95 transition-all"
              title="Đổi ảnh từ máy tính"
            >
              <span className="material-symbols-outlined text-[14px]">upload</span>
              <span>Đổi</span>
            </button>
            {onPasteClick && (
              <button
                type="button"
                onClick={onPasteClick}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md active:scale-95 transition-all"
                title="Dán ảnh từ bộ nhớ tạm (Clipboard / Ctrl+V)"
              >
                <span className="material-symbols-outlined text-[14px]">content_paste</span>
                <span>Dán</span>
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs shadow-md active:scale-95 transition-all"
              title="Xóa ảnh"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </div>

          {/* Quick Aspect Ratio Presets */}
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10 text-[10px] text-white">
            <button
              type="button"
              onClick={() => onUpdate({ height: 'auto' })}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                currentRatio === 'auto' && !isCustomPx ? 'bg-rose-500 text-white' : 'hover:bg-white/20 text-slate-200'
              }`}
              title="Tự động cân đối tỷ lệ"
            >
              Tự động
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ height: '4:3' })}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                currentRatio === '4:3' ? 'bg-rose-500 text-white' : 'hover:bg-white/20 text-slate-200'
              }`}
              title="Tỷ lệ 4:3"
            >
              4:3
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ height: '16:9' })}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                currentRatio === '16:9' ? 'bg-rose-500 text-white' : 'hover:bg-white/20 text-slate-200'
              }`}
              title="Tỷ lệ 16:9"
            >
              16:9
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ height: '1:1' })}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                currentRatio === '1:1' ? 'bg-rose-500 text-white' : 'hover:bg-white/20 text-slate-200'
              }`}
              title="Tỷ lệ vuông 1:1"
            >
              1:1
            </button>
            {isCustomPx && (
              <button
                type="button"
                onClick={() => onUpdate({ height: 'auto' })}
                className="px-1.5 py-0.5 rounded font-medium text-amber-300 hover:bg-white/20 flex items-center gap-0.5"
                title="Khôi phục về tỷ lệ tự động"
              >
                <span className="material-symbols-outlined text-[11px]">restart_alt</span>
                <span>{imageHeight}</span>
              </button>
            )}
          </div>
        </div>

        {/* Drag Resize Handle (Bottom-Right) */}
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-black/70 hover:bg-[#ff5167] text-white flex items-center justify-center cursor-ns-resize shadow-md backdrop-blur-md opacity-0 group-hover/colimg:opacity-100 transition-opacity z-20"
          title="Kéo lên/xuống để chỉnh chiều cao ảnh"
        >
          <span className="material-symbols-outlined text-[14px]">height</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminEditor({ postToEdit, onExit, onNavigate }) {
  const { createPost, updatePost, selectPost, temporaryPreviewPost, setTemporaryPreviewPost, clearPreviewPost, posts } = useBlog();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const columnFileInputRef = useRef(null);
  const replaceImageFileInputRef = useRef(null);
  const [replaceTargetBlockId, setReplaceTargetBlockId] = useState(null);
  const [columnUploadTarget, setColumnUploadTarget] = useState(null); // { blockId, side: 'left' | 'right' }
  const titleTextareaRef = useRef(null);
  const newCategoryInputRef = useRef(null);
  const [targetBlockIndex, setTargetBlockIndex] = useState(null);

  // Synchronous cursor tracking refs to guarantee inserting at the exact active block / cursor location
  const targetBlockIndexRef = useRef(null);
  const lastActiveIndexRef = useRef(0);
  const splitContextRef = useRef(null);

  // Selection ref for restoring caret when closing/submitting modals
  const savedSelectionRef = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Helper to reliably detect cursor position, highlighted text & split point inside active block
  const captureCursorContext = () => {
    const selection = window.getSelection();
    let blockId = focusedBlockId;
    let splitData = null;
    let selectedHtml = '';

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!selection.isCollapsed) {
        const cloned = range.cloneContents();
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(cloned);
        selectedHtml = tempDiv.innerHTML;
      }

      let container = range.commonAncestorContainer;
      if (container && container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
      }
      const blockEl = container?.closest?.('[data-block-id]');
      if (blockEl) {
        const foundId = blockEl.getAttribute('data-block-id');
        if (foundId) blockId = foundId;
        try {
          const rangeBefore = range.cloneRange();
          rangeBefore.selectNodeContents(blockEl);
          rangeBefore.setEnd(range.startContainer, range.startOffset);
          const beforeContents = rangeBefore.cloneContents();
          const divBefore = document.createElement('div');
          divBefore.appendChild(beforeContents);

          const rangeAfter = range.cloneRange();
          rangeAfter.selectNodeContents(blockEl);
          rangeAfter.setStart(range.endContainer, range.endOffset);
          const afterContents = rangeAfter.cloneContents();
          const divAfter = document.createElement('div');
          divAfter.appendChild(afterContents);

          splitData = {
            beforeText: divBefore.innerHTML,
            afterText: divAfter.innerHTML
          };
        } catch (_) { }
      }
    }

    let idx = -1;
    if (blockId) {
      idx = blocks.findIndex((b) => b.id === blockId);
    }
    if (idx === -1) {
      idx = (lastActiveIndexRef.current >= 0 && lastActiveIndexRef.current < blocks.length)
        ? lastActiveIndexRef.current
        : 0;
    }
    return { blockId, blockIdx: idx, splitData, selectedHtml };
  };

  // Custom Prompt Modal State
  const [promptModal, setPromptModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    placeholder: '',
    defaultValue: '',
    confirmText: 'Xác nhận',
    icon: 'link',
    iconColor: 'sky',
    onConfirm: () => { }
  });

  const openPrompt = ({
    title,
    description,
    placeholder = 'https://...',
    defaultValue = '',
    confirmText = 'Xác nhận',
    icon = 'link',
    iconColor = 'sky',
    onConfirm
  }) => {
    setPromptModal({
      isOpen: true,
      title,
      description,
      placeholder,
      defaultValue,
      confirmText,
      icon,
      iconColor,
      onConfirm: (val) => {
        setPromptModal((prev) => ({ ...prev, isOpen: false }));
        onConfirm(val);
      }
    });
  };

  const closePrompt = () => {
    setPromptModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Cover Image Upload State for Inline Black Card Loader
  const [coverUploadState, setCoverUploadState] = useState(null);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'link' | 'image' | 'video' | 'table'
  const [promptValue, setPromptValue] = useState('');

  // Publish Success Modal State
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [publishedPostInfo, setPublishedPostInfo] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Compute effective post by prioritizing active preview working draft if available
  const effectivePost = useMemo(() => {
    if (temporaryPreviewPost) {
      if (postToEdit) {
        if (
          temporaryPreviewPost.id === postToEdit.id ||
          temporaryPreviewPost.originalPostId === postToEdit.id ||
          temporaryPreviewPost.slug === postToEdit.slug
        ) {
          return { ...postToEdit, ...temporaryPreviewPost };
        }
      } else {
        // New post preview draft
        if (!temporaryPreviewPost.isEditingExisting || temporaryPreviewPost.id?.startsWith('preview-')) {
          return temporaryPreviewPost;
        }
      }
    }
    return postToEdit;
  }, [temporaryPreviewPost, postToEdit]);

  // Document State
  const [title, setTitle] = useState(effectivePost?.title || '');
  const [summary, setSummary] = useState(effectivePost?.summary || effectivePost?.sapo || '');
  const [category, setCategory] = useState(effectivePost?.category || 'Công nghệ & Kiến trúc phần mềm');
  const [authorName, setAuthorName] = useState(effectivePost?.authorName || effectivePost?.author?.name || 'Alex Vũ (Super Admin)');
  const [coverImage, setCoverImage] = useState(effectivePost?.coverImage || '');
  const [slug, setSlug] = useState(effectivePost?.slug || '');
  const [metaDesc, setMetaDesc] = useState(effectivePost?.metaDesc || effectivePost?.summary || effectivePost?.sapo || '');
  const [tags, setTags] = useState(effectivePost?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('dudi_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Auto-focus input when opened
  useEffect(() => {
    if (isAddingCategory && newCategoryInputRef.current) {
      newCategoryInputRef.current.focus();
    }
  }, [isAddingCategory]);

  const allCategories = useMemo(() => {
    const fromPosts = (posts || [])
      .map((p) => p.category)
      .filter((c) => c && typeof c === 'string' && c.trim().length > 0);
    const set = new Set([
      ...fromPosts,
      ...customCategories,
      ...(effectivePost?.category ? [effectivePost.category] : [])
    ]);
    return Array.from(set).sort();
  }, [posts, customCategories, effectivePost]);

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('dudi_custom_categories', JSON.stringify(updated));
      } catch (_) { }
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
    toast.success(`Đã chọn danh mục mới: "${trimmed}"`);
  };

  // Initial Sequential Blocks
  const getInitialBlocks = () => {
    if (effectivePost?.blocks && Array.isArray(effectivePost.blocks) && effectivePost.blocks.length > 0) {
      return effectivePost.blocks.map((b) => {
        if (b.type === 'columns') {
          return {
            ...b,
            leftText: mdToHtml(cleanAlignTags(b.leftText || '')),
            rightText: mdToHtml(cleanAlignTags(b.rightText || ''))
          };
        }
        let text = b.text || '';
        if (/<div align=/i.test(text)) {
          text = cleanAlignTags(text);
        }
        return { ...b, text: mdToHtml(text) };
      });
    }
    if (effectivePost?.content && Array.isArray(effectivePost.content)) {
      const generated = [];
      effectivePost.content.forEach((sec, idx) => {
        if (sec.heading) {
          generated.push({ id: `h-${idx}-${Date.now()}`, type: 'heading', text: mdToHtml(cleanAlignTags(sec.heading)) });
        }
        if (sec.text) {
          generated.push({ id: `p-${idx}-${Date.now()}`, type: 'paragraph', text: mdToHtml(cleanAlignTags(sec.text)) });
        }
        if (sec.quote) {
          generated.push({ id: `q-${idx}-${Date.now()}`, type: 'quote', text: mdToHtml(cleanAlignTags(sec.quote)), author: sec.quoteAuthor || '' });
        }
      });
      if (effectivePost.images && effectivePost.images.length > 0) {
        effectivePost.images.forEach((img, imgIdx) => {
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
  const [isPublic, setIsPublic] = useState(
    effectivePost?.isPublic !== undefined
      ? effectivePost.isPublic
      : (effectivePost ? effectivePost.status !== 'draft' : true)
  );
  const [scheduleTime, setScheduleTime] = useState(
    new Date(Date.now() + 3600 * 1000 * 24).toISOString().slice(0, 16)
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('H2');

  // History State for Undo / Redo
  const [history, setHistory] = useState([getInitialBlocks()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Saving lock state to prevent multi-clicking publish
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  // Active focus & selection tracking
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const inputRefs = useRef({});

  // Toolbar formatting active states
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isStrikethroughActive, setIsStrikethroughActive] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState('16');
  const [selectedTextColor, setSelectedTextColor] = useState(null);
  const [textAlign, setTextAlign] = useState('left'); // 'left' | 'center' | 'right'
  const [isBulletListActive, setIsBulletListActive] = useState(false);
  const [isNumberedListActive, setIsNumberedListActive] = useState(false);
  const [isQuoteActive, setIsQuoteActive] = useState(false);
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [isLinkActive, setIsLinkActive] = useState(false);

  // Custom Toolbar Dropdowns State (prevents losing text selection on click)
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [isFontSizeDropdownOpen, setIsFontSizeDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [customColorHex, setCustomColorHex] = useState('#ff5167');
  const [selectedLineHeight, setSelectedLineHeight] = useState('1.6');
  const [isLineHeightDropdownOpen, setIsLineHeightDropdownOpen] = useState(false);
  const formatDropdownRef = useRef(null);
  const fontSizeDropdownRef = useRef(null);
  const colorPickerRef = useRef(null);
  const lineHeightDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target)) {
        setIsFormatDropdownOpen(false);
      }
      if (fontSizeDropdownRef.current && !fontSizeDropdownRef.current.contains(e.target)) {
        setIsFontSizeDropdownOpen(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setIsColorPickerOpen(false);
      }
      if (lineHeightDropdownRef.current && !lineHeightDropdownRef.current.contains(e.target)) {
        setIsLineHeightDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Compute live word count & reading time
  const fullText = `${title} ${summary} ${blocks.map((b) => (b.type === 'columns' ? `${b.leftText || ''} ${b.rightText || ''}` : b.text || '')).join(' ')}`.replace(/<[^>]+>/g, '').trim();
  const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMinutes = wordCount > 0 ? (wordCount / 200).toFixed(1) : '0';
  const headingsCount = blocks.filter((b) => b.type === 'heading').length;
  const imageBlocksCount = blocks.filter((b) => b.type === 'image').length + (coverImage ? 1 : 0);

  // Update active states of toolbar based on caret / selection position
  const updateToolbarActiveStates = (blockId) => {
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const strike = document.queryCommandState('strikeThrough');

      setIsBoldActive(bold);
      setIsItalicActive(italic);
      setIsUnderlineActive(underline);
      setIsStrikethroughActive(strike);

      // Check font size, color, alignment, link & heading format of current selection / caret
      const selection = window.getSelection();
      let currentAlign = 'left';
      let detectedFormat = null;
      let detectedColor = null;
      let isLink = false;

      if (selection && selection.rangeCount > 0) {
        if (!selection.isCollapsed) {
          savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        }
        let node = selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        if (node && window.getComputedStyle) {
          try {
            const computed = window.getComputedStyle(node);
            if (computed && computed.fontSize) {
              const parsed = Math.round(parseFloat(computed.fontSize));
              if (parsed && parsed >= 8 && parsed <= 120) {
                setSelectedFontSize(String(parsed));
              }
            }
            if (computed && computed.lineHeight) {
              const parsedLh = parseFloat(computed.lineHeight);
              const fontSize = parseFloat(computed.fontSize);
              if (parsedLh && fontSize) {
                const ratio = (parsedLh / fontSize).toFixed(1);
                const match = LINE_HEIGHT_OPTIONS.find((o) => o.value === ratio || Math.abs(parseFloat(o.value) - parseFloat(ratio)) < 0.1);
                if (match) {
                  setSelectedLineHeight(match.value);
                }
              }
            }
          } catch (_) { }
        }
        while (node && node.getAttribute && !node.getAttribute('contenteditable')) {
          const styleAlign = node.style?.textAlign;
          const attrAlign = node.getAttribute('align');
          if (!currentAlign || currentAlign === 'left') {
            if (styleAlign || attrAlign) {
              currentAlign = (styleAlign || attrAlign).toLowerCase();
            }
          }

          if (!detectedColor) {
            if (node.style && node.style.color) {
              detectedColor = node.style.color;
            } else if (node.tagName?.toLowerCase() === 'font' && node.getAttribute('color')) {
              detectedColor = node.getAttribute('color');
            }
          }

          const tag = node.tagName?.toLowerCase();
          if (tag === 'a') {
            isLink = true;
          }

          if (!detectedFormat) {
            if (tag === 'h1') {
              detectedFormat = 'H1';
            } else if (tag === 'h2') {
              detectedFormat = 'H2';
            } else if (tag === 'h3') {
              detectedFormat = 'H3';
            } else if (tag === 'blockquote') {
              detectedFormat = 'quote';
            } else if (tag === 'code' || tag === 'pre') {
              detectedFormat = 'code';
            }
          }

          node = node.parentElement;
        }
      }

      setSelectedTextColor(detectedColor || null);
      setIsBulletListActive(document.queryCommandState('insertUnorderedList'));
      setIsNumberedListActive(document.queryCommandState('insertOrderedList'));
      setIsQuoteActive(detectedFormat === 'quote');
      setIsCodeActive(detectedFormat === 'code');
      setIsLinkActive(isLink);

      setTextAlign(currentAlign || 'left');

      if (detectedFormat) {
        setSelectedFormat(detectedFormat);
      } else {
        const targetId = blockId || focusedBlockId;
        const currentBlock = blocks.find((b) => b.id === targetId);
        if (currentBlock) {
          if (currentBlock.type === 'heading') {
            setSelectedFormat(currentBlock.level || 'H2');
          } else if (currentBlock.type === 'quote') {
            setSelectedFormat('quote');
          } else if (currentBlock.type === 'code') {
            setSelectedFormat('code');
          } else {
            setSelectedFormat('p');
          }
        }
      }
    } catch (_) { }
  };

  // Push to history on meaningful block change
  const pushHistory = (newBlocks) => {
    const snapshot = JSON.parse(JSON.stringify(newBlocks));
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      updated.push(snapshot);
      if (updated.length > 50) updated.shift();
      return updated;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const snapshot = JSON.parse(JSON.stringify(history[prevIdx]));
      setHistoryIndex(prevIdx);
      setBlocks(snapshot);

      // Immediately update DOM of all active editable blocks
      snapshot.forEach((b) => {
        if (inputRefs.current[b.id]) {
          inputRefs.current[b.id].innerHTML = b.text || '';
        }
        if (inputRefs.current[`${b.id}-left`]) {
          inputRefs.current[`${b.id}-left`].innerHTML = b.leftText || '';
        }
        if (inputRefs.current[`${b.id}-right`]) {
          inputRefs.current[`${b.id}-right`].innerHTML = b.rightText || '';
        }
      });
      updateToolbarActiveStates();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const snapshot = JSON.parse(JSON.stringify(history[nextIdx]));
      setHistoryIndex(nextIdx);
      setBlocks(snapshot);

      // Immediately update DOM of all active editable blocks
      snapshot.forEach((b) => {
        if (inputRefs.current[b.id]) {
          inputRefs.current[b.id].innerHTML = b.text || '';
        }
        if (inputRefs.current[`${b.id}-left`]) {
          inputRefs.current[`${b.id}-left`].innerHTML = b.leftText || '';
        }
        if (inputRefs.current[`${b.id}-right`]) {
          inputRefs.current[`${b.id}-right`].innerHTML = b.rightText || '';
        }
      });
      updateToolbarActiveStates();
    }
  };

  // Global Keyboard Shortcuts for Undo & Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // Block management functions
  const updateBlock = (id, newFields) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...newFields } : b));
      return updated;
    });
  };

  const deleteBlock = (id) => {
    const prevScrollY = window.scrollY;
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      const res = filtered.length > 0 ? filtered : [{ id: `b-${Date.now()}`, type: 'paragraph', text: '' }];
      pushHistory(res);
      return res;
    });
    requestAnimationFrame(() => {
      window.scrollTo({ top: prevScrollY, behavior: 'instant' });
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
    if (focusedBlockId) {
      const idx = blocks.findIndex((b) => b.id === focusedBlockId);
      if (idx !== -1) return idx;
    }
    if (lastActiveIndexRef.current >= 0 && lastActiveIndexRef.current < blocks.length) {
      return lastActiveIndexRef.current;
    }
    return 0;
  };

  const syncActiveBlockContent = () => {
    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    if (currentBlock && inputRefs.current[currentBlock.id]) {
      const el = inputRefs.current[currentBlock.id];
      const newHtml = el.innerHTML;
      const isCleanEmpty = !newHtml || newHtml === '<br>' || newHtml === '<p><br></p>';
      const updatedText = isCleanEmpty ? '' : newHtml;
      const updated = blocks.map((b) => (b.id === currentBlock.id ? { ...b, text: updatedText } : b));
      setBlocks(updated);
      return updated;
    }
    return blocks;
  };

  // Format Dropdown (H1, H2, H3, p, quote, code) - Strictly apply only to the highlighted text
  const handleFormatDropdownChange = (val) => {
    setSelectedFormat(val);
    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (savedSelectionRef.current) {
        restoreSelection();
        selection = window.getSelection();
      }
    }

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      // Check if selection is already inside a heading or block element
      let parent = range.commonAncestorContainer;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentElement;
      }

      let headingParent = null;
      let curr = parent;
      while (curr && curr.getAttribute && !curr.getAttribute('contenteditable')) {
        const tag = curr.tagName.toLowerCase();
        if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'blockquote' || tag === 'pre' || tag === 'code') {
          headingParent = curr;
          break;
        }
        curr = curr.parentElement;
      }

      if (val === 'p') {
        if (headingParent) {
          const parentOfHeading = headingParent.parentNode;
          while (headingParent.firstChild) {
            parentOfHeading.insertBefore(headingParent.firstChild, headingParent);
          }
          parentOfHeading.removeChild(headingParent);
        } else {
          document.execCommand('formatBlock', false, '<p>');
        }
      } else if (val === 'H1' || val === 'H2' || val === 'H3') {
        const tag = val.toLowerCase();
        if (headingParent) {
          const newEl = document.createElement(tag);
          if (val === 'H1') newEl.className = 'text-2xl md:text-3xl font-bold font-display text-white my-2';
          else if (val === 'H2') newEl.className = 'text-xl md:text-2xl font-bold font-display text-white my-2';
          else if (val === 'H3') newEl.className = 'text-lg font-semibold font-display text-white my-1';

          while (headingParent.firstChild) {
            newEl.appendChild(headingParent.firstChild);
          }
          headingParent.parentNode.replaceChild(newEl, headingParent);

          const newRange = document.createRange();
          newRange.selectNodeContents(newEl);
          selection.removeAllRanges();
          selection.addRange(newRange);
          savedSelectionRef.current = newRange.cloneRange();
        } else {
          const newEl = document.createElement(tag);
          if (val === 'H1') newEl.className = 'text-2xl md:text-3xl font-bold font-display text-white my-2';
          else if (val === 'H2') newEl.className = 'text-xl md:text-2xl font-bold font-display text-white my-2';
          else if (val === 'H3') newEl.className = 'text-lg font-semibold font-display text-white my-1';

          try {
            newEl.appendChild(range.extractContents());
            range.insertNode(newEl);
            const newRange = document.createRange();
            newRange.selectNodeContents(newEl);
            selection.removeAllRanges();
            selection.addRange(newRange);
            savedSelectionRef.current = newRange.cloneRange();
          } catch (_) {
            document.execCommand('formatBlock', false, `<${tag}>`);
          }
        }
      } else if (val === 'quote') {
        const quoteEl = document.createElement('blockquote');
        quoteEl.className = 'my-3 pl-4 border-l-4 border-[#ff5167] italic text-[#e8dff1]';
        try {
          quoteEl.appendChild(range.extractContents());
          range.insertNode(quoteEl);
          const newRange = document.createRange();
          newRange.selectNodeContents(quoteEl);
          selection.removeAllRanges();
          selection.addRange(newRange);
          savedSelectionRef.current = newRange.cloneRange();
        } catch (_) {
          document.execCommand('formatBlock', false, '<blockquote>');
        }
      } else if (val === 'code') {
        const codeEl = document.createElement('code');
        codeEl.className = 'bg-[#2c2835] text-[#ff5167] px-1.5 py-0.5 rounded text-sm font-mono';
        try {
          codeEl.appendChild(range.extractContents());
          range.insertNode(codeEl);
          const newRange = document.createRange();
          newRange.selectNodeContents(codeEl);
          selection.removeAllRanges();
          selection.addRange(newRange);
          savedSelectionRef.current = newRange.cloneRange();
        } catch (_) { }
      }
      updateToolbarActiveStates();
      const updated = syncActiveBlockContent();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần đặt làm tiêu đề');
    }
  };

  // Typography Formatting Handlers (Word-like WYSIWYG)
  const handleBoldToggle = () => {
    document.execCommand('bold', false, null);
    updateToolbarActiveStates();
    const updated = syncActiveBlockContent();
    pushHistory(updated);
  };

  const handleItalicToggle = () => {
    document.execCommand('italic', false, null);
    updateToolbarActiveStates();
    const updated = syncActiveBlockContent();
    pushHistory(updated);
  };

  const handleUnderlineToggle = () => {
    document.execCommand('underline', false, null);
    updateToolbarActiveStates();
    const updated = syncActiveBlockContent();
    pushHistory(updated);
  };

  const handleStrikethroughToggle = () => {
    document.execCommand('strikeThrough', false, null);
    updateToolbarActiveStates();
    const updated = syncActiveBlockContent();
    pushHistory(updated);
  };

  const FONT_SIZES = [9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 60, 72];

  const applyFontSize = (sizePx) => {
    const size = parseInt(sizePx, 10);
    if (isNaN(size) || size < 8 || size > 120) return;
    setSelectedFontSize(String(size));

    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (savedSelectionRef.current) {
        restoreSelection();
        selection = window.getSelection();
      }
    }

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.style.lineHeight = '1.35';

      try {
        const extracted = range.extractContents();
        // Remove redundant inner font-size spans
        if (extracted.querySelectorAll) {
          const innerSpans = extracted.querySelectorAll('span[style*="font-size"]');
          innerSpans.forEach((s) => {
            s.style.fontSize = '';
            if (!s.getAttribute('style') || s.getAttribute('style').trim() === '') {
              while (s.firstChild) {
                s.parentNode.insertBefore(s.firstChild, s);
              }
              s.parentNode.removeChild(s);
            }
          });
        }
        span.appendChild(extracted);
        range.insertNode(span);

        // Keep the selection highlighted on the newly styled text
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
        savedSelectionRef.current = newRange.cloneRange();
      } catch (_) {
        document.execCommand('fontSize', false, '3');
      }

      updateToolbarActiveStates();
      const updated = syncActiveBlockContent();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần đổi cỡ chữ');
    }
  };

  const handleIncreaseFontSize = () => {
    const current = parseInt(selectedFontSize, 10) || 16;
    const next = FONT_SIZES.find((s) => s > current) || (current + 2);
    applyFontSize(next);
  };

  const handleDecreaseFontSize = () => {
    const current = parseInt(selectedFontSize, 10) || 16;
    const prev = [...FONT_SIZES].reverse().find((s) => s < current) || Math.max(9, current - 2);
    applyFontSize(prev);
  };

  const COLOR_PALETTE = [
    { name: 'Trắng', value: '#ffffff' },
    { name: 'Đen', value: '#0f172a' },
    { name: 'Xám', value: '#94a3b8' },
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Hồng Neon (Brand)', value: '#ff5167' },
    { name: 'Cam rực rỡ', value: '#f97316' },
    { name: 'Hổ phách', value: '#f59e0b' },
    { name: 'Vàng sáng', value: '#eab308' },
    { name: 'Xanh lá chuối', value: '#84cc16' },
    { name: 'Xanh ngọc lục', value: '#10b981' },
    { name: 'Xanh ngọc Teal', value: '#14b8a6' },
    { name: 'Cyan Neon (Brand)', value: '#4cd7f6' },
    { name: 'Xanh da trời', value: '#0ea5e9' },
    { name: 'Xanh dương đậm', value: '#3b82f6' },
    { name: 'Chàm Indigo', value: '#6366f1' },
    { name: 'Tím Violet', value: '#8b5cf6' },
    { name: 'Tím Fuchsia', value: '#d946ef' },
    { name: 'Hồng Rose', value: '#f43f5e' },
  ];

  const applyTextColor = (color) => {
    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (savedSelectionRef.current) {
        restoreSelection();
        selection = window.getSelection();
      }
    }

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      if (!color || color === 'default') {
        try {
          const extracted = range.extractContents();
          if (extracted.querySelectorAll) {
            const innerSpans = extracted.querySelectorAll('span[style*="color"], font[color]');
            innerSpans.forEach((s) => {
              s.style.color = '';
              s.removeAttribute('color');
              if (!s.getAttribute('style') || s.getAttribute('style').trim() === '') {
                while (s.firstChild) {
                  s.parentNode.insertBefore(s.firstChild, s);
                }
                s.parentNode.removeChild(s);
              }
            });
          }
          const span = document.createElement('span');
          span.style.color = 'inherit';
          span.appendChild(extracted);
          range.insertNode(span);

          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
          savedSelectionRef.current = newRange.cloneRange();
        } catch (_) {
          document.execCommand('foreColor', false, 'inherit');
        }
        setSelectedTextColor(null);
      } else {
        const span = document.createElement('span');
        span.style.color = color;

        try {
          const extracted = range.extractContents();
          if (extracted.querySelectorAll) {
            const innerSpans = extracted.querySelectorAll('span[style*="color"], font[color]');
            innerSpans.forEach((s) => {
              s.style.color = '';
              s.removeAttribute('color');
              if (!s.getAttribute('style') || s.getAttribute('style').trim() === '') {
                while (s.firstChild) {
                  s.parentNode.insertBefore(s.firstChild, s);
                }
                s.parentNode.removeChild(s);
              }
            });
          }
          span.appendChild(extracted);
          range.insertNode(span);

          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
          savedSelectionRef.current = newRange.cloneRange();
        } catch (_) {
          document.execCommand('foreColor', false, color);
        }
        setSelectedTextColor(color);
      }

      updateToolbarActiveStates();
      const updated = syncActiveBlockContent();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần đổi màu chữ');
    }
  };

  const LINE_HEIGHT_OPTIONS = [
    { value: '1.0', label: '1.0' },
    { value: '1.2', label: '1.2' },
    { value: '1.4', label: '1.4' },
    { value: '1.6', label: '1.6' },
    { value: '1.8', label: '1.8' },
    { value: '2.0', label: '2.0' },
    { value: '2.5', label: '2.5' },
  ];

  const applyLineHeight = (val) => {
    setSelectedLineHeight(String(val));
    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (savedSelectionRef.current) {
        restoreSelection();
        selection = window.getSelection();
      }
    }

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.lineHeight = String(val);
      span.style.display = 'inline-block';

      try {
        const extracted = range.extractContents();
        span.appendChild(extracted);
        range.insertNode(span);

        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
        savedSelectionRef.current = newRange.cloneRange();
      } catch (_) { }
    }

    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    if (currentBlock) {
      updateBlock(currentBlock.id, { lineHeight: String(val) });
    }

    updateToolbarActiveStates();
    const updated = syncActiveBlockContent();
    pushHistory(updated);
  };

  // Alignment formatting (Apply strictly to the highlighted selection and record to history)
  const handleAlignmentChange = (alignDir) => {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      // Check if selection is inside an alignment element
      let parent = range.commonAncestorContainer;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentElement;
      }

      let alignParent = null;
      let curr = parent;
      while (curr && curr.getAttribute && !curr.getAttribute('contenteditable')) {
        const styleAlign = curr.style?.textAlign;
        const attrAlign = curr.getAttribute('align');
        if (styleAlign || attrAlign) {
          alignParent = curr;
          break;
        }
        curr = curr.parentElement;
      }

      if (alignDir === 'left') {
        if (alignParent) {
          alignParent.style.textAlign = '';
          alignParent.removeAttribute('align');
          if (!alignParent.getAttribute('style') && !alignParent.className && (alignParent.tagName === 'DIV' || alignParent.tagName === 'SPAN' || alignParent.tagName === 'P')) {
            const parentOfAlign = alignParent.parentNode;
            while (alignParent.firstChild) {
              parentOfAlign.insertBefore(alignParent.firstChild, alignParent);
            }
            parentOfAlign.removeChild(alignParent);
          }
        } else {
          document.execCommand('justifyLeft', false, null);
        }
      } else {
        if (alignParent && !alignParent.getAttribute('contenteditable')) {
          alignParent.style.textAlign = alignDir;
          alignParent.setAttribute('align', alignDir);
        } else {
          const alignDiv = document.createElement('div');
          alignDiv.style.textAlign = alignDir;
          alignDiv.setAttribute('align', alignDir);
          try {
            alignDiv.appendChild(range.extractContents());
            range.insertNode(alignDiv);
            const newRange = document.createRange();
            newRange.selectNodeContents(alignDiv);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (_) {
            document.execCommand(alignDir === 'center' ? 'justifyCenter' : 'justifyRight', false, null);
          }
        }
      }

      setTextAlign(alignDir);
      updateToolbarActiveStates();
      const updated = syncActiveBlockContent();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần căn lề');
    }
  };

  // Helper to accurately extract and split lines from selection container
  const parseSelectedLines = (container) => {
    let html = container.innerHTML || '';
    let text = container.innerText || container.textContent || '';

    let normalized = html
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<(p|div|li|h[1-6])[^>]*>/gi, '');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = normalized;
    let rawLines = (tempDiv.innerHTML || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== '<br>');

    if (rawLines.length <= 1 && text.includes('\n')) {
      rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    }

    return rawLines.length > 0 ? rawLines : [html || text];
  };

  // List handlers (Add bullet and number to each highlighted line, auto-incrementing per line)
  const handleInsertBulletList = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneRange().extractContents());

      const lines = parseSelectedLines(container);
      const isAlreadyBulleted = lines.every((l) => /^[•\-\*]\s*/.test(l.replace(/<[^>]+>/g, '').trim()) || /<li\b/i.test(l));

      let resultHtml = '';
      if (isAlreadyBulleted) {
        resultHtml = lines
          .map((l) => l.replace(/^([•\-\*]\s*)/, '').replace(/<\/?(li|ul|ol)[^>]*>/gi, ''))
          .join('<br>');
      } else {
        resultHtml = `<ul class="my-3 space-y-1.5 list-disc list-outside ml-6 sm:ml-8 pl-2 text-slate-800 dark:text-slate-200">${lines
          .map((l) => {
            const clean = l.replace(/^([•\-\*]\s*|\d+[\.\)]\s*)/, '').replace(/<\/?(li|ul|ol)[^>]*>/gi, '');
            return `<li class="leading-relaxed pl-1">${clean}</li>`;
          })
          .join('')}</ul>`;
      }

      const replacement = document.createElement('span');
      replacement.innerHTML = resultHtml;
      range.deleteContents();
      range.insertNode(replacement);

      const newRange = document.createRange();
      newRange.selectNodeContents(replacement);
      selection.removeAllRanges();
      selection.addRange(newRange);

      syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(blocks);
    } else {
      const activeIdx = getActiveIndex();
      insertBlockAt(activeIdx, {
        id: `list-${Date.now()}`,
        type: 'list',
        listType: 'bullet',
        items: ['']
      });
    }
  };

  const handleInsertNumberedList = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneRange().extractContents());

      const lines = parseSelectedLines(container);
      const isAlreadyNumbered = lines.every((l) => /^\d+[\.\)]\s*/.test(l.replace(/<[^>]+>/g, '').trim()) || /<li\b/i.test(l));

      let resultHtml = '';
      if (isAlreadyNumbered) {
        resultHtml = lines
          .map((l) => l.replace(/^\d+[\.\)]\s*/, '').replace(/<\/?(li|ul|ol)[^>]*>/gi, ''))
          .join('<br>');
      } else {
        resultHtml = `<ol class="my-3 space-y-1.5 list-decimal list-outside ml-6 sm:ml-8 pl-2 text-slate-800 dark:text-slate-200">${lines
          .map((l) => {
            const clean = l.replace(/^([•\-\*]\s*|\d+[\.\)]\s*)/, '').replace(/<\/?(li|ul|ol)[^>]*>/gi, '');
            return `<li class="leading-relaxed pl-1">${clean}</li>`;
          })
          .join('')}</ol>`;
      }

      const replacement = document.createElement('span');
      replacement.innerHTML = resultHtml;
      range.deleteContents();
      range.insertNode(replacement);

      const newRange = document.createRange();
      newRange.selectNodeContents(replacement);
      selection.removeAllRanges();
      selection.addRange(newRange);

      syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(blocks);
    } else {
      const activeIdx = getActiveIndex();
      insertBlockAt(activeIdx, {
        id: `list-${Date.now()}`,
        type: 'list',
        listType: 'numbered',
        items: ['']
      });
    }
  };

  const handleInsertQuote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      let parent = range.commonAncestorContainer;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentElement;
      }

      let quoteParent = null;
      let curr = parent;
      while (curr && curr.getAttribute && !curr.getAttribute('contenteditable')) {
        if (curr.tagName.toLowerCase() === 'blockquote') {
          quoteParent = curr;
          break;
        }
        curr = curr.parentElement;
      }

      if (quoteParent) {
        const parentOfQuote = quoteParent.parentNode;
        while (quoteParent.firstChild) {
          parentOfQuote.insertBefore(quoteParent.firstChild, quoteParent);
        }
        parentOfQuote.removeChild(quoteParent);
      } else {
        const quoteEl = document.createElement('blockquote');
        quoteEl.className = 'my-3 pl-4 border-l-4 border-[#ff5167] italic text-[#e8dff1]';
        try {
          quoteEl.appendChild(range.extractContents());
          range.insertNode(quoteEl);
          const newRange = document.createRange();
          newRange.selectNodeContents(quoteEl);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (_) {
          document.execCommand('formatBlock', false, '<blockquote>');
        }
      }
      syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(blocks);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần đặt làm trích dẫn');
    }
  };

  const handleInsertCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      let parent = range.commonAncestorContainer;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentElement;
      }

      let codeParent = null;
      let curr = parent;
      while (curr && curr.getAttribute && !curr.getAttribute('contenteditable')) {
        if (curr.tagName.toLowerCase() === 'code' || curr.tagName.toLowerCase() === 'pre') {
          codeParent = curr;
          break;
        }
        curr = curr.parentElement;
      }

      if (codeParent) {
        const parentOfCode = codeParent.parentNode;
        while (codeParent.firstChild) {
          parentOfCode.insertBefore(codeParent.firstChild, codeParent);
        }
        parentOfCode.removeChild(codeParent);
      } else {
        const codeEl = document.createElement('code');
        codeEl.className = 'bg-[#2c2835] text-[#ff5167] px-1.5 py-0.5 rounded text-sm font-mono';
        try {
          codeEl.appendChild(range.extractContents());
          range.insertNode(codeEl);
          const newRange = document.createRange();
          newRange.selectNodeContents(codeEl);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (_) { }
      }
      syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(blocks);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần định dạng mã nguồn');
    }
  };

  // Insert table directly into text/paragraph at current cursor position
  const insertTableAtCursor = (
    headers = ['Thành phần', 'Độ trễ', 'Trạng thái'],
    rows = [
      ['API Gateway', '12ms', 'Tối ưu'],
      ['Redis Cache', '2ms', 'Hoạt động tốt'],
      ['Database Node', '28ms', 'Ổn định']
    ]
  ) => {
    const tableHtml = `<div class="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/40 bg-white dark:bg-[#151025] shadow-xl not-prose block" contenteditable="false"><div class="overflow-x-auto"><table class="w-full text-left text-sm border-collapse min-w-[360px]"><thead class="bg-slate-100 dark:bg-[#1f1733] border-b border-slate-200 dark:border-white/10 text-rose-600 dark:text-[#ff8a9e] font-bold"><tr>${headers.map(h => `<th class="p-3 border border-slate-200 dark:border-white/10" contenteditable="true">${h}</th>`).join('')}</tr></thead><tbody class="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-200">${rows.map(r => `<tr>${r.map(c => `<td class="p-3 border border-slate-200 dark:border-white/10" contenteditable="true">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div><p><br></p>`;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && focusedBlockId) {
      try {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = tableHtml;
        const frag = document.createDocumentFragment();
        let lastNode = null;
        while (tempDiv.firstChild) {
          lastNode = tempDiv.firstChild;
          frag.appendChild(lastNode);
        }
        range.insertNode(frag);

        const newRange = document.createRange();
        if (lastNode) {
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
        }
        selection.removeAllRanges();
        selection.addRange(newRange);

        syncActiveBlockContent();
        pushHistory(blocks);
        return;
      } catch (_) { }
    }

    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    if (currentBlock && currentBlock.type === 'paragraph') {
      const newText = (currentBlock.text || '') + tableHtml;
      updateBlock(currentBlock.id, { text: newText });
    } else {
      insertBlockAt(activeIdx, {
        id: `tbl-${Date.now()}`,
        type: 'table',
        headers,
        rows
      });
    }
    pushHistory(blocks);
  };

  const handleInsertTable = () => {
    insertTableAtCursor();
  };

  const handleLinkAction = () => {
    saveSelection();
    const selection = window.getSelection();
    let existingLink = null;
    let defaultUrl = 'https://';

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      let parent = selection.getRangeAt(0).commonAncestorContainer;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentElement;
      }
      let curr = parent;
      while (curr && curr.getAttribute && !curr.getAttribute('contenteditable')) {
        if (curr.tagName.toLowerCase() === 'a') {
          existingLink = curr;
          break;
        }
        curr = curr.parentElement;
      }
      if (existingLink) {
        defaultUrl = existingLink.getAttribute('href') || 'https://';
      }

      openPrompt({
        title: existingLink ? 'Chỉnh sửa liên kết' : 'Chèn liên kết (Hyperlink)',
        description: 'Nhập đường dẫn URL website để gắn vào văn bản đang chọn:',
        placeholder: 'https://example.com',
        defaultValue: defaultUrl,
        confirmText: existingLink ? 'Cập nhật link' : 'Gắn liên kết',
        icon: 'link',
        iconColor: 'sky',
        onConfirm: (url) => {
          restoreSelection();
          if (!url || !url.trim() || url.trim() === 'https://') {
            if (existingLink) {
              const parentOfLink = existingLink.parentNode;
              while (existingLink.firstChild) {
                parentOfLink.insertBefore(existingLink.firstChild, existingLink);
              }
              parentOfLink.removeChild(existingLink);
            } else {
              document.execCommand('unlink', false, null);
            }
          } else {
            const fullUrl = url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('mailto:') || url.trim().startsWith('/')
              ? url.trim()
              : `https://${url.trim()}`;

            if (existingLink) {
              existingLink.setAttribute('href', fullUrl);
              existingLink.setAttribute('target', '_blank');
              existingLink.setAttribute('rel', 'noopener noreferrer');
              existingLink.className = 'text-[#4cd7f6] hover:underline font-medium';
            } else {
              document.execCommand('createLink', false, fullUrl);
              const activeEl = inputRefs.current[focusedBlockId];
              if (activeEl) {
                activeEl.querySelectorAll(`a[href="${fullUrl}"]`).forEach((a) => {
                  a.setAttribute('target', '_blank');
                  a.setAttribute('rel', 'noopener noreferrer');
                  a.className = 'text-[#4cd7f6] hover:underline font-medium';
                });
              }
            }
          }
          syncActiveBlockContent();
          updateToolbarActiveStates();
          pushHistory(blocks);
        }
      });
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần chèn đường liên kết');
    }
  };

  // Insert video directly into text/paragraph at cursor
  const insertVideoAtCursor = (videoUrl, caption = '', targetIdx = null, split = null) => {
    if (!videoUrl || !videoUrl.trim()) return;
    const cleanCaption = caption ? caption.trim() : '';
    const activeIdx = targetIdx !== null ? targetIdx : (targetBlockIndexRef.current !== null ? targetBlockIndexRef.current : getActiveIndex());
    targetBlockIndexRef.current = null;
    const nextParagraphId = `p-${Date.now() + 1}`;
    const newVideoBlock = {
      id: `vid-${Date.now()}`,
      type: 'video',
      url: videoUrl,
      caption: cleanCaption || 'Video minh họa'
    };
    const afterText = split?.afterText || '';
    const newParagraphBlock = {
      id: nextParagraphId,
      type: 'paragraph',
      text: afterText === '<br>' || afterText === '<p><br></p>' ? '' : afterText
    };

    setBlocks((prev) => {
      const newBlocks = [...prev];
      const validIdx = activeIdx >= 0 && activeIdx < newBlocks.length ? activeIdx : Math.max(0, newBlocks.length - 1);

      if (split && split.blockId && newBlocks[validIdx]?.id === split.blockId) {
        const beforeText = split.beforeText || '';
        newBlocks[validIdx] = {
          ...newBlocks[validIdx],
          text: beforeText === '<br>' || beforeText === '<p><br></p>' ? '' : beforeText
        };
      }

      newBlocks.splice(validIdx + 1, 0, newVideoBlock, newParagraphBlock);
      pushHistory(newBlocks);
      return newBlocks;
    });

    setFocusedBlockId(nextParagraphId);
    lastActiveIndexRef.current = (activeIdx >= 0 ? activeIdx : 0) + 2;

    setTimeout(() => {
      if (inputRefs.current[nextParagraphId]) {
        inputRefs.current[nextParagraphId].focus();
      }
    }, 80);
  };

  const handleInsertVideo = () => {
    saveSelection();
    const ctx = captureCursorContext();
    const targetIdx = ctx.blockIdx;
    const splitData = ctx.splitData && (ctx.splitData.beforeText || ctx.splitData.afterText) ? { blockId: ctx.blockId, ...ctx.splitData } : null;

    openPrompt({
      title: 'Chèn Video trực quan',
      description: 'Nhập đường dẫn Video (YouTube, YouTube Shorts, Vimeo hoặc Video Embed URL):',
      placeholder: 'https://www.youtube.com/watch?v=...',
      defaultValue: 'https://www.youtube.com/watch?v=',
      confirmText: 'Chèn Video',
      icon: 'smart_display',
      iconColor: 'rose',
      onConfirm: (url) => {
        if (url && url.trim() && url.trim() !== 'https://www.youtube.com/watch?v=') {
          insertVideoAtCursor(url.trim(), '', targetIdx, splitData);
        }
      }
    });
  };

  const handleInsertDivider = (idx = getActiveIndex()) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && focusedBlockId) {
      try {
        const range = selection.getRangeAt(0);
        const hr = document.createElement('hr');
        hr.className = 'my-6 border-t border-[#352f44] block';
        range.deleteContents();
        range.insertNode(hr);
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        hr.parentNode.insertBefore(p, hr.nextSibling);

        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        syncActiveBlockContent();
        pushHistory(blocks);
        return;
      } catch (_) { }
    }

    insertBlockAt(idx, {
      id: `div-${Date.now()}`,
      type: 'divider'
    });
  };

  const handleInsertColumns = (idx = null) => {
    saveSelection();
    const ctx = captureCursorContext();
    const targetIdx = idx !== null ? idx : ctx.blockIdx;
    const split = ctx.splitData && (ctx.splitData.beforeText || ctx.splitData.afterText) ? { blockId: ctx.blockId, ...ctx.splitData } : null;
    const userSelectedText = ctx.selectedHtml && ctx.selectedHtml.trim() ? ctx.selectedHtml.trim() : '';

    const activeIdx = targetIdx !== null ? targetIdx : getActiveIndex();
    const nextParagraphId = `p-${Date.now() + 1}`;
    const newColumnsBlock = {
      id: `cols-${Date.now()}`,
      type: 'columns',
      layout: '50-50',
      styleVariant: 'card',
      leftType: 'text',
      rightType: 'image',
      leftTitle: '',
      rightTitle: '',
      leftText: userSelectedText || '',
      rightText: '',
      leftImageUrl: '',
      leftImageCaption: '',
      rightImageUrl: '',
      rightImageCaption: ''
    };

    const afterText = split?.afterText || '';
    const newParagraphBlock = {
      id: nextParagraphId,
      type: 'paragraph',
      text: afterText === '<br>' || afterText === '<p><br></p>' ? '' : afterText
    };

    setBlocks((prev) => {
      const newBlocks = [...prev];
      const validIdx = activeIdx >= 0 && activeIdx < newBlocks.length ? activeIdx : Math.max(0, newBlocks.length - 1);

      if (split && split.blockId && newBlocks[validIdx]?.id === split.blockId) {
        const beforeText = split.beforeText || '';
        newBlocks[validIdx] = {
          ...newBlocks[validIdx],
          text: beforeText === '<br>' || beforeText === '<p><br></p>' ? '' : beforeText
        };
      }

      newBlocks.splice(validIdx + 1, 0, newColumnsBlock, newParagraphBlock);
      pushHistory(newBlocks);
      return newBlocks;
    });

    setFocusedBlockId(newColumnsBlock.id);
    lastActiveIndexRef.current = (activeIdx >= 0 ? activeIdx : 0) + 2;
  };

  // Reusable unified image compression & upload helper
  const processAndUploadFile = async (file, folder = 'dudi_blog/blocks') => {
    try {
      // 1. Client-side canvas compression to WebP to reduce file size by 80-90%
      const { base64: base64Data, blob: compressedBlob } = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85
      });
      let uploadedUrl = base64Data;

      // 2. Upload to backend API
      let uploadSuccess = false;
      try {
        const apiRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            folder
          })
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success && apiData.url) {
            uploadedUrl = apiData.url;
            uploadSuccess = true;
          }
        }
      } catch (err) {
        console.warn('Backend upload offline:', err);
      }

      // 3. Direct Cloudinary upload fallback if server API was not reached
      if (!uploadSuccess) {
        const cloudName = 'ai1z2oaj';
        const uploadPreset = 'dudi_blog_preset';

        if (cloudName && uploadPreset && uploadPreset !== 'YOUR_UPLOAD_PRESET') {
          try {
            const formData = new FormData();
            formData.append('file', compressedBlob || file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', folder);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData
            });

            if (res.ok) {
              const data = await res.json();
              if (data.secure_url) {
                uploadedUrl = data.secure_url;
                uploadSuccess = true;
              }
            }
          } catch (cloudErr) {
            console.warn('[Cloudinary Upload Fallback]', cloudErr);
          }
        }
      }
      return uploadedUrl;
    } catch (err) {
      console.warn('Lỗi nén/upload ảnh:', err);
      return null;
    }
  };

  // Insert image file from paste event or drag-drop into editor canvas
  const handleImageFileInsert = async (file, targetIdx = null, split = null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const fileName = file.name || `image-${Date.now()}.png`;
    const tempBlockId = `img-${Date.now()}`;
    const nextParagraphId = `p-${Date.now() + 1}`;

    const activeIdx = targetIdx !== null ? targetIdx : (targetBlockIndexRef.current !== null ? targetBlockIndexRef.current : getActiveIndex());
    targetBlockIndexRef.current = null;

    const newImageBlock = {
      id: tempBlockId,
      type: 'image',
      url: '',
      caption: fileName,
      uploading: true
    };
    const afterText = split?.afterText || '';
    const newParagraphBlock = {
      id: nextParagraphId,
      type: 'paragraph',
      text: afterText === '<br>' || afterText === '<p><br></p>' ? '' : afterText
    };

    setBlocks((prev) => {
      const newBlocks = [...prev];
      const validIdx = activeIdx >= 0 && activeIdx < newBlocks.length ? activeIdx : Math.max(0, newBlocks.length - 1);

      if (split && split.blockId && newBlocks[validIdx]?.id === split.blockId) {
        const beforeText = split.beforeText || '';
        newBlocks[validIdx] = {
          ...newBlocks[validIdx],
          text: beforeText === '<br>' || beforeText === '<p><br></p>' ? '' : beforeText
        };
      }

      newBlocks.splice(validIdx + 1, 0, newImageBlock, newParagraphBlock);
      pushHistory(newBlocks);
      return newBlocks;
    });

    setFocusedBlockId(nextParagraphId);
    lastActiveIndexRef.current = (activeIdx >= 0 ? activeIdx : 0) + 2;

    try {
      const uploadedUrl = await processAndUploadFile(file, 'dudi_blog/blocks');
      if (uploadedUrl) {
        setBlocks((prev) => prev.map((b) => b.id === tempBlockId ? { ...b, uploading: false, url: uploadedUrl, caption: fileName } : b));
        pushHistory(blocks);
        toast.success('Đã dán và tải ảnh lên thành công!');
      } else {
        setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
        toast.error('Không thể xử lý ảnh được dán');
      }
    } catch (err) {
      setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
      toast.error('Lỗi khi dán ảnh: ' + err.message);
    }
  };

  // Handle column image file insertion (from file upload, drag-drop, or paste)
  const handleColumnImageFile = async (file, blockId, side) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn hoặc dán tệp hình ảnh hợp lệ');
      return;
    }

    const sideKeyUrl = side === 'left' ? 'leftImageUrl' : 'rightImageUrl';
    const sideKeyUploading = side === 'left' ? 'leftUploading' : 'rightUploading';
    const sideKeyType = side === 'left' ? 'leftType' : 'rightType';
    const sideKeyCaption = side === 'left' ? 'leftImageCaption' : 'rightImageCaption';

    updateBlock(blockId, {
      [sideKeyType]: 'image',
      [sideKeyUploading]: true,
      [sideKeyCaption]: file.name || 'Ảnh dán từ bộ nhớ tạm'
    });

    try {
      const uploadedUrl = await processAndUploadFile(file, 'dudi_blog/blocks');
      if (uploadedUrl) {
        updateBlock(blockId, {
          [sideKeyUrl]: uploadedUrl,
          [sideKeyUploading]: false
        });
        pushHistory(blocks);
        toast.success('Đã dán ảnh vào cột thành công!');
      } else {
        updateBlock(blockId, { [sideKeyUploading]: false });
        toast.error('Không thể tải ảnh dán lên');
      }
    } catch (err) {
      console.error('Lỗi tải ảnh cột:', err);
      updateBlock(blockId, { [sideKeyUploading]: false });
      toast.error('Không thể dán ảnh, vui lòng thử lại');
    }
  };

  // Paste image directly from system clipboard into a column
  const handlePasteFromClipboardToColumn = async (blockId, side) => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], `pasted-image-${Date.now()}.${imageType.split('/')[1] || 'png'}`, { type: imageType });
            await handleColumnImageFile(file, blockId, side);
            return;
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
          const sideKeyUrl = side === 'left' ? 'leftImageUrl' : 'rightImageUrl';
          const sideKeyType = side === 'left' ? 'leftType' : 'rightType';
          updateBlock(blockId, {
            [sideKeyType]: 'image',
            [sideKeyUrl]: text.trim()
          });
          pushHistory(blocks);
          toast.success('Đã dán đường dẫn ảnh thành công!');
          return;
        }
      }

      toast.info('Hãy copy ảnh (hoặc chụp màn hình) rồi nhấn nút này hoặc nhấn Ctrl+V');
    } catch (_) {
      openPrompt({
        title: 'Dán đường dẫn hoặc ảnh',
        description: 'Nhập đường dẫn ảnh (URL) hoặc dán link ảnh:',
        placeholder: 'https://images.unsplash.com/... hoặc link ảnh',
        confirmText: 'Chèn ảnh',
        icon: 'image',
        iconColor: 'sky',
        onConfirm: (url) => {
          if (url && url.trim()) {
            const sideKeyUrl = side === 'left' ? 'leftImageUrl' : 'rightImageUrl';
            const sideKeyType = side === 'left' ? 'leftType' : 'rightType';
            updateBlock(blockId, {
              [sideKeyType]: 'image',
              [sideKeyUrl]: url.trim()
            });
            pushHistory(blocks);
            toast.success('Đã chèn ảnh thành công!');
          }
        }
      });
    }
  };

  // Paste image directly from system clipboard into a standalone image block
  const handlePasteFromClipboardToBlock = async (blockId) => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], `pasted-image-${Date.now()}.${imageType.split('/')[1] || 'png'}`, { type: imageType });
            updateBlock(blockId, { uploading: true });
            const uploadedUrl = await processAndUploadFile(file, 'dudi_blog/blocks');
            if (uploadedUrl) {
              updateBlock(blockId, { url: uploadedUrl, caption: file.name, uploading: false });
              pushHistory(blocks);
              toast.success('Đã dán ảnh thành công!');
            } else {
              updateBlock(blockId, { uploading: false });
              toast.error('Không thể tải ảnh dán lên');
            }
            return;
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
          updateBlock(blockId, { url: text.trim() });
          pushHistory(blocks);
          toast.success('Đã dán đường dẫn ảnh thành công!');
          return;
        }
      }

      toast.info('Hãy copy ảnh (hoặc chụp màn hình) rồi nhấn nút này hoặc nhấn Ctrl+V');
    } catch (_) {
      openPrompt({
        title: 'Dán đường dẫn ảnh',
        description: 'Nhập đường dẫn ảnh (URL):',
        placeholder: 'https://images.unsplash.com/...',
        confirmText: 'Chèn ảnh',
        icon: 'image',
        iconColor: 'sky',
        onConfirm: (url) => {
          if (url && url.trim()) {
            updateBlock(blockId, { url: url.trim() });
            pushHistory(blocks);
            toast.success('Đã cập nhật ảnh thành công!');
          }
        }
      });
    }
  };

  const triggerColumnImageUpload = (blockId, side) => {
    setColumnUploadTarget({ blockId, side });
    columnFileInputRef.current?.click();
  };

  const handleColumnImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !columnUploadTarget) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn tệp hình ảnh hợp lệ');
      return;
    }

    const { blockId, side } = columnUploadTarget;
    setColumnUploadTarget(null);
    if (e.target) e.target.value = '';

    await handleColumnImageFile(file, blockId, side);
  };

  // Insert image directly into text/paragraph at cursor with caption and automatically add a new paragraph below for continued writing
  const insertImageAtCursor = (imageUrl, caption = '', targetIdx = null, split = null) => {
    const cleanCaption = caption || '';
    const activeIdx = targetIdx !== null ? targetIdx : (targetBlockIndexRef.current !== null ? targetBlockIndexRef.current : getActiveIndex());
    targetBlockIndexRef.current = null;
    const nextParagraphId = `p-${Date.now() + 1}`;
    const newImageBlock = {
      id: `img-${Date.now()}`,
      type: 'image',
      url: imageUrl,
      caption: cleanCaption || 'Hình ảnh minh họa (.webp)'
    };
    const afterText = split?.afterText || '';
    const newParagraphBlock = {
      id: nextParagraphId,
      type: 'paragraph',
      text: afterText === '<br>' || afterText === '<p><br></p>' ? '' : afterText
    };

    setBlocks((prev) => {
      const newBlocks = [...prev];
      const validIdx = activeIdx >= 0 && activeIdx < newBlocks.length ? activeIdx : Math.max(0, newBlocks.length - 1);

      if (split && split.blockId && newBlocks[validIdx]?.id === split.blockId) {
        const beforeText = split.beforeText || '';
        newBlocks[validIdx] = {
          ...newBlocks[validIdx],
          text: beforeText === '<br>' || beforeText === '<p><br></p>' ? '' : beforeText
        };
      }

      newBlocks.splice(validIdx + 1, 0, newImageBlock, newParagraphBlock);
      pushHistory(newBlocks);
      return newBlocks;
    });

    setFocusedBlockId(nextParagraphId);
    lastActiveIndexRef.current = (activeIdx >= 0 ? activeIdx : 0) + 2;

    setTimeout(() => {
      if (inputRefs.current[nextParagraphId]) {
        inputRefs.current[nextParagraphId].focus();
      }
    }, 80);
  };

  const triggerImageUploadAt = (idx) => {
    saveSelection();
    const ctx = captureCursorContext();
    const targetIdx = idx !== undefined && idx !== null ? idx : ctx.blockIdx;
    targetBlockIndexRef.current = targetIdx;
    setTargetBlockIndex(targetIdx);
    splitContextRef.current = ctx.splitData && (ctx.splitData.beforeText || ctx.splitData.afterText) ? { blockId: ctx.blockId, ...ctx.splitData } : null;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e, isCover = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn tệp hình ảnh hợp lệ');
      return;
    }

    const fileName = file.name;
    const tempBlockId = isCover ? null : `img-${Date.now()}`;
    const nextParagraphId = isCover ? null : `p-${Date.now() + 1}`;

    if (isCover) {
      setCoverUploadState({
        uploading: true
      });
    } else {
      const activeIdx = targetBlockIndexRef.current !== null
        ? targetBlockIndexRef.current
        : getActiveIndex();
      const split = splitContextRef.current;
      targetBlockIndexRef.current = null;
      splitContextRef.current = null;
      setTargetBlockIndex(null);

      const newImageBlock = {
        id: tempBlockId,
        type: 'image',
        url: '',
        caption: fileName,
        uploading: true
      };
      const afterText = split?.afterText || '';
      const newParagraphBlock = {
        id: nextParagraphId,
        type: 'paragraph',
        text: afterText === '<br>' || afterText === '<p><br></p>' ? '' : afterText
      };

      setBlocks((prev) => {
        const newBlocks = [...prev];
        const validIdx = activeIdx >= 0 && activeIdx < newBlocks.length ? activeIdx : Math.max(0, newBlocks.length - 1);

        if (split && split.blockId && newBlocks[validIdx]?.id === split.blockId) {
          const beforeText = split.beforeText || '';
          newBlocks[validIdx] = {
            ...newBlocks[validIdx],
            text: beforeText === '<br>' || beforeText === '<p><br></p>' ? '' : beforeText
          };
        }

        newBlocks.splice(validIdx + 1, 0, newImageBlock, newParagraphBlock);
        pushHistory(newBlocks);
        return newBlocks;
      });

      setFocusedBlockId(nextParagraphId);
      lastActiveIndexRef.current = (activeIdx >= 0 ? activeIdx : 0) + 2;
    }

    try {
      const uploadedUrl = await processAndUploadFile(file, isCover ? 'dudi_blog/covers' : 'dudi_blog/blocks');

      if (uploadedUrl) {
        if (isCover) {
          setCoverImage(uploadedUrl);
          toast.success('Đã tải lên ảnh bìa thành công!');
        } else {
          setBlocks((prev) => prev.map((b) => b.id === tempBlockId ? { ...b, uploading: false, url: uploadedUrl, caption: fileName } : b));
          pushHistory(blocks);
          toast.success('Đã chèn ảnh bài viết thành công!');
        }
      } else {
        if (!isCover) {
          setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
        }
        toast.error('Không thể xử lý hình ảnh');
      }
    } catch (err) {
      if (!isCover) {
        setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
      }
      toast.error('Lỗi khi tải ảnh: ' + err.message);
    } finally {
      if (isCover) {
        setTimeout(() => setCoverUploadState(null), 300);
      }
      if (e.target) e.target.value = '';
    }
  };

  const triggerReplaceImage = (blockId) => {
    setReplaceTargetBlockId(blockId);
    replaceImageFileInputRef.current?.click();
  };

  const handleReplaceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetBlockId) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn tệp hình ảnh hợp lệ');
      return;
    }

    const targetId = replaceTargetBlockId;
    setReplaceTargetBlockId(null);
    updateBlock(targetId, { uploading: true });

    try {
      const uploadedUrl = await processAndUploadFile(file, 'dudi_blog/blocks');
      if (uploadedUrl) {
        updateBlock(targetId, {
          url: uploadedUrl,
          caption: file.name,
          uploading: false
        });
        pushHistory(blocks);
        toast.success('Đã cập nhật hình ảnh thành công!');
      } else {
        updateBlock(targetId, { uploading: false });
        toast.error('Không thể cập nhật ảnh');
      }
    } catch (err) {
      console.error('Lỗi thay đổi ảnh:', err);
      updateBlock(targetId, { uploading: false });
      toast.error('Không thể thay đổi hình ảnh');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Global Paste Listener for pasting clipboard images/screenshots directly into editor
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const activeEl = document.activeElement;
      // Do not intercept if user is typing in standard inputs like title or category or URL inputs
      if (activeEl && (activeEl.tagName === 'INPUT' || (activeEl.tagName === 'TEXTAREA' && !activeEl.getAttribute('data-block-id')))) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const ctx = captureCursorContext();
            handleImageFileInsert(file, ctx.blockIdx, ctx.splitData);
          }
          return;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [blocks, focusedBlockId]);

  const triggerVideoUploadAt = (idx) => {
    saveSelection();
    const ctx = captureCursorContext();
    const targetIdx = idx !== undefined && idx !== null ? idx : ctx.blockIdx;
    targetBlockIndexRef.current = targetIdx;
    setTargetBlockIndex(targetIdx);
    splitContextRef.current = ctx.splitData && (ctx.splitData.beforeText || ctx.splitData.afterText) ? { blockId: ctx.blockId, ...ctx.splitData } : null;
    videoFileInputRef.current?.click();
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.warning('Vui lòng chọn tệp video hợp lệ (.mp4, .webm, .mov,...)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.warning('Dung lượng video vượt quá 100MB, vui lòng chọn video ngắn hơn');
      return;
    }

    const fileName = file.name;
    const tempBlockId = `vid-${Date.now()}`;
    const nextParagraphId = `p-${Date.now() + 1}`;

    const activeIdx = targetBlockIndexRef.current !== null
      ? targetBlockIndexRef.current
      : getActiveIndex();
    const split = splitContextRef.current;
    targetBlockIndexRef.current = null;
    splitContextRef.current = null;
    setTargetBlockIndex(null);

    const newVideoBlock = {
      id: tempBlockId,
      type: 'video',
      url: '',
      caption: fileName,
      uploading: true
    };
    const afterText = split?.afterText || '';
    const newParagraphBlock = {
      id: nextParagraphId,
      type: 'paragraph',
      text: afterText === '<br>' || afterText === '<p><br></p>' ? '' : afterText
    };

    setBlocks((prev) => {
      const newBlocks = [...prev];
      const validIdx = activeIdx >= 0 && activeIdx < newBlocks.length ? activeIdx : Math.max(0, newBlocks.length - 1);

      if (split && split.blockId && newBlocks[validIdx]?.id === split.blockId) {
        const beforeText = split.beforeText || '';
        newBlocks[validIdx] = {
          ...newBlocks[validIdx],
          text: beforeText === '<br>' || beforeText === '<p><br></p>' ? '' : beforeText
        };
      }

      newBlocks.splice(validIdx + 1, 0, newVideoBlock, newParagraphBlock);
      pushHistory(newBlocks);
      return newBlocks;
    });

    setFocusedBlockId(nextParagraphId);
    lastActiveIndexRef.current = (activeIdx >= 0 ? activeIdx : 0) + 2;

    const uploadTask = async () => {
      try {
        let uploadedUrl = null;

        // 1. Direct Cloudinary upload with FormData
        const cloudName = 'ai1z2oaj';
        const uploadPreset = 'dudi_blog_preset';

        if (cloudName && uploadPreset && uploadPreset !== 'YOUR_UPLOAD_PRESET') {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', 'dudi_blog/videos');
            formData.append('resource_type', 'video');

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
              method: 'POST',
              body: formData
            });

            if (res.ok) {
              const data = await res.json();
              if (data.secure_url) {
                uploadedUrl = data.secure_url;
              }
            }
          } catch (cloudErr) {
            console.warn('[Cloudinary Direct Video Upload]', cloudErr);
          }
        }

        // 2. Backend upload endpoint fallback
        if (!uploadedUrl) {
          try {
            const base64Data = await readFileAsBase64(file);
            const apiRes = await fetch('/api/upload/video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                video: base64Data,
                folder: 'dudi_blog/videos'
              })
            });

            if (apiRes.ok) {
              const apiData = await apiRes.json();
              if (apiData.success && apiData.url) {
                uploadedUrl = apiData.url;
              }
            }
          } catch (err) {
            console.warn('Backend video upload offline:', err);
          }
        }

        // 3. Local Object URL fallback if network upload fails
        if (!uploadedUrl) {
          uploadedUrl = URL.createObjectURL(file);
        }

        return uploadedUrl;
      } catch (err) {
        console.warn('Lỗi upload video:', err);
        return URL.createObjectURL(file);
      }
    };

    try {
      const uploadedUrl = await uploadTask();

      if (uploadedUrl) {
        setBlocks((prev) => prev.map((b) => b.id === tempBlockId ? { ...b, uploading: false, url: uploadedUrl, caption: fileName } : b));
        pushHistory(blocks);
        toast.success('Đã chèn video thành công!');
      } else {
        setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
        toast.error('Không thể xử lý video');
      }
    } catch (err) {
      setBlocks((prev) => prev.filter((b) => b.id !== tempBlockId));
      toast.error('Lỗi khi tải video: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  // Keyboard Shortcuts Listener (Ctrl+B, I, U, Z, Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!isCmdOrCtrl) return;

      const key = e.key.toLowerCase();

      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (key === 'b') {
        e.preventDefault();
        handleBoldToggle();
      } else if (key === 'i') {
        e.preventDefault();
        handleItalicToggle();
      } else if (key === 'u') {
        e.preventDefault();
        handleUnderlineToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, blocks, focusedBlockId]);

  // Global selection change listener to immediately sync active formats and heading dropdown
  useEffect(() => {
    const handleGlobalSelectionChange = () => {
      updateToolbarActiveStates();
    };
    document.addEventListener('selectionchange', handleGlobalSelectionChange);
    return () => document.removeEventListener('selectionchange', handleGlobalSelectionChange);
  }, [blocks, focusedBlockId]);

  // Tags management
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().startsWith('#') ? newTagInput.trim() : `#${newTagInput.trim()}`;
      if (!tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Auto countdown for redirect after publishing
  useEffect(() => {
    let timer;
    if (showPublishSuccessModal) {
      setRedirectCountdown(3);
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (publishedPostInfo?.id) {
              selectPost(publishedPostInfo.id);
            }
            if (onNavigate) {
              onNavigate('blog');
            } else if (onExit) {
              onExit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showPublishSuccessModal, publishedPostInfo, onNavigate, onExit, selectPost]);

  // Save / Publish
  const handleSave = async (status = 'published') => {
    if (isSavingRef.current || isSaving) return;

    if (!title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề bài viết!');
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

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
      } else if (block.type === 'columns') {
        const colContent = `${block.leftTitle ? `### ${block.leftTitle}\n` : ''}${block.leftText || ''}\n\n${block.rightTitle ? `### ${block.rightTitle}\n` : ''}${block.rightText || ''}`;
        currentSection.text = currentSection.text ? `${currentSection.text}\n\n${colContent}` : colContent;
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
      slug: slug || cleanTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      category,
      summary: summary || '',
      sapo: summary || '',
      blocks,
      coverImage: coverImage || firstImgBlock?.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&fm=webp',
      tags: tags.length > 0 ? tags : ['#DUDISoftware', '#TechNews'],
      status,
      authorName: authorName.split(' (')[0],
      authorRole: 'Lead Architect',
      readTime: `${Math.max(1, Math.ceil(wordCount / 200))} phút đọc`,
      content: contentSections.length > 0 ? contentSections : [{ heading: 'Nội dung', text: summary || 'Nội dung bài viết đang được cập nhật.' }]
    };

    let resultPost = null;
    try {
      if (postToEdit) {
        await updatePost(postToEdit.id, postData);
        resultPost = { ...postToEdit, ...postData };
        toast.success(`Đã cập nhật bài viết "${title}" thành công!`);
      } else {
        resultPost = await createPost(postData);
        toast.success(`Đã ${status === 'published' ? 'xuất bản' : 'lưu nháp'} bài viết "${title}" thành công!`);
      }
      clearPreviewPost();
    } catch (err) {
      console.warn('Lỗi lưu bài viết:', err);
      resultPost = { id: `post-${Date.now()}`, ...postData };
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
        setIsSaving(false);
      }, 1000);
    }

    if (status === 'published') {
      setPublishedPostInfo(resultPost || { title, category, coverImage: postData.coverImage });
      setShowPublishSuccessModal(true);
    } else {
      if (onExit) onExit();
    }
  };

  const handlePreview = () => {
    if (!title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề bài viết trước khi xem trước!');
      return;
    }

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
      } else if (block.type === 'columns') {
        const colContent = `${block.leftTitle ? `### ${block.leftTitle}\n` : ''}${block.leftText || ''}\n\n${block.rightTitle ? `### ${block.rightTitle}\n` : ''}${block.rightText || ''}`;
        currentSection.text = currentSection.text ? `${currentSection.text}\n\n${colContent}` : colContent;
      } else if (block.type === 'quote') {
        currentSection.quote = block.text;
        currentSection.quoteAuthor = block.author || '';
      }
    });
    if (currentSection.text || currentSection.heading) {
      contentSections.push(currentSection);
    }

    const firstImgBlock = blocks.find((b) => b.type === 'image');
    const targetSlug = slug || title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    const previewData = {
      id: postToEdit?.id || `preview-${Date.now()}`,
      isEditingExisting: Boolean(postToEdit),
      originalPostId: postToEdit?.id || null,
      title,
      slug: targetSlug,
      category,
      subCategory: category,
      tag: (category || 'TIN TỨC').toUpperCase(),
      summary: summary || '',
      sapo: summary || '',
      blocks,
      coverImage: coverImage || firstImgBlock?.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&fm=webp',
      tags: tags.length > 0 ? tags : ['#DUDISoftware', '#Preview'],
      status: postToEdit?.status || (isPublic ? 'published' : 'draft'),
      isPublic,
      metaDesc,
      authorName,
      author: {
        name: authorName.split(' (')[0],
        role: 'Tác giả',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqw-vduZVOWhbLaDn1DaU18qakFhiVY0XwArz4Szdi66WNXtlVf0MwMXr_t5ymSlCfZPL6F77-B4U63hFCIow2ZJ7J3pYtzELJ07_ssO-Xek7q1cJevJ_geMQt_Iu5yMz5BoMjitCGWEYWAVn3Cj0b_GJsxeYUUGXS7krpQhKJh_NTXhtL6bNtlhtjU_yMoEQn5o-pn0Fn8djGAw9EOJYMJXMu-pfz6WeCc-iNuKXmqOcCB8eQRjHTcA'
      },
      date: 'Bản xem trước (Live Preview)',
      readTime: `${Math.max(1, Math.ceil(wordCount / 200))} phút đọc`,
      views: postToEdit?.views || 0,
      content: contentSections.length > 0 ? contentSections : [{ heading: 'Nội dung', text: summary || 'Đang soạn thảo...' }]
    };

    setTemporaryPreviewPost(previewData);
    if (onNavigate) {
      onNavigate('blog', `${targetSlug}?preview=true`);
    }
  };

  return (
    <div className="flex flex-col w-full bg-slate-100 dark:bg-[#15111d] text-slate-800 dark:text-[#e8dff1] antialiased min-h-screen transition-colors duration-300">
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
        ref={replaceImageFileInputRef}
        onChange={handleReplaceImageUpload}
        accept="image/webp,image/png,image/jpeg,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={columnFileInputRef}
        onChange={handleColumnImageUpload}
        accept="image/webp,image/png,image/jpeg,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={videoFileInputRef}
        onChange={handleVideoFileUpload}
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverFileInputRef}
        onChange={(e) => handleFileUpload(e, true)}
        accept="image/webp,image/png,image/jpeg,image/gif"
        className="hidden"
      />

      {/* Sticky Top Action Bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 bg-white/95 dark:bg-[#1a1426]/95 px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-b border-slate-200 dark:border-[#352b48] transition-colors">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <nav className="flex items-center gap-1 text-slate-500 dark:text-[#ad8888] text-xs whitespace-nowrap">
            <button onClick={onExit} className="hover:text-rose-600 dark:hover:text-[#ffb3b5] transition-colors flex-shrink-0 font-medium">
              Quản trị
            </button>
            <span className="material-symbols-outlined text-[14px] flex-shrink-0">chevron_right</span>
            <button onClick={onExit} className="hover:text-rose-600 dark:hover:text-[#ffb3b5] transition-colors flex-shrink-0 font-medium">
              Bài viết
            </button>
            <span className="material-symbols-outlined text-[14px] flex-shrink-0">chevron_right</span>
            <span className="text-slate-900 dark:text-[#e8dff1] font-semibold truncate max-w-[120px] sm:max-w-[200px]">
              {postToEdit ? 'Chỉnh sửa' : 'Soạn mới'}
            </span>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#2c2835] text-slate-700 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-semibold border border-slate-200 dark:border-transparent"
            type="button"
            title="Quay lại danh sách"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          <button
            onClick={handlePreview}
            disabled={isSaving}
            className="group flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#2c2835] text-slate-800 dark:text-[#e8dff1] hover:bg-slate-200 dark:hover:bg-[#3c3745] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-xs font-semibold border border-slate-200 dark:border-transparent"
            type="button"
            title="Xem trước trên Blog"
          >
            <span className="material-symbols-outlined text-[16px] text-sky-600 dark:text-[#4cd7f6] group-hover:scale-110 transition-transform">
              visibility
            </span>
            <span className="hidden sm:inline">Xem trước</span>
          </button>

          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#2c2835] text-slate-700 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-[#e8dff1] hover:bg-slate-200 dark:hover:bg-[#3c3745] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold border border-slate-200 dark:border-transparent"
            type="button"
            title="Lưu bản nháp"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span className="hidden sm:inline">Lưu nháp</span>
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="relative group flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#ff2d55] to-[#ff5167] text-white text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(255,45,85,0.45)] hover:shadow-[0_0_28px_rgba(255,45,85,0.65)] hover:brightness-110 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-all"
            type="button"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSaving ? 'animate-spin' : ''}`}>
              {isSaving ? 'progress_activity' : 'rocket_launch'}
            </span>
            <span>{isSaving ? 'Đang xuất bản...' : 'Xuất bản'}</span>
          </button>

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors xl:hidden ${isDrawerOpen
              ? 'bg-rose-50 dark:bg-[#ff5167]/20 text-rose-600 dark:text-[#ffb3b5] border border-rose-300 dark:border-[#ff5167]/40'
              : 'bg-slate-100 dark:bg-[#2c2835] text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-[#ffb3b5]'
              }`}
            title={isDrawerOpen ? 'Đóng bảng cài đặt' : 'Mở bảng cài đặt'}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">view_sidebar</span>
          </button>
        </div>
      </div>

      {/* Floating Toolbar Ribbon (Unified with outer bar) */}
      <div className="sticky top-[52px] sm:top-[58px] z-30 w-full bg-slate-50/95 dark:bg-[#161024]/95 backdrop-blur-2xl py-1.5 px-2 sm:px-4 shadow-sm dark:shadow-[0_12px_24px_rgba(0,0,0,0.55)] border-b border-slate-200 dark:border-[#352b48] transition-colors">
        <div className="max-w-[1500px] mx-auto flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">

          {/* GROUP 1: Undo / Redo + Heading Dropdown */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-0.5 shadow-sm">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUndo}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] active:scale-95 transition-all"
              title="Hoàn tác (Undo - Ctrl+Z)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">undo</span>
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleRedo}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] active:scale-95 transition-all"
              title="Làm lại (Redo - Ctrl+Y)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">redo</span>
            </button>

            {/* Custom Format Dropdown */}
            <div className="relative inline-flex items-center" ref={formatDropdownRef}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  setIsFormatDropdownOpen((prev) => !prev);
                  setIsFontSizeDropdownOpen(false);
                  setIsColorPickerOpen(false);
                  setIsLineHeightDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-1 hover:bg-slate-100 dark:hover:bg-[#2c2835]/60 text-slate-800 dark:text-[#e8dff1] text-xs font-semibold pl-2 pr-1 py-1 rounded-lg outline-none cursor-pointer transition-colors"
                title="Định dạng khối văn bản"
              >
                <span className="text-[11px] font-medium">
                  {selectedFormat === 'H1' ? 'Tiêu đề H1' :
                    selectedFormat === 'H2' ? 'Tiêu đề H2' :
                      selectedFormat === 'H3' ? 'Tiêu đề H3' :
                        selectedFormat === 'quote' ? 'Trích dẫn' :
                          selectedFormat === 'code' ? 'Mã nguồn' : 'Đoạn văn'}
                </span>
                <span className={`material-symbols-outlined text-[14px] text-slate-400 dark:text-[#ad8888] transition-transform duration-150 ${isFormatDropdownOpen ? 'rotate-180' : ''}`}>
                  arrow_drop_down
                </span>
              </button>

              {isFormatDropdownOpen && (
                <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-[#1e1a26] border border-slate-200 dark:border-[#3d3353] rounded-xl shadow-xl py-1 w-44">
                  {[
                    { value: 'H2', label: 'Tiêu đề H2' },
                    { value: 'H1', label: 'Tiêu đề H1' },
                    { value: 'H3', label: 'Tiêu đề H3' },
                    { value: 'p', label: 'Đoạn văn' },
                    { value: 'quote', label: 'Trích dẫn' },
                    { value: 'code', label: 'Mã nguồn (Code)' },
                  ].map((fmt) => (
                    <button
                      key={fmt.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => {
                        handleFormatDropdownChange(fmt.value);
                        setIsFormatDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${selectedFormat === fmt.value
                        ? 'bg-[#ff5167]/15 text-[#ff5167] font-bold'
                        : 'text-slate-700 dark:text-[#e8dff1] hover:bg-slate-100 dark:hover:bg-[#2c2835]'
                        }`}
                    >
                      <span>{fmt.label}</span>
                      {selectedFormat === fmt.value && (
                        <span className="material-symbols-outlined text-[14px] text-[#ff5167]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GROUP 2: Typography (B, I, U, S | Font Size) */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-0.5 shadow-sm relative">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleBoldToggle}
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs active:scale-95 transition-all ${isBoldActive ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm font-bold' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="In đậm chữ (B) - Ctrl+B"
              type="button"
            >
              B
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleItalicToggle}
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-serif italic text-xs font-semibold active:scale-95 transition-all ${isItalicActive ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm font-bold' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="In nghiêng (I) - Ctrl+I"
              type="button"
            >
              I
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUnderlineToggle}
              className={`w-7 h-7 flex items-center justify-center rounded-lg underline text-xs font-semibold active:scale-95 transition-all ${isUnderlineActive ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm font-bold' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Gạch chân (U) - Ctrl+U"
              type="button"
            >
              U
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleStrikethroughToggle}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${isStrikethroughActive ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Gạch ngang chữ (S)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">strikethrough_s</span>
            </button>

            <div className="h-4 w-px bg-slate-300 dark:bg-[#352f44] mx-0.5"></div>

            {/* Custom Word-like Font Size Dropdown */}
            <div className="relative inline-flex items-center" ref={fontSizeDropdownRef}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  setIsFontSizeDropdownOpen((prev) => !prev);
                  setIsFormatDropdownOpen(false);
                  setIsColorPickerOpen(false);
                  setIsLineHeightDropdownOpen(false);
                }}
                className="flex items-center justify-between gap-0.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#251d36] dark:hover:bg-[#352b48] text-slate-800 dark:text-[#e8dff1] text-xs font-bold px-1.5 py-1 rounded-lg border border-slate-200 dark:border-[#3d3353] outline-none cursor-pointer transition-colors min-w-[46px]"
                title="Cỡ chữ (Font size)"
              >
                <span className="text-[11px]">{selectedFontSize}</span>
                <span className={`material-symbols-outlined text-[13px] text-slate-400 dark:text-[#ad8888] transition-transform duration-150 ${isFontSizeDropdownOpen ? 'rotate-180' : ''}`}>
                  arrow_drop_down
                </span>
              </button>

              {isFontSizeDropdownOpen && (
                <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-[#1e1a26] border border-slate-200 dark:border-[#3d3353] rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto w-24 custom-scrollbar">
                  {FONT_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => {
                        applyFontSize(sz);
                        setIsFontSizeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1 text-xs text-left transition-colors ${String(selectedFontSize) === String(sz)
                        ? 'bg-[#ff5167]/15 text-[#ff5167] font-bold'
                        : 'text-slate-700 dark:text-[#e8dff1] hover:bg-slate-100 dark:hover:bg-[#2c2835]'
                        }`}
                    >
                      <span>{sz}</span>
                      {String(selectedFontSize) === String(sz) && (
                        <span className="material-symbols-outlined text-[14px] text-[#ff5167]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-[#352f44] mx-0.5"></div>

            {/* Text Color Picker (Only applies to highlighted/selected text) */}
            <div className="relative inline-flex items-center" ref={colorPickerRef}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  setIsColorPickerOpen((prev) => !prev);
                  setIsFormatDropdownOpen(false);
                  setIsFontSizeDropdownOpen(false);
                  setIsLineHeightDropdownOpen(false);
                }}
                className={`w-7 h-7 flex flex-col items-center justify-center rounded-lg active:scale-95 transition-all ${isColorPickerOpen || selectedTextColor
                  ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm'
                  : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'
                  }`}
                title="Màu chữ (Chỉ áp dụng cho phần chữ được bôi đen)"
              >
                <span className="font-bold text-[12px] leading-tight font-serif">A</span>
                <span
                  className="w-3.5 h-[3px] rounded-full mt-0.5 transition-colors"
                  style={{ backgroundColor: selectedTextColor || '#ff5167' }}
                />
              </button>

              {isColorPickerOpen && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-[#1e1a26] border border-slate-200 dark:border-[#3d3353] rounded-2xl shadow-2xl p-3 w-64 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#2d253d]">
                    <span className="text-xs font-bold text-slate-700 dark:text-[#e8dff1] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#ff5167]">format_color_text</span>
                      Màu chữ
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        applyTextColor('default');
                        setIsColorPickerOpen(false);
                      }}
                      className="text-[10px] text-slate-500 dark:text-[#a090b8] hover:text-rose-500 dark:hover:text-[#ff5167] font-semibold hover:underline cursor-pointer"
                    >
                      Mặc định
                    </button>
                  </div>

                  {/* Preset Colors Grid */}
                  <div className="grid grid-cols-6 gap-1.5 mb-3">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          applyTextColor(c.value);
                          setIsColorPickerOpen(false);
                        }}
                        title={c.name}
                        className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/15 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm relative cursor-pointer"
                        style={{ backgroundColor: c.value }}
                      >
                        {selectedTextColor?.toLowerCase() === c.value.toLowerCase() && (
                          <span className={`material-symbols-outlined text-[13px] ${c.value === '#ffffff' || c.value === '#f59e0b' || c.value === '#eab308' || c.value === '#4cd7f6' || c.value === '#84cc16' ? 'text-black' : 'text-white'}`}>
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#2d253d]">
                    <div className="text-[10px] font-semibold text-slate-400 dark:text-[#8f7eab] mb-1.5 uppercase tracking-wider">
                      Màu tùy chọn
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => {
                          setCustomColorHex(e.target.value);
                          applyTextColor(e.target.value);
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyTextColor(customColorHex);
                            setIsColorPickerOpen(false);
                          }
                        }}
                        placeholder="#ff5167"
                        className="flex-1 min-w-0 px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-[#251d36] border border-slate-200 dark:border-[#3d3353] text-slate-800 dark:text-white font-mono outline-none focus:border-[#ff5167]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          applyTextColor(customColorHex);
                          setIsColorPickerOpen(false);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold bg-[#ff5167] text-white rounded-lg hover:bg-[#ff3852] active:scale-95 transition-all shadow-sm shadow-[#ff5167]/20 flex-shrink-0 cursor-pointer"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GROUP 3: Alignment, Line Spacing, Lists, Quote & Code */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-0.5 shadow-sm">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAlignmentChange('left')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${textAlign === 'left' ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Căn trái"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">format_align_left</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAlignmentChange('center')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${textAlign === 'center' ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Căn giữa"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">format_align_center</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAlignmentChange('right')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${textAlign === 'right' ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Căn phải"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">format_align_right</span>
            </button>

            {/* Line Spacing / Line Height Dropdown */}
            <div className="relative inline-flex items-center" ref={lineHeightDropdownRef}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  setIsLineHeightDropdownOpen((prev) => !prev);
                  setIsFormatDropdownOpen(false);
                  setIsFontSizeDropdownOpen(false);
                  setIsColorPickerOpen(false);
                }}
                className={`h-7 flex items-center gap-0.5 px-1 rounded-lg active:scale-95 transition-all ${isLineHeightDropdownOpen
                  ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'
                  }`}
                title="Giãn cách dòng (Line Spacing)"
              >
                <span className="material-symbols-outlined text-[16px]">format_line_spacing</span>
                <span className="text-[10px] font-bold">{selectedLineHeight}</span>
              </button>

              {isLineHeightDropdownOpen && (
                <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-[#1e1a26] border border-slate-200 dark:border-[#3d3353] rounded-xl shadow-xl py-1 w-36">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8f7eab] border-b border-slate-100 dark:border-[#2d253d] mb-1">
                    Giãn cách dòng
                  </div>
                  {LINE_HEIGHT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => {
                        applyLineHeight(opt.value);
                        setIsLineHeightDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${String(selectedLineHeight) === String(opt.value)
                        ? 'bg-[#ff5167]/15 text-[#ff5167] font-bold'
                        : 'text-slate-700 dark:text-[#e8dff1] hover:bg-slate-100 dark:hover:bg-[#2c2835]'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {String(selectedLineHeight) === String(opt.value) && (
                        <span className="material-symbols-outlined text-[14px] text-[#ff5167]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-[#352f44] mx-0.5"></div>

            {/* Bullet List */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertBulletList()}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${isBulletListActive ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Danh sách gạch đầu dòng"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">format_list_bulleted</span>
            </button>

            {/* Numbered List */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertNumberedList()}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${isNumberedListActive ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Danh sách đánh số thứ tự"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">format_list_numbered</span>
            </button>

            {/* Quote 99 */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertQuote()}
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-serif font-bold text-xs active:scale-95 transition-all ${isQuoteActive ? 'bg-[#ff5167]/25 text-[#ff5167] border border-[#ff5167]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Khối trích dẫn (Quote)"
              type="button"
            >
              99
            </button>

            {/* Code Block </> */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertCode()}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${isCodeActive ? 'bg-sky-100 dark:bg-[#4cd7f6]/25 text-sky-600 dark:text-[#4cd7f6] border border-sky-300 dark:border-[#4cd7f6]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Khối mã nguồn (Code </>)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">code</span>
            </button>
          </div>

          {/* GROUP 4: Insert Media, Table, Link, Divider */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-0.5 shadow-sm">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => triggerImageUploadAt()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-[#221e2e] text-sky-600 dark:text-[#4cd7f6] hover:bg-sky-100 dark:hover:bg-[#2c2838] hover:brightness-110 transition-all text-xs font-semibold border border-sky-200 dark:border-[#3a3348] shadow-sm"
              title="Tải ảnh từ máy và chèn trực tiếp vào vị trí con trỏ"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
              <span className="text-[11px]">Chèn ảnh</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => triggerVideoUploadAt()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-[#2e1a24] text-rose-600 dark:text-[#ff5167] hover:bg-rose-100 dark:hover:bg-[#3c212f] hover:brightness-110 transition-all text-xs font-semibold border border-rose-200 dark:border-[#52293b] shadow-sm"
              title="Tải video từ máy tính và chèn trực tiếp vào vị trí con trỏ"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">video_file</span>
              <span className="text-[11px]">Tải video</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertVideo()}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-all"
              title="Chèn Video Embed (YouTube / Vimeo)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">smart_display</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertTable()}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-all"
              title="Chèn bảng dữ liệu 3x3"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">table_chart</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertColumns()}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#2c2835] active:scale-95 transition-all"
              title="Chèn văn bản song song 2 cột (Chèn văn bản cạnh đoạn văn)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">view_column</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertLink()}
              className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${isLinkActive ? 'bg-sky-100 dark:bg-[#4cd7f6]/25 text-sky-600 dark:text-[#4cd7f6] border border-sky-300 dark:border-[#4cd7f6]/40 shadow-sm' : 'text-slate-600 dark:text-[#ad8888] hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
              title="Chèn hoặc chỉnh sửa liên kết URL (Link)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">link</span>
            </button>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertDivider()}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#2c2835] active:scale-95 transition-all"
              title="Chèn đường kẻ phân cách ngang (Divider)"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">horizontal_rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 max-w-[1500px] w-full mx-auto p-3 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Visual Document Canvas */}
        <div className="xl:col-span-8 flex flex-col gap-6 w-full">
          <article className="w-full rounded-2xl bg-white dark:bg-[#1a1426]/90 backdrop-blur-xl p-4 sm:p-8 md:p-10 shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#352b48] relative transition-colors">

            {/* Document Header & Cover Image Area */}
            <div className="mb-6">
              <div className="mb-4">
                {coverUploadState?.uploading ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-white/20 bg-black shadow-xl">
                    <ImageUploadModal
                      countdown={coverUploadState.countdown}
                      fileName={coverUploadState.fileName}
                      statusText={coverUploadState.statusText}
                      isCover={true}
                      mediaType="image"
                      className="min-h-[280px] sm:min-h-[340px]"
                    />
                  </div>
                ) : coverImage ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/40 bg-slate-100 dark:bg-[#151025] shadow-xl">
                    <OptimizedImage
                      src={coverImage}
                      alt="Ảnh bìa bài viết"
                      sizes="(max-width: 1200px) 100vw, 1200px"
                      containerClassName="w-full max-h-[380px]"
                      className="w-full max-h-[380px] object-cover rounded-2xl transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 dark:bg-[#1e1533]/90 text-white hover:bg-[#ff5167] text-xs font-semibold backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95"
                        title="Thay đổi ảnh bìa"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                        <span>Đổi ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="p-1.5 rounded-xl bg-slate-900/80 dark:bg-[#1e1533]/90 text-rose-400 hover:text-white hover:bg-rose-600 text-xs font-semibold backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95"
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
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#281e3d] border border-dashed border-slate-300 dark:border-[#443660] hover:border-[#ff5167] transition-all group/btn"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#ff5167] group-hover/btn:scale-110 transition-transform">
                        add_photo_alternate
                      </span>
                      <span>+ Thêm ảnh bìa trên tiêu đề</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Document Title Input Field */}
              <div className="pt-6 pb-2">
                <RichEditableBlock
                  blockId="doc-title"
                  html={title}
                  placeholder="Nhập tiêu đề bài viết tại đây..."
                  onChange={(val) => setTitle(val)}
                  onFocus={() => {
                    setFocusedBlockId('doc-title');
                    updateToolbarActiveStates('doc-title');
                  }}
                  onSelectionChange={() => updateToolbarActiveStates('doc-title')}
                  inputRef={(el) => {
                    inputRefs.current['doc-title'] = el;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (inputRefs.current['doc-sapo']) {
                        inputRefs.current['doc-sapo'].focus();
                      }
                    }
                  }}
                  className="w-full bg-transparent text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-display font-bold outline-none leading-normal tracking-tight transition-all text-left break-words min-h-[56px] py-1.5 overflow-visible"
                />
              </div>

              {/* Sapo / Lead Paragraph (Lời dẫn mở đầu liền mạch) */}
              <div className="mb-6 pt-2">
                <RichEditableBlock
                  blockId="doc-sapo"
                  html={summary}
                  placeholder="Tóm tắt bài viết..."
                  onChange={(val) => setSummary(val)}
                  onFocus={() => {
                    setFocusedBlockId('doc-sapo');
                    updateToolbarActiveStates('doc-sapo');
                  }}
                  onSelectionChange={() => updateToolbarActiveStates('doc-sapo')}
                  inputRef={(el) => {
                    inputRefs.current['doc-sapo'] = el;
                  }}
                  className="w-full bg-transparent text-[12px] text-slate-500 dark:text-[#a898be] font-medium italic outline-none leading-relaxed transition-all break-words min-h-[32px] py-1 overflow-visible"
                />
              </div>

              {/* SEQUENTIAL VISUAL BLOCKS (Unified Seamless Word-like WYSIWYG) */}
              <div className="min-h-[300px] text-slate-800 dark:text-[#f1eaff]">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="relative group/block">
                    {/* Render Block: HEADING */}
                    {block.type === 'heading' && (
                      <div className="relative my-3">
                        <RichEditableBlock
                          blockId={block.id}
                          inputRef={(el) => (inputRefs.current[block.id] = el)}
                          html={block.text}
                          onChange={(val) => updateBlock(block.id, { text: val })}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            lastActiveIndexRef.current = idx;
                            setSelectedFormat(block.level || 'H2');
                            updateToolbarActiveStates(block.id);
                          }}
                          onSelectionChange={() => {
                            lastActiveIndexRef.current = idx;
                            updateToolbarActiveStates(block.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              insertBlockAt(idx, { id: `p-${Date.now()}`, type: 'paragraph', text: '' });
                            }
                          }}
                          placeholder={`Tiêu đề mục ${block.level || 'H2'}...`}
                          className={`w-full bg-transparent ${block.level === 'H1' ? 'text-2xl sm:text-3xl font-bold' : block.level === 'H3' ? 'text-lg sm:text-xl font-semibold' : 'text-xl sm:text-2xl font-bold'} text-slate-900 dark:text-white font-display pt-2 pb-1 transition-all outline-none ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left'}`}
                          style={{ color: block.color || undefined, lineHeight: block.lineHeight || undefined }}
                        />
                      </div>
                    )}

                    {/* Render Block: PARAGRAPH */}
                    {block.type === 'paragraph' && (
                      <div className="relative my-1">
                        <RichEditableBlock
                          blockId={block.id}
                          inputRef={(el) => (inputRefs.current[block.id] = el)}
                          html={block.text}
                          onChange={(val) => updateBlock(block.id, { text: val })}
                          onPasteImage={(file) => {
                            const ctx = captureCursorContext();
                            handleImageFileInsert(file, ctx.blockIdx, ctx.splitData);
                          }}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            lastActiveIndexRef.current = idx;
                            setSelectedFormat('p');
                            updateToolbarActiveStates(block.id);
                          }}
                          onSelectionChange={() => {
                            lastActiveIndexRef.current = idx;
                            updateToolbarActiveStates(block.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && (!block.text || block.text === '<br>' || block.text === '<p><br></p>') && blocks.length > 1) {
                              e.preventDefault();
                              const prevIdx = Math.max(0, idx - 1);
                              deleteBlock(block.id);
                              const prevBlock = blocks[prevIdx];
                              if (prevBlock && inputRefs.current[prevBlock.id]) {
                                inputRefs.current[prevBlock.id].focus();
                              }
                            }
                          }}
                          placeholder="Nhập nội dung văn bản..."
                          className={`w-full min-h-[28px] bg-transparent text-slate-800 dark:text-[#f1eaff] text-base sm:text-lg leading-relaxed font-body font-normal transition-all outline-none py-1 ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left'}`}
                          style={{ color: block.color || undefined, lineHeight: block.lineHeight || undefined }}
                        />
                      </div>
                    )}

                    {/* Render Block: LIST */}
                    {block.type === 'list' && (
                      <div className="my-4 ml-6 sm:ml-8 pl-2 relative group/list border-l-2 border-[#ff5167]/30 pl-4 py-1">
                        <div className="space-y-2">
                          {(block.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-3">
                              <span className="text-[#ff5167] font-mono text-base select-none font-bold min-w-[18px] text-center">
                                {block.listType === 'numbered' ? `${itemIdx + 1}.` : '•'}
                              </span>
                              <input
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...block.items];
                                  newItems[itemIdx] = e.target.value;
                                  updateBlock(block.id, { items: newItems });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const newItems = [...block.items];
                                    newItems.splice(itemIdx + 1, 0, '');
                                    updateBlock(block.id, { items: newItems });
                                  } else if (e.key === 'Backspace' && !item && block.items.length > 1) {
                                    e.preventDefault();
                                    const newItems = block.items.filter((_, i) => i !== itemIdx);
                                    updateBlock(block.id, { items: newItems });
                                  }
                                }}
                                className="w-full bg-transparent text-base text-slate-800 dark:text-[#e8dff1] outline-none"
                                placeholder="Nhập mục danh sách..."
                              />
                              <button
                                onClick={() => {
                                  const newItems = block.items.filter((_, i) => i !== itemIdx);
                                  updateBlock(block.id, { items: newItems.length > 0 ? newItems : [''] });
                                }}
                                className="opacity-0 group-hover/list:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition-opacity"
                                title="Xóa dòng"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2.5 flex items-center gap-4">
                          <button
                            onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}
                            className="text-xs text-sky-600 dark:text-[#4cd7f6] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            <span>Thêm dòng</span>
                          </button>
                          <button
                            onClick={() => updateBlock(block.id, { listType: block.listType === 'numbered' ? 'bullet' : 'numbered' })}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 flex items-center gap-1 font-medium"
                          >
                            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                            <span>Đổi sang {block.listType === 'numbered' ? 'Gạch đầu dòng (•)' : 'Đánh số (1. 2.)'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Render Block: TABLE */}
                    {block.type === 'table' && (
                      <div className="my-5 rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#221e2a] border border-slate-200 dark:border-[#2c2835] relative group/tbl shadow-sm">
                        <div className="p-2 bg-slate-100 dark:bg-[#1b1724] flex items-center justify-between border-b border-slate-200 dark:border-[#2c2835] text-xs font-mono text-sky-600 dark:text-[#4cd7f6]">
                          <span>Bảng dữ liệu</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167]"
                            title="Xóa bảng"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <div className="p-3 overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-[#373340]">
                                {(block.headers || []).map((h, hIdx) => (
                                  <th key={hIdx} className="p-2 font-bold text-rose-600 dark:text-[#ffb3b5]">
                                    <input
                                      value={h}
                                      onChange={(e) => {
                                        const newHeaders = [...block.headers];
                                        newHeaders[hIdx] = e.target.value;
                                        updateBlock(block.id, { headers: newHeaders });
                                      }}
                                      className="bg-transparent w-full outline-none font-bold text-rose-600 dark:text-[#ffb3b5]"
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(block.rows || []).map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-slate-200 dark:border-[#2c2835] hover:bg-slate-100/60 dark:hover:bg-[#2c2835]/30">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 text-slate-800 dark:text-[#e8dff1]">
                                      <input
                                        value={cell}
                                        onChange={(e) => {
                                          const newRows = [...block.rows];
                                          newRows[rIdx][cIdx] = e.target.value;
                                          updateBlock(block.id, { rows: newRows });
                                        }}
                                        className="bg-transparent w-full outline-none text-slate-800 dark:text-[#e8dff1]"
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
                              className="text-xs text-sky-600 dark:text-[#4cd7f6] hover:underline font-semibold"
                            >
                              + Thêm dòng
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Render Block: VIDEO */}
                    {block.type === 'video' && (
                      block.uploading ? (
                        <div className="my-6 max-w-3xl mx-auto">
                          <ImageUploadModal
                            countdown={block.countdown}
                            fileName={block.fileName || block.caption}
                            statusText={block.statusText}
                            mediaType="video"
                            className="aspect-video"
                          />
                        </div>
                      ) : (
                        <div className="my-6 max-w-3xl mx-auto relative group/vid">
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-200 dark:border-white/10 flex items-center justify-center">
                            {block.url?.startsWith('blob:') || block.url?.startsWith('data:') || block.url?.includes('/video/upload/') || block.url?.includes('.mp4') || block.url?.includes('.webm') ? (
                              <video
                                src={block.url}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <iframe
                                src={formatVideoEmbedUrl(block.url)}
                                title="Video Player"
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            )}
                            <button
                              onClick={() => deleteBlock(block.id)}
                              className="absolute top-3 right-3 opacity-0 group-hover/vid:opacity-100 p-1.5 rounded-xl bg-slate-900/80 text-rose-400 hover:bg-rose-600 hover:text-white backdrop-blur-md shadow-md transition-all active:scale-95 z-10"
                              title="Xóa video"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                          <div className="mt-2 text-center">
                            <input
                              value={block.caption || ''}
                              onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                              className="w-full text-center bg-transparent text-xs text-slate-500 dark:text-[#a898be] italic outline-none hover:text-slate-700 dark:hover:text-[#e8dff1] focus:text-sky-600 dark:focus:text-[#4cd7f6] transition-colors"
                              placeholder="Chú thích video..."
                            />
                          </div>
                        </div>
                      )
                    )}

                    {/* Render Block: DIVIDER */}
                    {block.type === 'divider' && (
                      <div className="my-6 relative flex items-center justify-center group/div">
                        <div className="w-full border-t border-slate-200 dark:border-[#373340]"></div>
                        <div className="absolute bg-white dark:bg-[#1e1a26] px-3 text-slate-500 dark:text-[#ad8888] text-xs font-mono flex items-center gap-1 border border-slate-200 dark:border-transparent rounded-full shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                          <span>Đường phân cách</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="opacity-0 group-hover/div:opacity-100 ml-2 text-rose-500 dark:text-[#ff5167]"
                            title="Xóa phân cách"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Render Block: IN-LINE VISUAL IMAGE WITH RESIZING & ALIGNMENT */}
                    {block.type === 'image' && (
                      block.uploading ? (
                        <div className="my-5 max-w-3xl mx-auto">
                          <ImageUploadModal
                            countdown={block.countdown}
                            fileName={block.fileName || block.caption}
                            statusText={block.statusText}
                            mediaType="image"
                            className="min-h-[240px] sm:min-h-[280px]"
                          />
                        </div>
                      ) : (
                        <ResizableImageBlock
                          block={block}
                          onUpdate={(newFields) => {
                            updateBlock(block.id, newFields);
                            pushHistory(blocks);
                          }}
                          onDelete={() => deleteBlock(block.id)}
                          onReplace={() => triggerReplaceImage(block.id)}
                          onPaste={() => handlePasteFromClipboardToBlock(block.id)}
                        />
                      )
                    )}

                    {/* Render Block: QUOTE */}
                    {block.type === 'quote' && (
                      <div className="my-5 pl-5 py-2.5 bg-slate-50/60 dark:bg-[#161127] border-l-4 border-[#ff5167] rounded-r-xl relative group/quote">
                        <RichEditableBlock
                          blockId={block.id}
                          inputRef={(el) => (inputRefs.current[block.id] = el)}
                          html={block.text}
                          onChange={(val) => updateBlock(block.id, { text: val })}
                          onPasteImage={(file) => {
                            const ctx = captureCursorContext();
                            handleImageFileInsert(file, ctx.blockIdx, ctx.splitData);
                          }}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            lastActiveIndexRef.current = idx;
                            setSelectedFormat('quote');
                            updateToolbarActiveStates(block.id);
                          }}
                          onSelectionChange={() => {
                            lastActiveIndexRef.current = idx;
                            updateToolbarActiveStates(block.id);
                          }}
                          placeholder="Nội dung trích dẫn quan trọng..."
                          className="w-full bg-transparent text-base sm:text-lg italic text-slate-800 dark:text-[#e8dff1] min-h-[36px] outline-none"
                          style={{ color: block.color || undefined, lineHeight: block.lineHeight || undefined }}
                        />
                        <input
                          value={block.author || ''}
                          onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                          className="w-full bg-transparent text-xs text-[#ff5167] placeholder-slate-400 dark:placeholder-[#ad8888]/50 outline-none mt-1 font-semibold"
                          placeholder="— Tác giả trích dẫn"
                        />
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="absolute right-2 top-2 opacity-0 group-hover/quote:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all"
                          title="Xóa trích dẫn"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    )}

                    {/* Render Block: CODE */}
                    {block.type === 'code' && (
                      <div className="my-4 p-4 rounded-xl bg-slate-900 dark:bg-[#100c18] border border-slate-800 dark:border-[#373340] relative shadow-md">
                        <textarea
                          ref={(el) => (inputRefs.current[block.id] = el)}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            setSelectedFormat('code');
                          }}
                          value={block.code || block.text || ''}
                          onChange={(e) => updateBlock(block.id, { code: e.target.value, text: e.target.value })}
                          className="w-full min-h-[80px] bg-transparent text-xs font-mono text-sky-400 dark:text-[#4cd7f6] placeholder-slate-500 dark:placeholder-[#ad8888]/40 outline-none resize-none overflow-hidden leading-relaxed"
                          placeholder="// Nhập mã nguồn tại đây..."
                        />
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 p-1 text-slate-400 dark:text-[#ad8888] hover:text-rose-400 dark:hover:text-[#ff5167] transition-all"
                          title="Xóa khối code"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    )}

                    {/* Render Block: COLUMNS (Side-by-side seamless Word-like layout: Text & Image / Text & Text) */}
                    {block.type === 'columns' && (
                      <div className="my-5 w-full relative group/cols py-2">
                        {/* Word-like Floating/Hover Control Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-dashed border-slate-200 dark:border-white/10 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-[11px]">
                              <span className="material-symbols-outlined text-[15px] text-sky-500">view_column</span>
                              <span>Chia 2 cột song song</span>
                            </span>

                            {/* Ratio Selector */}
                            <div className="flex items-center bg-slate-100 dark:bg-[#120d20] border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateBlock(block.id, { layout: '50-50' })}
                                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                                  (block.layout || '50-50') === '50-50'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Chia đều 50% - 50%"
                              >
                                50:50
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBlock(block.id, { layout: '60-40' })}
                                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                                  block.layout === '60-40'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Trái 60% - Phải 40%"
                              >
                                60:40
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBlock(block.id, { layout: '40-60' })}
                                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                                  block.layout === '40-60'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Trái 40% - Phải 60%"
                              >
                                40:60
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBlock(block.id, { layout: '70-30' })}
                                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                                  block.layout === '70-30'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Trái 70% - Phải 30%"
                              >
                                70:30
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBlock(block.id, { layout: '30-70' })}
                                className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                                  block.layout === '30-70'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                title="Trái 30% - Phải 70%"
                              >
                                30:70
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Swap columns */}
                            <button
                              type="button"
                              onClick={() => {
                                updateBlock(block.id, {
                                  leftType: block.rightType || 'text',
                                  rightType: block.leftType || 'text',
                                  leftTitle: block.rightTitle || '',
                                  rightTitle: block.leftTitle || '',
                                  leftText: block.rightText || '',
                                  rightText: block.leftText || '',
                                  leftImageUrl: block.rightImageUrl || '',
                                  rightImageUrl: block.leftImageUrl || '',
                                  leftImageCaption: block.rightImageCaption || '',
                                  rightImageCaption: block.leftImageCaption || '',
                                  leftImageHeight: block.rightImageHeight,
                                  rightImageHeight: block.leftImageHeight
                                });
                                pushHistory(blocks);
                              }}
                              className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg flex items-center gap-1 transition-colors"
                              title="Hoán đổi nội dung cột trái và phải"
                            >
                              <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
                              <span className="text-[11px]">Đổi vị trí</span>
                            </button>

                            {/* Delete block */}
                            <button
                              type="button"
                              onClick={() => deleteBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:text-[#ad8888] dark:hover:text-[#ff5167] rounded-lg transition-colors"
                              title="Xóa khối song song"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Columns Content Canvas (Seamless Word-like page integration) */}
                        <div
                          className={`grid gap-6 sm:gap-8 items-start ${
                            block.layout === '60-40' || block.layout === '40-60' || block.layout === '70-30' || block.layout === '30-70'
                              ? 'grid-cols-1 md:grid-cols-12'
                              : 'grid-cols-1 md:grid-cols-2'
                          }`}
                        >
                          {/* LEFT SIDE */}
                          <div
                            className={`flex flex-col gap-2 relative ${
                              block.layout === '70-30'
                                ? 'md:col-span-8'
                                : block.layout === '30-70'
                                ? 'md:col-span-4'
                                : block.layout === '60-40'
                                ? 'md:col-span-7'
                                : block.layout === '40-60'
                                ? 'md:col-span-5'
                                : ''
                            }`}
                          >
                            {/* Mode Toggle Header */}
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-white/5">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Cột trái
                              </span>
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1f192d] p-0.5 rounded-lg border border-slate-200 dark:border-white/5 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => updateBlock(block.id, { leftType: 'text' })}
                                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                                    (block.leftType || 'text') === 'text'
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  Văn bản
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateBlock(block.id, { leftType: 'image' })}
                                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                                    block.leftType === 'image'
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  Hình ảnh
                                </button>
                              </div>
                            </div>

                            {/* Left Side Content: TEXT */}
                            {(block.leftType || 'text') === 'text' ? (
                              <div className="space-y-1">
                                <RichEditableBlock
                                  blockId={`${block.id}-left`}
                                  inputRef={(el) => (inputRefs.current[`${block.id}-left`] = el)}
                                  html={block.leftText}
                                  onChange={(val) => updateBlock(block.id, { leftText: val })}
                                  onPasteImage={(file) => {
                                    const ctx = captureCursorContext();
                                    handleImageFileInsert(file, ctx.blockIdx, ctx.splitData);
                                  }}
                                  onFocus={() => {
                                    setFocusedBlockId(block.id);
                                    lastActiveIndexRef.current = idx;
                                    updateToolbarActiveStates(block.id);
                                  }}
                                  onSelectionChange={() => {
                                    lastActiveIndexRef.current = idx;
                                    updateToolbarActiveStates(block.id);
                                  }}
                                  placeholder="Nhập nội dung văn bản cột trái..."
                                  className="w-full min-h-[90px] bg-transparent text-slate-800 dark:text-[#f1eaff] text-base leading-relaxed outline-none py-1"
                                />
                              </div>
                            ) : (
                              /* Left Side Content: IMAGE */
                              <div className="flex flex-col gap-2">
                                {block.leftUploading ? (
                                  <div className="h-44 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sky-400/60 bg-sky-50/50 dark:bg-sky-950/20">
                                    <span className="material-symbols-outlined text-sky-500 animate-spin text-2xl">
                                      progress_activity
                                    </span>
                                    <span className="text-xs text-sky-600 font-medium">Đang tối ưu & tải ảnh lên...</span>
                                  </div>
                                ) : block.leftImageUrl ? (
                                  <ColumnImageResizable
                                    imageUrl={block.leftImageUrl}
                                    caption={block.leftImageCaption}
                                    imageHeight={block.leftImageHeight}
                                    onUpdate={(fields) => updateBlock(block.id, { leftImageHeight: fields.height })}
                                    onUploadClick={() => triggerColumnImageUpload(block.id, 'left')}
                                    onPasteClick={() => handlePasteFromClipboardToColumn(block.id, 'left')}
                                    onDelete={() => updateBlock(block.id, { leftImageUrl: '' })}
                                  />
                                ) : (
                                  <div
                                    tabIndex={0}
                                    onPaste={(e) => {
                                      const items = e.clipboardData?.items;
                                      if (items) {
                                        for (let i = 0; i < items.length; i++) {
                                          if (items[i].type.startsWith('image/')) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const file = items[i].getAsFile();
                                            if (file) handleColumnImageFile(file, block.id, 'left');
                                            return;
                                          }
                                        }
                                      }
                                      const text = e.clipboardData?.getData('text');
                                      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateBlock(block.id, { leftType: 'image', leftImageUrl: text.trim() });
                                        pushHistory(blocks);
                                        toast.success('Đã dán link ảnh thành công!');
                                      }
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const file = e.dataTransfer?.files?.[0];
                                      if (file && file.type.startsWith('image/')) {
                                        handleColumnImageFile(file, block.id, 'left');
                                      }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="min-h-[160px] p-4 flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-white/5 transition-all outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 group/colupload"
                                  >
                                    <span className="material-symbols-outlined text-3xl text-sky-500">
                                      add_photo_alternate
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
                                      Tải ảnh hoặc dán ảnh vào đây
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerColumnImageUpload(block.id, 'left');
                                        }}
                                        className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">upload</span>
                                        <span>Tải từ máy</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePasteFromClipboardToColumn(block.id, 'left');
                                        }}
                                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                                        title="Dán từ Clipboard (Ctrl+V)"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">content_paste</span>
                                        <span>Dán ảnh (Ctrl+V)</span>
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-slate-400">Kéo thả ảnh hoặc dán link ảnh</span>
                                  </div>
                                )}
                                <input
                                  value={block.leftImageCaption || ''}
                                  onChange={(e) => updateBlock(block.id, { leftImageCaption: e.target.value })}
                                  placeholder="Chú thích ảnh..."
                                  className="w-full text-center bg-transparent text-xs text-slate-500 dark:text-[#a898be] italic outline-none"
                                />
                              </div>
                            )}
                          </div>

                          {/* RIGHT SIDE */}
                          <div
                            className={`flex flex-col gap-2 relative ${
                              block.layout === '70-30'
                                ? 'md:col-span-4'
                                : block.layout === '30-70'
                                ? 'md:col-span-8'
                                : block.layout === '60-40'
                                ? 'md:col-span-5'
                                : block.layout === '40-60'
                                ? 'md:col-span-7'
                                : ''
                            }`}
                          >
                            {/* Mode Toggle Header */}
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-white/5">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Cột phải
                              </span>
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1f192d] p-0.5 rounded-lg border border-slate-200 dark:border-white/5 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => updateBlock(block.id, { rightType: 'text' })}
                                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                                    (block.rightType || 'text') === 'text'
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  Văn bản
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateBlock(block.id, { rightType: 'image' })}
                                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                                    block.rightType === 'image'
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  Hình ảnh
                                </button>
                              </div>
                            </div>

                            {/* Right Side Content: TEXT */}
                            {(block.rightType || 'text') === 'text' ? (
                              <div className="space-y-1">
                                <RichEditableBlock
                                  blockId={`${block.id}-right`}
                                  inputRef={(el) => (inputRefs.current[`${block.id}-right`] = el)}
                                  html={block.rightText}
                                  onChange={(val) => updateBlock(block.id, { rightText: val })}
                                  onPasteImage={(file) => {
                                    const ctx = captureCursorContext();
                                    handleImageFileInsert(file, ctx.blockIdx, ctx.splitData);
                                  }}
                                  onFocus={() => {
                                    setFocusedBlockId(block.id);
                                    lastActiveIndexRef.current = idx;
                                    updateToolbarActiveStates(block.id);
                                  }}
                                  onSelectionChange={() => {
                                    lastActiveIndexRef.current = idx;
                                    updateToolbarActiveStates(block.id);
                                  }}
                                  placeholder="Nhập nội dung văn bản bên cạnh..."
                                  className="w-full min-h-[90px] bg-transparent text-slate-800 dark:text-[#f1eaff] text-base leading-relaxed outline-none py-1"
                                />
                              </div>
                            ) : (
                              /* Right Side Content: IMAGE */
                              <div className="flex flex-col gap-2">
                                {block.rightUploading ? (
                                  <div className="h-44 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sky-400/60 bg-sky-50/50 dark:bg-sky-950/20">
                                    <span className="material-symbols-outlined text-sky-500 animate-spin text-2xl">
                                      progress_activity
                                    </span>
                                    <span className="text-xs text-sky-600 font-medium">Đang tối ưu & tải ảnh lên...</span>
                                  </div>
                                ) : block.rightImageUrl ? (
                                  <ColumnImageResizable
                                    imageUrl={block.rightImageUrl}
                                    caption={block.rightImageCaption}
                                    imageHeight={block.rightImageHeight}
                                    onUpdate={(fields) => updateBlock(block.id, { rightImageHeight: fields.height })}
                                    onUploadClick={() => triggerColumnImageUpload(block.id, 'right')}
                                    onPasteClick={() => handlePasteFromClipboardToColumn(block.id, 'right')}
                                    onDelete={() => updateBlock(block.id, { rightImageUrl: '' })}
                                  />
                                ) : (
                                  <div
                                    tabIndex={0}
                                    onPaste={(e) => {
                                      const items = e.clipboardData?.items;
                                      if (items) {
                                        for (let i = 0; i < items.length; i++) {
                                          if (items[i].type.startsWith('image/')) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const file = items[i].getAsFile();
                                            if (file) handleColumnImageFile(file, block.id, 'right');
                                            return;
                                          }
                                        }
                                      }
                                      const text = e.clipboardData?.getData('text');
                                      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateBlock(block.id, { rightType: 'image', rightImageUrl: text.trim() });
                                        pushHistory(blocks);
                                        toast.success('Đã dán link ảnh thành công!');
                                      }
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const file = e.dataTransfer?.files?.[0];
                                      if (file && file.type.startsWith('image/')) {
                                        handleColumnImageFile(file, block.id, 'right');
                                      }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="min-h-[160px] p-4 flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-white/5 transition-all outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 group/colupload"
                                  >
                                    <span className="material-symbols-outlined text-3xl text-sky-500">
                                      add_photo_alternate
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
                                      Tải ảnh hoặc dán ảnh vào đây
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerColumnImageUpload(block.id, 'right');
                                        }}
                                        className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">upload</span>
                                        <span>Tải từ máy</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePasteFromClipboardToColumn(block.id, 'right');
                                        }}
                                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                                        title="Dán từ Clipboard (Ctrl+V)"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">content_paste</span>
                                        <span>Dán ảnh (Ctrl+V)</span>
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-slate-400">Kéo thả ảnh hoặc dán link ảnh</span>
                                  </div>
                                )}
                                <input
                                  value={block.rightImageCaption || ''}
                                  onChange={(e) => updateBlock(block.id, { rightImageCaption: e.target.value })}
                                  placeholder="Chú thích ảnh..."
                                  className="w-full text-center bg-transparent text-xs text-slate-500 dark:text-[#a898be] italic outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>

            {/* Document Bottom Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-[#2c2835] flex flex-wrap items-center justify-between text-slate-500 dark:text-[#ad8888] text-xs font-medium">
              <div className="flex items-center gap-4">
                <span>Trạng thái: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{isPublic ? 'Sẵn sàng xuất bản' : 'Bản nháp khả dụng'}</strong></span>
                <span>Khối nội dung: <strong className="text-slate-800 dark:text-[#e8dff1] font-mono">{blocks.length} khối</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Đã kiểm tra chuẩn SEO &amp; Ảnh WebP</span>
              </div>
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN: Settings Drawer / Inspector */}
        <aside
          className={`xl:col-span-4 flex flex-col gap-4 ${isDrawerOpen ? 'flex' : 'hidden xl:flex'}`}
          id="inspector-drawer"
        >
          {/* Box 1: Quick Publishing & Scheduling */}
          <div className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-lg dark:shadow-xl border border-slate-200 dark:border-[#2c2835] relative overflow-hidden transition-colors">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#2c2835]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 dark:text-[#ffb3b5] text-[20px]">tune</span>
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1]">Cài đặt xuất bản</h3>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${isPublic ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-[#ff5167]/10 text-rose-600 dark:text-[#ffb3b5]'}`}>
                {isPublic ? 'PUBLISHED' : 'DRAFT'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#e8dff1]">Hiển thị công khai</span>
                  <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Ai cũng có thể truy cập bài viết này</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 dark:bg-[#373340] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff5167]"></div>
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Lên lịch đăng bài</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15111d] text-slate-900 dark:text-[#e8dff1] border border-slate-200 dark:border-[#2c2835]">
                  <span className="material-symbols-outlined text-[18px] text-sky-600 dark:text-[#4cd7f6]">calendar_today</span>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-transparent text-slate-900 dark:text-[#e8dff1] text-xs outline-none w-full font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Featured Cover Image */}
          <div className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-lg dark:shadow-xl border border-slate-200 dark:border-[#2c2835] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 dark:text-[#4cd7f6] text-[20px]">image</span>
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1]">Ảnh đại diện</h3>
              </div>
              <button
                onClick={() => coverFileInputRef.current?.click()}
                className="text-xs font-semibold text-rose-600 dark:text-[#ffb3b5] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">upload</span>
                <span>{coverImage ? 'Tải ảnh mới' : '+ Tải ảnh'}</span>
              </button>
            </div>

            {coverUploadState?.uploading ? (
              <div className="rounded-xl overflow-hidden bg-black border border-white/20 shadow-md">
                <ImageUploadModal
                  countdown={coverUploadState.countdown}
                  fileName={coverUploadState.fileName}
                  statusText={coverUploadState.statusText}
                  isCover={true}
                  mediaType="image"
                  className="min-h-[160px] p-3 text-xs"
                />
              </div>
            ) : coverImage ? (
              <div className="relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-[#100c18] shadow-md border border-slate-200 dark:border-[#2c2835]">
                <OptimizedImage
                  src={coverImage}
                  alt="Ảnh bìa bài viết"
                  sizes="400px"
                  containerClassName="w-full h-40"
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-[#100c18] via-transparent to-transparent opacity-80 pointer-events-none z-10"></div>
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-sky-300 dark:text-[#4cd7f6] bg-black/60 dark:bg-[#100c18]/80 backdrop-blur-md px-2 py-0.5 rounded">
                    WebP Format
                  </span>
                  <button
                    onClick={() => setCoverImage('')}
                    className="p-1 rounded bg-slate-900/80 dark:bg-[#2c2835]/90 text-rose-300 dark:text-[#ffb4ab] hover:bg-[#ff5167] hover:text-white transition-colors"
                    title="Gỡ ảnh"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => coverFileInputRef.current?.click()}
                className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-[#373340] hover:border-sky-500 dark:hover:border-[#4cd7f6] flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-[#15111d]/50 group"
              >
                <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-[#ad8888] group-hover:text-sky-500 dark:group-hover:text-[#4cd7f6] transition-colors mb-1">
                  add_photo_alternate
                </span>
                <span className="text-xs text-slate-500 dark:text-[#ad8888] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  Nhấp để tải ảnh bìa (.webp)
                </span>
              </div>
            )}
          </div>

          {/* Box 3: Taxonomy & Tags */}
          <div className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-lg dark:shadow-xl border border-slate-200 dark:border-[#2c2835] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-rose-500 dark:text-[#ffb3b5] text-[20px]">category</span>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1]">Phân loại &amp; Thẻ tags</h3>
            </div>

            {/* Category Section */}
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Danh mục chính</label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] font-display font-medium text-sky-600 dark:text-[#4cd7f6] hover:underline flex items-center gap-0.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Thêm danh mục</span>
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-50 dark:bg-[#15111d] border border-sky-400/80 dark:border-[#4cd7f6]/60 shadow-sm animate-fadeIn">
                  <input
                    ref={newCategoryInputRef}
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }
                    }}
                    placeholder="Nhập tên danh mục..."
                    className="bg-transparent text-slate-900 dark:text-[#e8dff1] text-xs outline-none px-2 flex-1 min-w-0 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 dark:bg-[#03b5d3] dark:hover:bg-[#4cd7f6] text-white text-xs font-semibold shadow transition-all flex items-center gap-1 flex-shrink-0"
                    title="Lưu danh mục"
                  >
                    <span className="material-symbols-outlined text-[13px]">check</span>
                    <span>Thêm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                    title="Hủy"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="relative px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15111d] text-slate-900 dark:text-[#e8dff1] border border-slate-200 dark:border-[#2c2835]">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="bg-transparent text-slate-900 dark:text-[#e8dff1] text-xs outline-none w-full cursor-pointer pr-6 font-medium"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} className="bg-white dark:bg-[#15111d] text-slate-900 dark:text-white" value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__NEW__" className="bg-white dark:bg-[#15111d] text-sky-600 dark:text-[#4cd7f6] font-semibold">
                      + Thêm danh mục mới...
                    </option>
                  </select>
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Thẻ tìm kiếm (Tags)</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#15111d] min-h-[44px] border border-slate-200 dark:border-[#2c2835]">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-[#2c2835] text-rose-600 dark:text-[#ffb3b5] text-xs font-medium"
                  >
                    {tag}
                    <span
                      onClick={() => handleRemoveTag(tag)}
                      className="material-symbols-outlined text-[14px] cursor-pointer hover:text-slate-900 dark:hover:text-white"
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
                  className="bg-transparent text-slate-900 dark:text-[#e8dff1] text-xs outline-none px-1 flex-1 min-w-[100px] placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Box 4: SEO Settings */}
          <div className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-lg dark:shadow-xl border border-slate-200 dark:border-[#2c2835] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-[20px]">travel_explore</span>
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1]">Tối ưu SEO Google</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-display font-semibold">
                {title.trim() ? 'Điểm 94/100' : 'Chưa nhập'}
              </span>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Đường dẫn tĩnh (Slug URL)</label>
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15111d] text-slate-900 dark:text-[#e8dff1] text-xs border border-slate-200 dark:border-[#2c2835] overflow-x-auto">
                <span className="text-slate-400 dark:text-[#ad8888] select-none font-medium">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="duong-dan-tinh"
                  className="bg-transparent text-sky-600 dark:text-[#4cd7f6] outline-none flex-1 font-medium text-xs placeholder-slate-400 dark:placeholder-slate-500 ml-0.5"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Thẻ mô tả Meta Description</label>
                <span className="text-[11px] font-display text-slate-500 dark:text-[#ad8888]">{metaDesc.length}/160 ký tự</span>
              </div>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="Mô tả tóm tắt cho công cụ tìm kiếm Google..."
                rows="3"
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] text-slate-900 dark:text-[#e8dff1] text-xs resize-none outline-none leading-relaxed border border-slate-200 dark:border-[#2c2835] placeholder-slate-400 dark:placeholder-slate-500 font-normal"
              />
            </div>
          </div>

          {/* Box 5: Live Analytics */}
          <div className="rounded-2xl bg-white dark:bg-[#1e1a26]/90 backdrop-blur-xl p-5 shadow-lg dark:shadow-xl border border-slate-200 dark:border-[#2c2835] transition-colors">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600 dark:text-[#ddb7ff] text-[20px]">analytics</span>
              <span>Chỉ số tài liệu</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] flex flex-col border border-slate-200 dark:border-[#2c2835]">
                <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Số lượng từ</span>
                <span className="font-display font-bold text-xl text-slate-900 dark:text-[#e8dff1] mt-0.5">{wordCount}</span>
                <span className="text-[11px] font-display text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {wordCount > 300 ? 'Đạt chuẩn chuyên sâu' : 'Đang soạn thảo'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] flex flex-col border border-slate-200 dark:border-[#2c2835]">
                <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Thời gian đọc</span>
                <span className="font-display font-bold text-xl text-sky-600 dark:text-[#4cd7f6] mt-0.5">
                  ~{readTimeMinutes}<span className="text-xs font-sans ml-1">phút</span>
                </span>
                <span className="text-[11px] font-display text-slate-500 dark:text-[#ad8888] mt-0.5">Tương tác trực quan</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] flex flex-col border border-slate-200 dark:border-[#2c2835]">
                <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Cấu trúc đề mục</span>
                <span className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1] mt-0.5">{headingsCount} Mục H2</span>
                <span className="text-[11px] font-display text-rose-600 dark:text-[#ffb3b5] mt-0.5">Mạch lạc</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] flex flex-col border border-slate-200 dark:border-[#2c2835]">
                <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Tài nguyên ảnh (.webp)</span>
                <span className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1] mt-0.5">{imageBlocksCount} Khối</span>
                <span className="text-[11px] font-display text-sky-600 dark:text-[#4cd7f6] mt-0.5">WebP Tối ưu</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Custom Universal Prompt Modal */}
      <PromptModal {...promptModal} onCancel={closePrompt} />
    </div>
  );
}
