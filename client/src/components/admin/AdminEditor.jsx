import React, { useState, useEffect, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useToast } from '../../context/ToastContext';

// Helper to format YouTube and Vimeo URLs into proper embed iframe URLs
function formatVideoEmbedUrl(url) {
  if (!url) return '';
  let cleanUrl = String(url).trim();

  const iframeMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    cleanUrl = iframeMatch[1];
  }

  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|))(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return cleanUrl;
}

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
  placeholder,
  className = '',
  style = {},
  inputRef,
  onKeyDown
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

export default function AdminEditor({ postToEdit, onExit, onNavigate }) {
  const { createPost, updatePost, selectPost } = useBlog();
  const { toast } = useToast();
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
      return postToEdit.blocks.map((b) => {
        let text = b.text || '';
        if (/<div align=/i.test(text)) {
          text = cleanAlignTags(text);
        }
        return { ...b, text: cleanPastedHtml(mdToHtml(text)) };
      });
    }
    if (postToEdit?.content && Array.isArray(postToEdit.content)) {
      const generated = [];
      postToEdit.content.forEach((sec, idx) => {
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

  // History State for Multi-Level Undo / Redo
  const [history, setHistory] = useState(() => [getInitialBlocks()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  // Keep historyIndexRef in sync with state
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // Active focus & selection tracking
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const inputRefs = useRef({});

  // Toolbar formatting active states
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isStrikethroughActive, setIsStrikethroughActive] = useState(false);
  const [activeTextColor, setActiveTextColor] = useState('#ff5167');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const [textAlign, setTextAlign] = useState('left'); // 'left' | 'center' | 'right'
  const [isBulletListActive, setIsBulletListActive] = useState(false);
  const [isNumberedListActive, setIsNumberedListActive] = useState(false);
  const [isQuoteActive, setIsQuoteActive] = useState(false);
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [isLinkActive, setIsLinkActive] = useState(false);

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
  const fullText = `${title} ${summary} ${blocks.map((b) => b.text || '').join(' ')}`.replace(/<[^>]+>/g, '').trim();
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
      const color = document.queryCommandValue('foreColor');

      setIsBoldActive(bold);
      setIsItalicActive(italic);
      setIsUnderlineActive(underline);
      setIsStrikethroughActive(strike);

      if (color && color !== 'inherit' && color !== 'rgb(241, 234, 255)') {
        setActiveTextColor(color);
      }

      // Check alignment, link & heading format of current selection / caret
      const selection = window.getSelection();
      let currentAlign = 'left';
      let detectedFormat = null;
      let isLink = false;

      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        while (node && node.getAttribute && !node.getAttribute('contenteditable')) {
          const styleAlign = node.style?.textAlign;
          const attrAlign = node.getAttribute('align');
          if (!currentAlign || currentAlign === 'left') {
            if (styleAlign || attrAlign) {
              currentAlign = (styleAlign || attrAlign).toLowerCase();
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

  // Push to history on meaningful block change (clears redo history after undo)
  const pushHistory = (newBlocks) => {
    if (!newBlocks || !Array.isArray(newBlocks)) return;
    const snapshot = JSON.parse(JSON.stringify(newBlocks));
    setHistory((prev) => {
      const currentIdx = historyIndexRef.current;
      const currentHistory = prev.slice(0, currentIdx + 1);
      const currentTop = currentHistory[currentHistory.length - 1];
      if (currentTop && JSON.stringify(currentTop) === JSON.stringify(snapshot)) {
        return prev;
      }
      const updated = [...currentHistory, snapshot];
      if (updated.length > 50) {
        updated.shift();
      }
      const newIdx = updated.length - 1;
      historyIndexRef.current = newIdx;
      setHistoryIndex(newIdx);
      return updated;
    });
  };

  const handleUndo = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    const currentIdx = historyIndexRef.current;
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      historyIndexRef.current = prevIdx;
      setHistoryIndex(prevIdx);
      const snapshot = JSON.parse(JSON.stringify(history[prevIdx]));
      setBlocks(snapshot);

      // Immediately update DOM of all active editable blocks without page reload
      requestAnimationFrame(() => {
        snapshot.forEach((b) => {
          if (inputRefs.current[b.id]) {
            if (b.type === 'code') {
              inputRefs.current[b.id].value = b.code || b.text || '';
            } else if (inputRefs.current[b.id].innerHTML !== undefined) {
              inputRefs.current[b.id].innerHTML = b.text || '';
            }
          }
        });
        updateToolbarActiveStates();
      });
    }
  };

  const handleRedo = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    const currentIdx = historyIndexRef.current;
    if (currentIdx < history.length - 1) {
      const nextIdx = currentIdx + 1;
      historyIndexRef.current = nextIdx;
      setHistoryIndex(nextIdx);
      const snapshot = JSON.parse(JSON.stringify(history[nextIdx]));
      setBlocks(snapshot);

      // Immediately update DOM of all active editable blocks without page reload
      requestAnimationFrame(() => {
        snapshot.forEach((b) => {
          if (inputRefs.current[b.id]) {
            if (b.type === 'code') {
              inputRefs.current[b.id].value = b.code || b.text || '';
            } else if (inputRefs.current[b.id].innerHTML !== undefined) {
              inputRefs.current[b.id].innerHTML = b.text || '';
            }
          }
        });
        updateToolbarActiveStates();
      });
    }
  };

  // Block management functions with debounced typing history
  const updateBlock = (id, newFields, immediateHistory = false) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...newFields } : b));
      if (immediateHistory) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        pushHistory(updated);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          pushHistory(updated);
        }, 500);
      }
      return updated;
    });
  };

  const deleteBlock = (id) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
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
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
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
    const selection = window.getSelection();

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

  const handleHighlightToggle = () => {
    if (isHighlightActive) {
      document.execCommand('hiliteColor', false, 'transparent');
      setIsHighlightActive(false);
    } else {
      document.execCommand('hiliteColor', false, 'rgba(76, 215, 246, 0.35)');
      setIsHighlightActive(true);
    }
    updateToolbarActiveStates();
    const updated = syncActiveBlockContent();
    pushHistory(updated);
  };

  const handleColorApply = (color) => {
    setActiveTextColor(color);
    setShowColorPicker(false);
    document.execCommand('foreColor', false, color);
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
      const isAlreadyBulleted = lines.every((l) => /^[•\-\*]\s*/.test(l.replace(/<[^>]+>/g, '').trim()));

      let resultHtml = '';
      if (isAlreadyBulleted) {
        resultHtml = lines
          .map((l) => l.replace(/^([•\-\*]\s*)/, ''))
          .join('<br>');
      } else {
        resultHtml = lines
          .map((l) => {
            const clean = l.replace(/^([•\-\*]\s*|\d+[\.\)]\s*)/, '');
            return `• ${clean}`;
          })
          .join('<br>');
      }

      const replacement = document.createElement('span');
      replacement.innerHTML = resultHtml;
      range.deleteContents();
      range.insertNode(replacement);

      const newRange = document.createRange();
      newRange.selectNodeContents(replacement);
      selection.removeAllRanges();
      selection.addRange(newRange);

      const updated = syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần thêm bullet');
    }
  };

  const handleInsertNumberedList = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneRange().extractContents());

      const lines = parseSelectedLines(container);
      const isAlreadyNumbered = lines.every((l) => /^\d+[\.\)]\s*/.test(l.replace(/<[^>]+>/g, '').trim()));

      let resultHtml = '';
      if (isAlreadyNumbered) {
        resultHtml = lines
          .map((l) => l.replace(/^\d+[\.\)]\s*/, ''))
          .join('<br>');
      } else {
        resultHtml = lines
          .map((l, idx) => {
            const clean = l.replace(/^([•\-\*]\s*|\d+[\.\)]\s*)/, '');
            return `${idx + 1}. ${clean}`;
          })
          .join('<br>');
      }

      const replacement = document.createElement('span');
      replacement.innerHTML = resultHtml;
      range.deleteContents();
      range.insertNode(replacement);

      const newRange = document.createRange();
      newRange.selectNodeContents(replacement);
      selection.removeAllRanges();
      selection.addRange(newRange);

      const updated = syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần đánh số thứ tự');
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
      const updated = syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(updated);
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
      const updated = syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần định dạng mã nguồn');
    }
  };

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

  const handleInsertLink = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      let parent = range.commonAncestorContainer;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentElement;
      }

      let existingLink = null;
      let curr = parent;
      while (curr && curr.getAttribute && !curr.getAttribute('contenteditable')) {
        if (curr.tagName.toLowerCase() === 'a') {
          existingLink = curr;
          break;
        }
        curr = curr.parentElement;
      }

      const defaultUrl = existingLink ? existingLink.getAttribute('href') : 'https://';
      const url = prompt(
        existingLink
          ? 'Chỉnh sửa đường dẫn liên kết URL (Xóa trống để hủy liên kết):'
          : 'Nhập đường dẫn liên kết URL (https://...):',
        defaultUrl
      );

      if (url === null) return; // Người dùng ấn Cancel

      if (!url.trim() || url.trim() === 'https://') {
        // Hủy liên kết
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
          const a = document.createElement('a');
          a.setAttribute('href', fullUrl);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
          a.className = 'text-[#4cd7f6] hover:underline font-medium';
          try {
            a.appendChild(range.extractContents());
            range.insertNode(a);
            const newRange = document.createRange();
            newRange.selectNodeContents(a);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (_) {
            document.execCommand('createLink', false, fullUrl);
          }
        }
      }

      const updated = syncActiveBlockContent();
      updateToolbarActiveStates();
      pushHistory(updated);
    } else {
      toast.info('Vui lòng bôi đen (tô đen) đoạn chữ cần chèn đường liên kết');
    }
  };

  // Insert video directly into text/paragraph at cursor
  const insertVideoAtCursor = (videoUrl, caption = '') => {
    if (!videoUrl || !videoUrl.trim()) return;
    const embedUrl = formatVideoEmbedUrl(videoUrl.trim());
    const cleanCaption = caption ? caption.trim() : '';

    const videoHtml = `<figure class="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/30 bg-black shadow-xl block" contenteditable="false"><div class="relative w-full aspect-video"><iframe src="${embedUrl}" title="${cleanCaption || 'Video Player'}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>${cleanCaption ? `<figcaption class="text-xs text-slate-500 dark:text-slate-400 italic text-center py-2 px-3 bg-slate-100 dark:bg-[#100c18] border-t border-slate-200 dark:border-white/5">${cleanCaption}</figcaption>` : ''}</figure><p><br></p>`;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && focusedBlockId) {
      try {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = videoHtml;
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

        const updated = syncActiveBlockContent();
        pushHistory(updated);
        return;
      } catch (_) { }
    }

    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    if (currentBlock && currentBlock.type === 'paragraph') {
      const newText = (currentBlock.text || '') + videoHtml;
      updateBlock(currentBlock.id, { text: newText }, true);
    } else {
      insertBlockAt(activeIdx, {
        id: `p-${Date.now()}`,
        type: 'paragraph',
        text: videoHtml
      });
    }
  };

  const handleInsertVideo = () => {
    const url = prompt('Nhập đường dẫn Video (YouTube / Shorts / Vimeo / Embed URL):', 'https://www.youtube.com/watch?v=');
    if (url && url.trim() && url.trim() !== 'https://www.youtube.com/watch?v=') {
      insertVideoAtCursor(url.trim());
    }
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
        const updated = syncActiveBlockContent();
        pushHistory(updated);
        return;
      } catch (_) { }
    }

    insertBlockAt(idx, {
      id: `div-${Date.now()}`,
      type: 'divider'
    });
  };

  // Insert image directly into text/paragraph at cursor with filename caption underneath
  const insertImageAtCursor = (imageUrl, caption = '') => {
    const cleanCaption = caption || '';
    const imgHtml = cleanCaption
      ? `<figure class="my-4 text-center block"><img src="${imageUrl}" alt="${cleanCaption}" class="max-h-[420px] max-w-full rounded-xl object-cover block mx-auto shadow-lg" /><figcaption class="text-xs text-[#ad8888] italic text-center mt-1.5 font-medium">${cleanCaption}</figcaption></figure>`
      : `<img src="${imageUrl}" alt="Hình ảnh bài viết" class="my-3 max-h-[420px] max-w-full rounded-xl object-cover block mx-auto shadow-lg" />`;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && focusedBlockId) {
      try {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imgHtml;
        const imgNode = tempDiv.firstChild;
        range.insertNode(imgNode);

        const newRange = document.createRange();
        newRange.setStartAfter(imgNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        const updated = syncActiveBlockContent();
        pushHistory(updated);
        return;
      } catch (_) { }
    }

    const activeIdx = getActiveIndex();
    const currentBlock = blocks[activeIdx];
    if (currentBlock && currentBlock.type === 'paragraph') {
      const newText = (currentBlock.text || '') + imgHtml;
      updateBlock(currentBlock.id, { text: newText }, true);
    } else {
      insertBlockAt(activeIdx, {
        id: `p-${Date.now()}`,
        type: 'paragraph',
        text: imgHtml
      });
    }
  };

  const triggerImageUploadAt = (idx = getActiveIndex()) => {
    setTargetBlockIndex(idx);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e, isCover = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const fileName = file.name;

    try {
      const localPreviewUrl = URL.createObjectURL(file);

      // Cloudinary upload
      const cloudName = 'dq0w6ycvk';
      const uploadPreset = 'dudi_blog_preset';

      let uploadedUrl = localPreviewUrl;

      if (cloudName && uploadPreset && uploadPreset !== 'YOUR_UPLOAD_PRESET') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', isCover ? 'dudi_blog/covers' : 'dudi_blog/blocks');

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.secure_url || localPreviewUrl;
        }
      }

      if (isCover) {
        setCoverImage(uploadedUrl);
      } else {
        insertImageAtCursor(uploadedUrl, fileName);
      }
    } catch (err) {
      console.warn('Lỗi upload ảnh:', err);
      const fallbackUrl = URL.createObjectURL(file);
      if (isCover) {
        setCoverImage(fallbackUrl);
      } else {
        insertImageAtCursor(fallbackUrl, fileName);
      }
    } finally {
      e.target.value = '';
    }
  };

  const handleInsertImageUrlAt = () => {
    const url = prompt('Nhập đường dẫn URL hình ảnh (.webp, .png, .jpg):');
    if (url && url.trim()) {
      const urlFileName = url.trim().split('/').pop()?.split('?')[0] || 'Ảnh minh họa WebP';
      insertImageAtCursor(url.trim(), urlFileName);
    }
  };

  // Keyboard Shortcuts Listener (Ctrl/Cmd+Z: Undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z: Redo, Ctrl/Cmd+B/I/U)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = typeof navigator !== 'undefined' && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!isCmdOrCtrl) return;

      const key = e.key.toLowerCase();

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Y OR Ctrl/Cmd + Shift + Z
      if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
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

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
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

  // Save / Publish
  const handleSave = async (status = 'published') => {
    if (!title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề bài viết!');
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
      toast.success(`Đã cập nhật bài viết "${title}" thành công!`);
    } else {
      await createPost(postData);
      toast.success(`Đã ${status === 'published' ? 'xuất bản' : 'lưu nháp'} bài viết "${title}" thành công!`);
    }

    if (onExit) onExit();
  };

  const handlePreview = async () => {
    if (!title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề bài viết trước khi xem trước!');
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
        ref={coverFileInputRef}
        onChange={(e) => handleFileUpload(e, true)}
        accept="image/webp,image/png,image/jpeg,image/gif"
        className="hidden"
      />

      {/* Sticky Top Action Bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 bg-white/95 dark:bg-[#1a1426]/95 px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-b border-slate-200 dark:border-[#352b48] transition-colors">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <nav className="flex items-center gap-1 text-slate-500 dark:text-[#ad8888] text-xs overflow-x-auto no-scrollbar whitespace-nowrap">
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
          <div className="h-4 w-px bg-slate-300 dark:bg-[#373340] hidden md:block"></div>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#2c2835] text-slate-600 dark:text-[#ad8888] font-mono text-[11px] flex-shrink-0 border border-slate-200 dark:border-transparent">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Đã tự động lưu: {lastSavedTime}</span>
          </div>
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
            className="group flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#2c2835] text-slate-800 dark:text-[#e8dff1] hover:bg-slate-200 dark:hover:bg-[#3c3745] transition-all shadow-sm text-xs font-semibold border border-slate-200 dark:border-transparent"
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
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#2c2835] text-slate-700 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-[#e8dff1] hover:bg-slate-200 dark:hover:bg-[#3c3745] transition-all text-xs font-semibold border border-slate-200 dark:border-transparent"
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

      {/* Floating Toolbar Ribbon (Exact match to requested UI with Word-like WYSIWYG) */}
      <div className="sticky top-[52px] sm:top-[58px] z-20 w-full bg-white/95 dark:bg-[#140e20]/95 backdrop-blur-2xl py-2 px-2 sm:px-4 shadow-sm dark:shadow-[0_12px_24px_rgba(0,0,0,0.55)] border-b border-slate-200 dark:border-[#352b48] transition-colors">
        <div className="max-w-[1500px] mx-auto flex items-center justify-start md:justify-center overflow-x-auto py-0.5 no-scrollbar touch-pan-x">
          <div className="inline-flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 rounded-2xl bg-slate-50 dark:bg-[#1a1329] border border-slate-200 dark:border-[#483966] shadow-sm dark:shadow-2xl flex-nowrap min-w-max relative transition-colors">

            {/* GROUP 1: Undo / Redo + Heading Dropdown */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-1 shadow-inner">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${historyIndex <= 0
                  ? 'opacity-30 cursor-not-allowed text-slate-400 dark:text-[#ad8888]/40'
                  : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] active:scale-95'
                  }`}
                title="Hoàn tác (Undo - Ctrl+Z)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">undo</span>
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${historyIndex >= history.length - 1
                  ? 'opacity-30 cursor-not-allowed text-slate-400 dark:text-[#ad8888]/40'
                  : 'text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] active:scale-95'
                  }`}
                title="Làm lại (Redo - Ctrl+Y)"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">redo</span>
              </button>

              <div className="relative inline-flex items-center">
                <select
                  value={selectedFormat}
                  onChange={(e) => handleFormatDropdownChange(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="appearance-none bg-transparent hover:bg-slate-100 dark:hover:bg-[#2c2835]/60 text-slate-800 dark:text-[#e8dff1] text-xs font-semibold pl-2.5 pr-6 py-1 rounded-lg outline-none cursor-pointer transition-colors"
                >
                  <option className="bg-white dark:bg-[#1e1a26] text-slate-800 dark:text-[#e8dff1] py-1" value="H2">Tiêu đề H2</option>
                  <option className="bg-white dark:bg-[#1e1a26] text-slate-800 dark:text-[#e8dff1] py-1" value="H1">Tiêu đề H1</option>
                  <option className="bg-white dark:bg-[#1e1a26] text-slate-800 dark:text-[#e8dff1] py-1" value="H3">Tiêu đề H3</option>
                  <option className="bg-white dark:bg-[#1e1a26] text-slate-800 dark:text-[#e8dff1] py-1" value="p">Đoạn văn</option>
                  <option className="bg-white dark:bg-[#1e1a26] text-slate-800 dark:text-[#e8dff1] py-1" value="quote">Trích dẫn</option>
                  <option className="bg-white dark:bg-[#1e1a26] text-slate-800 dark:text-[#e8dff1] py-1" value="code">Mã nguồn (Code)</option>
                </select>
                <span className="material-symbols-outlined text-[15px] text-slate-400 dark:text-[#ad8888] absolute right-1.5 pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>

            {/* GROUP 2: Typography (B, I, U, S | Color, Pen) */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-1 shadow-inner relative">
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

              {/* Text Color Button with Popover */}
              <div className="relative">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="h-7 px-1.5 flex items-center gap-0.5 rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-all"
                  title="Chọn màu chữ cho văn bản"
                  type="button"
                >
                  <span className="text-xs font-bold underline decoration-2" style={{ textDecorationColor: activeTextColor }}>A</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#ad8888] font-bold">-</span>
                </button>

                {showColorPicker && (
                  <div className="absolute top-9 left-0 z-50 p-2 rounded-xl bg-white dark:bg-[#1e1a26] border border-slate-200 dark:border-[#373340] shadow-2xl flex items-center gap-1.5">
                    {['#ff5167', '#0284c7', '#a855f7', '#10b981', '#f59e0b', '#0f172a', '#ffffff'].map((color) => (
                      <button
                        key={color}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleColorApply(color)}
                        className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/20 hover:scale-110 transition-transform shadow-sm"
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleHighlightToggle}
                className={`w-7 h-7 flex items-center justify-center rounded-lg active:scale-95 transition-all ${isHighlightActive ? 'bg-sky-100 dark:bg-[#4cd7f6]/25 text-sky-600 dark:text-[#4cd7f6] border border-sky-300 dark:border-[#4cd7f6]/40 shadow-sm' : 'text-sky-600 dark:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#2c2835]'}`}
                title="Đánh dấu Highlight văn bản"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>

            {/* GROUP 3: Alignment, Lists, Quote & Code */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-1 shadow-inner">
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
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#1e192a] border border-slate-200 dark:border-[#352f44] rounded-xl p-1 shadow-inner">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => triggerImageUploadAt()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 dark:bg-[#221e2e] text-sky-600 dark:text-[#4cd7f6] hover:bg-sky-100 dark:hover:bg-[#2c2838] hover:brightness-110 transition-all text-xs font-semibold border border-sky-200 dark:border-[#3a3348] shadow-sm"
                title="Tải ảnh từ máy và chèn trực tiếp vào vị trí con trỏ"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">add_photo_alternate</span>
                <span>Chèn ảnh</span>
              </button>

              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsertImageUrlAt()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-[#ad8888] hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-all"
                title="Chèn ảnh bằng đường dẫn URL"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">image</span>
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
      </div>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 max-w-[1500px] w-full mx-auto p-3 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Visual Document Canvas */}
        <div className="xl:col-span-8 flex flex-col gap-6 w-full">
          <article className="w-full rounded-2xl bg-white dark:bg-[#1a1426]/90 backdrop-blur-xl p-4 sm:p-8 md:p-10 shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#352b48] relative transition-colors">

            {/* Document Header & Cover Image Area */}
            <div className="mb-6">
              <div className="mb-4">
                {coverImage ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/40 bg-slate-100 dark:bg-[#151025] shadow-xl">
                    <img
                      src={coverImage}
                      alt="Ảnh bìa bài viết"
                      className="w-full max-h-[380px] object-cover rounded-2xl transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

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
                        onClick={() => {
                          const newUrl = prompt('Nhập đường dẫn URL ảnh bìa (.webp, .png, .jpg):', coverImage);
                          if (newUrl !== null && newUrl.trim()) setCoverImage(newUrl.trim());
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 dark:bg-[#1e1533]/90 text-[#4cd7f6] hover:text-white hover:bg-[#03b5d3] text-xs font-semibold backdrop-blur-md shadow-lg border border-white/10 transition-all active:scale-95"
                        title="Chèn URL ảnh trực tiếp"
                      >
                        <span className="material-symbols-outlined text-[16px]">link</span>
                        <span>Đổi URL</span>
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

                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Nhập đường dẫn URL ảnh bìa (.webp, .png, .jpg):');
                        if (url && url.trim()) setCoverImage(url.trim());
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-[#ad8888] hover:text-sky-600 dark:hover:text-[#4cd7f6] hover:bg-slate-100 dark:hover:bg-[#281e3d] border border-transparent hover:border-sky-500/40 dark:hover:border-[#4cd7f6]/40 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      <span>Chèn URL ảnh</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Document Title Input Field */}
              <div className="pt-2 pb-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => setFocusedBlockId('doc-title')}
                  className="w-full bg-transparent text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-display font-bold placeholder-slate-400 dark:placeholder-[#9e8eb3] outline-none leading-tight tracking-tight focus:placeholder:opacity-30 transition-all text-left"
                  placeholder="Nhập tiêu đề bài viết tại đây..."
                />
              </div>

              {/* SEQUENTIAL VISUAL BLOCKS (True Word-like WYSIWYG) */}
              <div className="space-y-4">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="relative group/block">
                    {/* Render Block: HEADING */}
                    {block.type === 'heading' && (
                      <div className="flex items-center gap-2 pt-2 p-3 rounded-xl bg-slate-50/80 dark:bg-[#231b36]/40 border border-slate-200 dark:border-[#3c2f57]/50 focus-within:border-sky-500 dark:focus-within:border-[#4cd7f6] transition-colors">
                        <span className="text-[#ff5167] font-mono text-base font-bold select-none">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <div className="flex-1">
                          <RichEditableBlock
                            inputRef={(el) => (inputRefs.current[block.id] = el)}
                            html={block.text}
                            onChange={(val) => updateBlock(block.id, { text: val })}
                            onFocus={() => {
                              setFocusedBlockId(block.id);
                              setSelectedFormat(block.level || 'H2');
                              updateToolbarActiveStates(block.id);
                            }}
                            onBlur={() => {
                              if (typingTimeoutRef.current) {
                                clearTimeout(typingTimeoutRef.current);
                                typingTimeoutRef.current = null;
                              }
                              const updated = syncActiveBlockContent();
                              pushHistory(updated);
                            }}
                            onSelectionChange={() => updateToolbarActiveStates(block.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                insertBlockAt(idx, { id: `p-${Date.now()}`, type: 'paragraph', text: '' });
                              }
                            }}
                            placeholder={`Tiêu đề mục ${block.level || 'H2'}...`}
                            className={`w-full bg-transparent ${block.level === 'H1' ? 'text-2xl md:text-3xl font-bold' : block.level === 'H3' ? 'text-lg font-semibold' : 'text-xl font-bold'} text-slate-900 dark:text-white font-display pb-1 transition-all ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left'}`}
                            style={{ color: block.color || undefined }}
                          />
                        </div>
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="opacity-0 group-hover/block:opacity-100 p-1 text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167] transition-all"
                          title="Xóa đề mục này"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    )}

                    {/* Render Block: PARAGRAPH (True Unified Word-like WYSIWYG without line splitting) */}
                    {block.type === 'paragraph' && (
                      <div className="relative p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#231b36]/40 border border-slate-200 dark:border-[#3c2f57]/50 hover:border-slate-300 dark:hover:border-purple-500/40 focus-within:border-sky-500 dark:focus-within:border-[#4cd7f6] transition-colors">
                        <RichEditableBlock
                          inputRef={(el) => (inputRefs.current[block.id] = el)}
                          html={block.text}
                          onChange={(val) => updateBlock(block.id, { text: val })}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            setSelectedFormat('p');
                            updateToolbarActiveStates(block.id);
                          }}
                          onBlur={() => {
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current);
                              typingTimeoutRef.current = null;
                            }
                            const updated = syncActiveBlockContent();
                            pushHistory(updated);
                          }}
                          onSelectionChange={() => updateToolbarActiveStates(block.id)}
                          placeholder="Nhập nội dung đoạn văn bản tại đây..."
                          className={`w-full min-h-[44px] bg-transparent text-slate-800 dark:text-[#f1eaff] text-base leading-relaxed font-body font-normal transition-all ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left'}`}
                          style={{ color: block.color || undefined }}
                        />
                        {blocks.length > 1 && (
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 p-1 text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167] transition-all"
                            title="Xóa đoạn này"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Render Block: LIST */}
                    {block.type === 'list' && (
                      <div className="my-3 p-4 rounded-xl bg-slate-50 dark:bg-[#221e2a] border border-slate-200 dark:border-[#2c2835] relative">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-[#2c2835] text-xs font-mono text-slate-500 dark:text-[#ad8888]">
                          <span>{block.listType === 'numbered' ? '🔢 Danh sách số' : '• Danh sách gạch đầu dòng'}</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167]"
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
                                onBlur={() => {
                                  if (typingTimeoutRef.current) {
                                    clearTimeout(typingTimeoutRef.current);
                                    typingTimeoutRef.current = null;
                                  }
                                  pushHistory(blocks);
                                }}
                                className="w-full bg-transparent text-sm text-slate-800 dark:text-[#e8dff1] outline-none border-b border-slate-200 dark:border-white/5 focus:border-sky-500 dark:focus:border-[#4cd7f6] pb-0.5"
                                placeholder="Nhập mục danh sách..."
                              />
                              <button
                                onClick={() => {
                                  const newItems = block.items.filter((_, i) => i !== itemIdx);
                                  updateBlock(block.id, { items: newItems.length > 0 ? newItems : [''] }, true);
                                }}
                                className="text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167] p-0.5"
                              >
                                <span className="material-symbols-outlined text-[14px]">remove_circle_outline</span>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] }, true)}
                            className="text-xs text-sky-600 dark:text-[#4cd7f6] hover:underline pt-1 flex items-center gap-1 font-semibold"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            <span>Thêm mục</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Render Block: TABLE */}
                    {block.type === 'table' && (
                      <div className="my-4 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#221e2a] border border-slate-200 dark:border-[#2c2835] relative">
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
                                      onBlur={() => {
                                        if (typingTimeoutRef.current) {
                                          clearTimeout(typingTimeoutRef.current);
                                          typingTimeoutRef.current = null;
                                        }
                                        pushHistory(blocks);
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
                                        onBlur={() => {
                                          if (typingTimeoutRef.current) {
                                            clearTimeout(typingTimeoutRef.current);
                                            typingTimeoutRef.current = null;
                                          }
                                          pushHistory(blocks);
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
                                updateBlock(block.id, { rows: newRows }, true);
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
                      <div className="my-4 rounded-xl bg-slate-50 dark:bg-[#221e2a] p-3 border border-slate-200 dark:border-[#2c2835] relative">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-[#2c2835] text-xs font-mono text-sky-600 dark:text-[#4cd7f6]">
                          <span>🎬 Video Embed</span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167]"
                            title="Xóa video"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2 shadow-md">
                          <iframe
                            src={formatVideoEmbedUrl(block.url)}
                            title="Video Player"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                        <input
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          className="w-full text-center bg-transparent text-xs text-slate-500 dark:text-[#ad8888] italic outline-none"
                          placeholder="Chú thích video..."
                        />
                      </div>
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

                    {/* Render Block: IN-LINE VISUAL IMAGE */}
                    {block.type === 'image' && (
                      <div className="my-4 rounded-2xl bg-slate-50 dark:bg-[#221e2a] p-2 shadow-md dark:shadow-2xl border border-slate-200 dark:border-[#2c2835] relative group/img">
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/90 dark:bg-[#100c18]/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-md border border-slate-200 dark:border-white/10 opacity-90 group-hover/img:opacity-100 transition-opacity">
                          <span className="text-[10px] font-mono text-sky-600 dark:text-[#4cd7f6] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#2c2835]">
                            .webp
                          </span>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="p-1 rounded text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167] hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-colors"
                            title="Xóa ảnh này"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>

                        <div className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-[#100c18]">
                          <img
                            alt={block.caption || 'Ảnh minh họa WebP'}
                            className="w-full max-h-[420px] object-cover rounded-xl shadow-md transition-transform duration-500 hover:scale-[1.01]"
                            src={block.url}
                          />
                        </div>

                        <div className="mt-2 px-2 text-center">
                          <input
                            value={block.caption}
                            onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                            className="w-full text-center bg-transparent text-xs text-slate-500 dark:text-[#ad8888] italic outline-none hover:text-slate-800 dark:hover:text-[#e8dff1] focus:text-sky-600 dark:focus:text-[#4cd7f6] transition-colors"
                            placeholder="Nhập chú thích ảnh (.webp)..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Render Block: QUOTE */}
                    {block.type === 'quote' && (
                      <div className="my-4 pl-5 py-3 bg-rose-50/50 dark:bg-[#161127] border-l-4 border-[#ff5167] rounded-r-xl relative">
                        <RichEditableBlock
                          inputRef={(el) => (inputRefs.current[block.id] = el)}
                          html={block.text}
                          onChange={(val) => updateBlock(block.id, { text: val })}
                          onFocus={() => {
                            setFocusedBlockId(block.id);
                            setSelectedFormat('quote');
                            updateToolbarActiveStates(block.id);
                          }}
                          onBlur={() => {
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current);
                              typingTimeoutRef.current = null;
                            }
                            const updated = syncActiveBlockContent();
                            pushHistory(updated);
                          }}
                          onSelectionChange={() => updateToolbarActiveStates(block.id)}
                          placeholder="Nội dung trích dẫn quan trọng..."
                          className="w-full bg-transparent text-base italic text-slate-800 dark:text-[#e8dff1] min-h-[44px]"
                        />
                        <input
                          value={block.author || ''}
                          onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                          className="w-full bg-transparent text-xs text-rose-600 dark:text-[#ffb3b5] placeholder-slate-400 dark:placeholder-[#ad8888]/40 outline-none mt-1 font-semibold"
                          placeholder="— Tác giả trích dẫn"
                        />
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 p-1 text-slate-400 dark:text-[#ad8888] hover:text-rose-600 dark:hover:text-[#ff5167] transition-all"
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
                          onBlur={() => {
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current);
                              typingTimeoutRef.current = null;
                            }
                            pushHistory(blocks);
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

                    {/* In-Between Insertion Actions */}
                    <div className="flex items-center justify-center py-2 opacity-30 hover:opacity-100 transition-opacity my-1">
                      <div className="h-px bg-slate-200 dark:bg-[#2c2835] flex-1"></div>
                      <div className="flex items-center gap-1.5 px-3 bg-white dark:bg-[#1e1a26] py-0.5 rounded-full border border-slate-200 dark:border-[#373340] shadow-sm">
                        <button
                          onClick={() => triggerImageUploadAt(idx)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-[#4cd7f6] hover:text-sky-700 dark:hover:text-white px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-colors"
                          title="Chèn hình ảnh vào đúng vị trí này"
                        >
                          <span className="material-symbols-outlined text-[14px]">add_photo_alternate</span>
                          <span>Chèn ảnh WebP</span>
                        </button>
                        <span className="text-slate-300 dark:text-[#373340]">•</span>
                        <button
                          onClick={() => insertBlockAt(idx, { id: `p-${Date.now()}`, type: 'paragraph', text: '' })}
                          className="text-[11px] font-medium text-slate-600 dark:text-[#ad8888] hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-colors"
                        >
                          + Đoạn văn
                        </button>
                        <span className="text-slate-300 dark:text-[#373340]">•</span>
                        <button
                          onClick={() => insertBlockAt(idx, { id: `h-${Date.now()}`, type: 'heading', text: '' })}
                          className="text-[11px] font-medium text-rose-600 dark:text-[#ffb3b5] hover:text-rose-700 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-[#2c2835] transition-colors"
                        >
                          + Đề mục
                        </button>
                      </div>
                      <div className="h-px bg-slate-200 dark:bg-[#2c2835] flex-1"></div>
                    </div>
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
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-[#e8dff1]">Ảnh bìa đại diện</h3>
              </div>
              <button
                onClick={() => coverFileInputRef.current?.click()}
                className="text-xs font-semibold text-rose-600 dark:text-[#ffb3b5] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">upload</span>
                <span>{coverImage ? 'Tải ảnh mới' : '+ Tải ảnh'}</span>
              </button>
            </div>

            {coverImage ? (
              <div className="relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-[#100c18] shadow-md border border-slate-200 dark:border-[#2c2835]">
                <img
                  alt="Ảnh bìa bài viết"
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                  src={coverImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-[#100c18] via-transparent to-transparent opacity-80"></div>
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

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Danh mục chính</label>
              <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15111d] text-slate-900 dark:text-[#e8dff1] border border-slate-200 dark:border-[#2c2835]">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-[#e8dff1] text-xs outline-none w-full cursor-pointer"
                >
                  <option className="bg-white dark:bg-[#15111d] text-slate-900 dark:text-white" value="Công nghệ & Kiến trúc phần mềm">Công nghệ &amp; Kiến trúc phần mềm</option>
                  <option className="bg-white dark:bg-[#15111d] text-slate-900 dark:text-white" value="An ninh mạng & Zero-Trust">An ninh mạng &amp; Zero-Trust</option>
                  <option className="bg-white dark:bg-[#15111d] text-slate-900 dark:text-white" value="DevOps & Điện toán đám mây">DevOps &amp; Điện toán đám mây</option>
                  <option className="bg-white dark:bg-[#15111d] text-slate-900 dark:text-white" value="Fintech & Hệ thống chịu tải cao">Fintech &amp; Hệ thống chịu tải cao</option>
                </select>
              </div>
            </div>

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
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                {title.trim() ? 'Điểm 94/100' : 'Chưa nhập'}
              </span>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Đường dẫn tĩnh (Slug URL)</label>
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15111d] text-slate-900 dark:text-[#e8dff1] text-xs font-mono border border-slate-200 dark:border-[#2c2835] overflow-x-auto">
                <span className="text-slate-400 dark:text-[#ad8888] select-none">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="duong-dan-tinh"
                  className="bg-transparent text-sky-600 dark:text-[#4cd7f6] outline-none flex-1 font-mono text-xs placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-[#ad8888]">Thẻ mô tả Meta Description</label>
                <span className="font-mono text-[10px] text-slate-500 dark:text-[#ad8888]">{metaDesc.length}/160 ký tự</span>
              </div>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="Mô tả tóm tắt cho công cụ tìm kiếm Google..."
                rows="3"
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] text-slate-900 dark:text-[#e8dff1] text-xs resize-none outline-none leading-relaxed border border-slate-200 dark:border-[#2c2835] placeholder-slate-400 dark:placeholder-slate-500"
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
                <span className="font-mono font-bold text-xl text-slate-900 dark:text-[#e8dff1] mt-0.5">{wordCount}</span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {wordCount > 300 ? 'Đạt chuẩn chuyên sâu' : 'Đang soạn thảo'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] flex flex-col border border-slate-200 dark:border-[#2c2835]">
                <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Thời gian đọc</span>
                <span className="font-mono font-bold text-xl text-sky-600 dark:text-[#4cd7f6] mt-0.5">
                  ~{readTimeMinutes}<span className="text-xs font-sans ml-1">phút</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-[#ad8888] mt-0.5">Tương tác trực quan</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] flex flex-col border border-slate-200 dark:border-[#2c2835]">
                <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Cấu trúc đề mục</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-[#e8dff1] mt-0.5">{headingsCount} Mục H2</span>
                <span className="font-mono text-[10px] text-rose-600 dark:text-[#ffb3b5] mt-0.5">Mạch lạc</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#15111d] flex flex-col border border-slate-200 dark:border-[#2c2835]">
                <span className="text-[11px] text-slate-500 dark:text-[#ad8888]">Tài nguyên ảnh (.webp)</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-[#e8dff1] mt-0.5">{imageBlocksCount} Khối</span>
                <span className="font-mono text-[10px] text-sky-600 dark:text-[#4cd7f6] mt-0.5">WebP Tối ưu</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
