import React from 'react';
import { useBlog } from '../context/BlogContext';
import { optimizeImageUrl, formatVideoEmbedUrl } from '../utils/mediaOptimizer';
import OptimizedImage from './common/OptimizedImage';

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

  // Format list tags to guarantee proper indentation inside
  text = text
    .replace(/<ul\b([^>]*)>/gi, '<ul class="my-4 space-y-2 list-disc list-outside ml-6 sm:ml-8 pl-2 text-slate-800 dark:text-slate-200" $1>')
    .replace(/<ol\b([^>]*)>/gi, '<ol class="my-4 space-y-2 list-decimal list-outside ml-6 sm:ml-8 pl-2 text-slate-800 dark:text-slate-200" $1>')
    .replace(/<li\b([^>]*)>/gi, '<li class="leading-relaxed pl-1" $1>');

  return text
    // Embedded images: ![caption](url) or ![caption|width](url)
    .replace(/!\[(.*?)(?:\|(.*?))?\]\((.*?)\)/g, (_, caption, sizeParam, url) => {
      const cleanCaption = caption ? caption.trim() : '';
      const customWidth = sizeParam ? sizeParam.trim() : '100%';
      const optimizedUrl = optimizeImageUrl(url, { width: 1000, quality: 80 });
      return `<figure class="my-6 mx-auto flex flex-col items-center" style="width: ${customWidth}; max-width: 100%;">
        <img src="${optimizedUrl}" alt="${cleanCaption || 'Hình ảnh bài viết WebP'}" loading="lazy" decoding="async" class="w-full max-h-[520px] object-cover rounded-2xl transition-transform duration-500 hover:scale-[1.005] block mx-auto shadow-md" />
        ${cleanCaption ? `<figcaption class="w-full text-xs text-slate-500 dark:text-slate-400 italic text-center pt-2.5 px-4">${cleanCaption}</figcaption>` : ''}
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
                  style={{ color: block.color || undefined, lineHeight: block.lineHeight || undefined }}
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
                      style={{ color: block.color || undefined, lineHeight: block.lineHeight || undefined }}
                      dangerouslySetInnerHTML={{ __html: formatRichText(para) }}
                    />
                  ))}
                </div>
              );
            }

            if (block.type === 'image' && block.url) {
              const imageWidth = block.width || '100%';
              const imageAlign = block.align || 'center';
              const alignClasses =
                imageAlign === 'left'
                  ? 'mr-auto text-left items-start'
                  : imageAlign === 'right'
                  ? 'ml-auto text-right items-end'
                  : 'mx-auto text-center items-center';
              const maxHeightStyle = block.maxHeight || '520px';

              return (
                <figure
                  key={block.id || idx}
                  className={`my-8 max-w-full flex flex-col ${alignClasses}`}
                  style={{ width: imageWidth, maxWidth: '100%' }}
                >
                  <OptimizedImage
                    src={block.url}
                    alt={block.caption || 'Hình minh họa WebP'}
                    sizes="(max-width: 768px) 100vw, 1000px"
                    containerClassName="w-full rounded-2xl overflow-hidden shadow-lg"
                    style={{ maxHeight: maxHeightStyle }}
                    className="w-full object-cover rounded-2xl block mx-auto transition-transform duration-500 hover:scale-[1.005]"
                  />
                  {block.caption && (
                    <figcaption className="w-full text-xs text-slate-500 dark:text-slate-400 italic pt-2.5 px-2">
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
                <ol key={block.id || idx} className="my-6 space-y-2.5 list-decimal list-outside ml-6 sm:ml-8 pl-2 text-slate-800 dark:text-slate-200">
                  {block.items.filter(Boolean).map((item, iIdx) => (
                    <li key={iIdx} className="leading-relaxed pl-1">
                      <span className="text-slate-900 dark:text-white font-medium">{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ul key={block.id || idx} className="my-6 space-y-2.5 list-disc list-outside ml-6 sm:ml-8 pl-2 text-slate-800 dark:text-slate-200">
                  {block.items.filter(Boolean).map((item, iIdx) => (
                    <li key={iIdx} className="leading-relaxed pl-1">
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
              const isDirectVideo = block.url.startsWith('data:') || block.url.startsWith('blob:') || block.url.includes('/video/upload/') || block.url.includes('.mp4') || block.url.includes('.webm') || block.url.includes('.mov');
              const embedUrl = isDirectVideo ? '' : formatVideoEmbedUrl(block.url);
              return (
                <figure key={block.id || idx} className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-900/30 bg-slate-100 dark:bg-[#151025] shadow-xl max-w-3xl mx-auto flex flex-col items-center">
                  <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                    {isDirectVideo ? (
                      <video
                        src={block.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <iframe
                        src={embedUrl}
                        title={block.caption || 'Video'}
                        loading="lazy"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                  </div>
                  {block.caption && (
                    <figcaption className="w-full text-xs text-slate-600 dark:text-slate-400 italic text-center py-2.5 px-4 bg-slate-50 dark:bg-[#100c18] border-t border-slate-200 dark:border-white/5">
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

            if (block.type === 'code' && (block.code || block.text)) {
              return (
                <div key={block.id || idx} className="my-6 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
                  <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                      <span className="ml-2">Code snippet</span>
                    </span>
                  </div>
                  <pre className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono text-[#4cd7f6] leading-relaxed">
                    <code>{block.code || block.text}</code>
                  </pre>
                </div>
              );
            }

            if (block.type === 'columns') {
              const layout = block.layout || '50-50';

              let gridColsClass = 'grid-cols-1 md:grid-cols-2';
              let leftColClass = '';
              let rightColClass = '';

              if (layout === '60-40') {
                gridColsClass = 'grid-cols-1 md:grid-cols-12';
                leftColClass = 'md:col-span-7';
                rightColClass = 'md:col-span-5';
              } else if (layout === '40-60') {
                gridColsClass = 'grid-cols-1 md:grid-cols-12';
                leftColClass = 'md:col-span-5';
                rightColClass = 'md:col-span-7';
              } else if (layout === '70-30') {
                gridColsClass = 'grid-cols-1 md:grid-cols-12';
                leftColClass = 'md:col-span-8';
                rightColClass = 'md:col-span-4';
              } else if (layout === '30-70') {
                gridColsClass = 'grid-cols-1 md:grid-cols-12';
                leftColClass = 'md:col-span-4';
                rightColClass = 'md:col-span-8';
              }

              return (
                <div key={block.id || idx} className="my-6 w-full">
                  <div className={`grid ${gridColsClass} gap-6 sm:gap-8 items-center`}>
                    {/* Left Column */}
                    <div className={`${leftColClass} space-y-2`}>
                      {block.leftTitle && (
                        <h4 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 pb-1 border-b border-slate-200 dark:border-white/10">
                          {block.leftTitle}
                        </h4>
                      )}
                      {block.leftType === 'image' && block.leftImageUrl ? (
                        <figure className="my-2 max-w-full flex flex-col items-center">
                          <OptimizedImage
                            src={block.leftImageUrl}
                            alt={block.leftImageCaption || 'Hình ảnh cột trái'}
                            sizes="(max-width: 768px) 100vw, 600px"
                            containerClassName="w-full rounded-2xl overflow-hidden"
                            style={
                              block.leftImageHeight && block.leftImageHeight.includes('px')
                                ? { height: block.leftImageHeight }
                                : block.leftImageHeight === '16:9'
                                ? { aspectRatio: '16/9' }
                                : block.leftImageHeight === '1:1'
                                ? { aspectRatio: '1/1' }
                                : { aspectRatio: '4/3' }
                            }
                            className="w-full h-full object-cover rounded-2xl block mx-auto"
                          />
                          {block.leftImageCaption && (
                            <figcaption className="w-full text-xs text-slate-500 dark:text-slate-400 italic text-center pt-2 px-2">
                              {block.leftImageCaption}
                            </figcaption>
                          )}
                        </figure>
                      ) : (
                        <div
                          className="leading-relaxed text-slate-800 dark:text-slate-300 space-y-3"
                          dangerouslySetInnerHTML={{ __html: formatRichText(block.leftText || '') }}
                        />
                      )}
                    </div>

                    {/* Right Column (Side-by-side / Cạnh đoạn văn) */}
                    <div className={`${rightColClass} space-y-2`}>
                      {block.rightTitle && (
                        <h4 className="text-sm font-bold uppercase tracking-wider text-sky-600 dark:text-[#4cd7f6] pb-1 border-b border-slate-200 dark:border-white/10">
                          {block.rightTitle}
                        </h4>
                      )}
                      {block.rightType === 'image' && block.rightImageUrl ? (
                        <figure className="my-2 max-w-full flex flex-col items-center">
                          <OptimizedImage
                            src={block.rightImageUrl}
                            alt={block.rightImageCaption || 'Hình ảnh cột phải'}
                            sizes="(max-width: 768px) 100vw, 600px"
                            containerClassName="w-full rounded-2xl overflow-hidden"
                            style={
                              block.rightImageHeight && block.rightImageHeight.includes('px')
                                ? { height: block.rightImageHeight }
                                : block.rightImageHeight === '16:9'
                                ? { aspectRatio: '16/9' }
                                : block.rightImageHeight === '1:1'
                                ? { aspectRatio: '1/1' }
                                : { aspectRatio: '4/3' }
                            }
                            className="w-full h-full object-cover rounded-2xl block mx-auto"
                          />
                          {block.rightImageCaption && (
                            <figcaption className="w-full text-xs text-slate-500 dark:text-slate-400 italic text-center pt-2 px-2">
                              {block.rightImageCaption}
                            </figcaption>
                          )}
                        </figure>
                      ) : (
                        <div
                          className="leading-relaxed text-slate-800 dark:text-slate-300 space-y-3"
                          dangerouslySetInnerHTML={{ __html: formatRichText(block.rightText || '') }}
                        />
                      )}
                    </div>
                  </div>
                </div>
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
