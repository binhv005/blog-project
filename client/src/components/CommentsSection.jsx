import React, { useState } from 'react';
import { optimizeImageUrl } from '../utils/mediaOptimizer';

const initialComments = [
  {
    id: 1,
    author: 'Trần Đình Huy',
    role: 'Security Engineer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvEEbBlzrIRSfQjpZXhMpOeqWEgoYXuOt9jPXj1w_LzumldgKU1tcywxAoihHxNs4wHl0hxhnyriRtuCIb8QkVQi03_WhYxRgZM8nRD17WK1TGX0W56MUMJnJqCyFNHEUYS0eSczpy9ynnMZD4FJiojV79iaBVtxah97JwPn6OstZgTTjyHoVuq9mQB8q0w7JKPBWGx5VNpSoPE7NhQeO1riRIh02T-1s2eTJreyUFnB7QlnzlTVsQ0Q',
    time: '2 ngày trước',
    content: 'Bài viết phân tích rất chuẩn xác. Việc triển khai FIDO2 và passkey kết hợp mô hình Zero-Trust đúng là chìa khóa để vừa tối ưu UX vừa thỏa mãn quy định Nghị định 13. Bên bạn có kế hoạch phát hành SDK mở cho React Native không?',
    likes: 14,
    hasLiked: false,
    replies: [
      {
        id: 11,
        author: 'Alex Vũ',
        isAuthor: true,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLo36lcDCKAhD5NbHFcYDGttO-6qEK6M3MRmVCG8_akfuzD_mtImDtGlUq5soFCOaDsjP3m109TLGSv1SJlvlz-dy_7UTSKMILYgnGmMLCYXA9diA1xdrg7VklRnDMC_BC2OPxU20NM2_qZQEq4GE5hs80-Pgq6eOTaZBWRK56KQQITVXZTsO4jMiM8T1NS_7hb92NgWGA3Pna2amEvIybBbDKU5NcNqRkpKix2GIeh_HFQRRf99ASHA',
        time: '1 ngày trước',
        content: 'Chào anh Huy, DUDI Software SDK phiên bản v3.2 dự kiến ra mắt vào Q4/2026 sẽ chính thức hỗ trợ full React Native và Flutter với native bridge tăng tốc xác thực phần cứng nhé!',
        likes: 8,
        hasLiked: false,
      }
    ]
  },
  {
    id: 2,
    author: 'Nguyễn Minh Châu',
    role: '',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYpDS2S9MbFoq-e844LnYDnXBS63tPKKQUeAUHz7t8OxTMpKPMOpxGNMtiDDP7G2k91heQfEnHrcqSY3spxst8Kqua5imLBNsPkLkNoMcoR3TiYIksEgmiWhr1Z2Wm9Uuxhqqe73RNCFhzrWf3oXEuj1Kj_bNMMwxkSj8zoH5brNC20w2PBBB-uO_N5GHhJt-i5hfYfmw07rzY3gJPCm7PlQRlSAPA97qbJxo_uxj78kxtUgvjDZrcFg',
    time: '3 ngày trước',
    content: 'Số liệu giảm 65% thời gian onboarding rất ấn tượng. Doanh nghiệp mình đang làm fintech và bước eKYC vẫn là bước drop rate cao nhất, hy vọng sẽ có cơ hội hợp tác tích hợp giải pháp này cùng DUDI.',
    likes: 6,
    hasLiked: false,
    replies: []
  }
];

export default function CommentsSection() {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj = {
      id: Date.now(),
      author: 'Khách tham quan',
      role: 'Thành viên',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      time: 'Vừa xong',
      content: newComment,
      likes: 0,
      hasLiked: false,
      replies: []
    };

    setComments([commentObj, ...comments]);
    setNewComment('');
  };

  const handleLikeComment = (commentId) => {
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likes: c.hasLiked ? c.likes - 1 : c.likes + 1,
          hasLiked: !c.hasLiked
        };
      }
      return c;
    }));
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      
      {/* Title Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-500">forum</span>
          <h3 className="text-xl font-bold text-white">Bình luận &amp; Thảo luận</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-slate-300">
            {comments.length + 1}
          </span>
        </div>
        <span className="text-xs text-slate-400">Tất cả bình luận được kiểm duyệt tự động</span>
      </div>

      {/* Comment Input Box */}
      <div className="p-5 rounded-2xl bg-[#141024] border border-purple-900/40 mb-8">
        <div className="flex items-start gap-3.5 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            DU
          </div>
          <div className="flex-grow">
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none" 
              placeholder="Chia sẻ quan điểm hoặc đặt câu hỏi về giải pháp kiến trúc..." 
              rows="3"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button type="button" className="hover:text-slate-200 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">code</span> Code block
            </button>
            <span>•</span>
            <button type="button" className="hover:text-slate-200 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">attach_file</span> Đính kèm
            </button>
          </div>
          <button 
            type="button"
            onClick={handleSubmitComment}
            className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-blue-600 hover:opacity-95 shadow-md shadow-rose-600/20 transition-all"
          >
            Gửi bình luận
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-5">
        {comments.map((comment) => (
          <div key={comment.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3">
                <img 
                  alt={comment.author} 
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20" 
                  src={optimizeImageUrl(comment.avatar, { width: 80, quality: 75 })}
                  loading="lazy"
                  decoding="async" 
                />
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {comment.author}
                    {comment.role && (
                      <span className="text-[10px] font-normal text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                        {comment.role}
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-slate-500">{comment.time}</span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-base">more_horiz</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
              {comment.content}
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <button 
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 transition-colors ${comment.hasLiked ? 'text-rose-400' : 'hover:text-rose-400'}`}
              >
                <span className={`material-symbols-outlined text-[15px] ${comment.hasLiked ? 'fill-1' : ''}`}>thumb_up</span>
                <span>{comment.likes}</span>
              </button>
              <button className="hover:text-white transition-colors">Trả lời</button>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.map((reply) => (
              <div key={reply.id} className="mt-4 pt-4 border-t border-white/5 pl-4 sm:pl-8 flex items-start gap-3">
                <img 
                  alt={reply.author} 
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-rose-500/50 flex-shrink-0" 
                  src={optimizeImageUrl(reply.avatar, { width: 80, quality: 75 })}
                  loading="lazy"
                  decoding="async" 
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{reply.author}</span>
                    {reply.isAuthor && (
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-semibold border border-rose-500/30">
                        Tác giả
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{reply.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    {reply.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                    <button className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                      <span>{reply.likes}</span>
                    </button>
                    <button className="hover:text-white transition-colors">Trả lời</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}
