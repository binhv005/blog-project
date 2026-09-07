import React from 'react';
import { useBlog } from '../context/BlogContext';

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

function formatRichText(raw) {
  if (!raw) return '';
  let text = raw
    // Clean nested/duplicate align divs
    .replace(/<div align="(?:left|center|right)"[^>]*>\s*<div align="(?:left|center|right)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi, '<div class="text-center my-1">$1</div>')
    .replace(/<div[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '<div class="text-center my-1">$1</div>')
    .replace(/<div[^>]*style="[^"]*text-align:\s*right[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '<div class="text-right my-1">$1</div>')
    .replace(/<div[^>]*style="[^"]*text-align:\s*left[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '$1')
    .replace(/<div align="left"[^>]*>([\s\S]*?)<\/div>/gi, '$1')
    .replace(/<div align="center"[^>]*>([\s\S]*?)<\/div>/gi, '<div class="text-center my-1">$1</div>')
    .replace(/<div align="right"[^>]*>([\s\S]*?)<\/div>/gi, '<div class="text-right my-1">$1</div>');

  return text
    // Embedded images: ![caption](url)
    .replace(/!\[(.*?)\]\((.*?)\)/g, (_, caption, url) => {
      const cleanCaption = caption ? caption.trim() : '';
      return `<figure class="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-[#151025] shadow-xl">
        <img src="${url}" alt="${cleanCaption || 'Hình ảnh bài viết WebP'}" class="w-full max-h-[480px] object-cover rounded-t-2xl transition-transform duration-500 hover:scale-[1.01]" />
        ${cleanCaption ? `<figcaption class="text-xs text-slate-600 dark:text-slate-400 italic text-center py-2.5 px-4 bg-slate-50 dark:bg-[#100c18] border-t border-slate-200 dark:border-white/5">${cleanCaption}</figcaption>` : ''}
      </figure>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
    .replace(/(?<!\*)\*(?!\*)([^\*]+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>')
    .replace(/~~(.*?)~~/g, '<del class="line-through opacity-75">$1</del>')
    .replace(/<u>(.*?)<\/u>/gi, '<u class="underline">$1</u>')
    .replace(/<mark>(.*?)<\/mark>/gi, '<mark class="bg-[#4cd7f6]/20 text-sky-700 dark:text-[#4cd7f6] px-1 rounded font-medium">$1</mark>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-[#2c2835] text-rose-600 dark:text-[#ff5167] px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200 dark:border-transparent">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-600 dark:text-[#4cd7f6] hover:underline font-medium">$1</a>');
}

export default function ArticleBody() {
  const { activePost } = useBlog();

  if (!activePost) return null;

  return (
    <div>
      {/* Sequential Blocks Rendering (Supporting Images In-Between Paragraphs) */}
      {activePost.blocks && activePost.blocks.length > 0 ? (
        <div className="space-y-6 text-slate-800 dark:text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
          {activePost.blocks.map((block, idx) => {
            if (block.type === 'heading') {
              return (
                <h2
                  key={block.id || idx}
                  className={`text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3 mt-8 ${block.align === 'center' ? 'justify-center text-center' : block.align === 'right' ? 'justify-end text-right' : 'text-left'
                    }`}
                  style={{ color: block.color || undefined }}
                >
                  <span className="text-rose-500 font-mono text-xl">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: formatRichText(block.text) }} />
                </h2>
              );
            }

            if (block.type === 'paragraph' && block.text?.trim()) {
              return (
                <div key={block.id || idx} className="space-y-4">
                  {block.text.split('\n\n').map((para, pIdx) => (
                    <div
                      key={pIdx}
                      className={`leading-relaxed ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      style={{ color: block.color || undefined }}
                      dangerouslySetInnerHTML={{ __html: formatRichText(para) }}
                    />
                  ))}
                </div>
              );
            }

            if (block.type === 'image' && block.url) {
              return (
                <figure key={block.id || idx} className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-[#151025] shadow-xl">
                  <img
                    src={block.url}
                    alt={block.caption || 'Hình minh họa WebP'}
                    className="w-full max-h-[480px] object-cover"
                  />
                  {block.caption && (
                    <figcaption className="text-xs text-slate-600 dark:text-slate-400 italic text-center py-2.5 px-4 bg-slate-50 dark:bg-[#100c18] border-t border-slate-200 dark:border-white/5">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === 'quote' && block.text) {
              return (
                <blockquote key={block.id || idx} className="my-6 p-6 rounded-xl bg-slate-100 dark:bg-[#161127] border-l-4 border-rose-500 shadow-md relative overflow-hidden">
                  <div className="absolute right-4 top-2 text-6xl text-slate-300 dark:text-white/5 font-serif select-none pointer-events-none">“</div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium italic relative z-10 text-base sm:text-lg mb-3">
                    "{block.text}"
                  </p>
                  {block.author && (
                    <cite className="text-xs font-semibold text-rose-600 dark:text-rose-400 not-italic block">
                      — {block.author}
                    </cite>
                  )}
                </blockquote>
              );
            }

            if (block.type === 'list' && block.items && block.items.length > 0) {
              return block.listType === 'numbered' ? (
                <ol key={block.id || idx} className="my-6 space-y-2 list-decimal list-inside pl-2 text-slate-800 dark:text-slate-200">
                  {block.items.filter(Boolean).map((item, iIdx) => (
                    <li key={iIdx} className="leading-relaxed">
                      <span className="text-slate-900 dark:text-white font-medium">{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ul key={block.id || idx} className="my-6 space-y-2 list-disc list-inside pl-2 text-slate-800 dark:text-slate-200">
                  {block.items.filter(Boolean).map((item, iIdx) => (
                    <li key={iIdx} className="leading-relaxed">
                      <span className="text-slate-900 dark:text-white font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            if (block.type === 'table' && block.headers && block.rows) {
              return (
                <div key={block.id || idx} className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/30 bg-white dark:bg-[#161127] shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-[#120d20] border-b border-slate-200 dark:border-white/10 text-rose-600 dark:text-rose-300 font-bold">
                        <tr>
                          {block.headers.map((h, hIdx) => (
                            <th key={hIdx} className="px-5 py-3.5 tracking-wider uppercase text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                        {block.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-5 py-3">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            if (block.type === 'video' && block.url) {
              const embedUrl = formatVideoEmbedUrl(block.url);
              return (
                <figure key={block.id || idx} className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-[#151025] shadow-xl">
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={embedUrl}
                      title={block.caption || 'Video'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="text-xs text-slate-600 dark:text-slate-400 italic text-center py-2.5 px-4 bg-slate-50 dark:bg-[#100c18] border-t border-slate-200 dark:border-white/5">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === 'divider') {
              return (
                <hr key={block.id || idx} className="my-8 border-t border-slate-200 dark:border-white/10" />
              );
            }

            return null;
          })}
        </div>
      ) : (
        /* Fallback Legacy Content Rendering */
        <div className="space-y-8 text-slate-800 dark:text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
          {activePost.content && activePost.content.map((sec, idx) => (
            <section key={idx} className="scroll-mt-28 space-y-4">
              {sec.heading && (
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
                  <span className="text-rose-500 font-mono text-xl">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  {sec.heading}
                </h2>
              )}

              {sec.text && (
                <div className="space-y-4">
                  {sec.text.split('\n\n').map((paragraph, pIdx) => (
                    <div
                      key={pIdx}
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatRichText(paragraph) }}
                    />
                  ))}
                </div>
              )}

              {sec.quote && (
                <blockquote className="my-6 p-6 rounded-xl bg-slate-100 dark:bg-[#161127] border-l-4 border-rose-500 shadow-md relative overflow-hidden">
                  <div className="absolute right-4 top-2 text-6xl text-slate-300 dark:text-white/5 font-serif select-none pointer-events-none">“</div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium italic relative z-10 text-base sm:text-lg mb-3">
                    "{sec.quote}"
                  </p>
                  {sec.quoteAuthor && (
                    <cite className="text-xs font-semibold text-rose-600 dark:text-rose-400 not-italic block">
                      — {sec.quoteAuthor}
                    </cite>
                  )}
                </blockquote>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Tags Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-white/10 mt-10">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">label</span> Tags:
          </span>
          {activePost.tags && activePost.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
