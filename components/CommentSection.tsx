
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types';

interface Props {
  mediaId: number;
  mediaType: string;
}

const CommentSection: React.FC<Props> = ({ mediaId, mediaType }) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [mediaId, mediaType]);

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    const content = parentId ? replyText : newComment;
    if (!content.trim()) return;

    setSubmitting(true);
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'ZenUser';

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            user_id: user.id,
            media_id: mediaId,
            media_type: mediaType,
            content: content,
            username: username,
            parent_id: parentId
          }
        ])
        .select();

      if (error) throw error;
      
      setComments(prev => [data[0], ...prev]);
      
      if (parentId) {
        setReplyToId(null);
        setReplyText('');
      } else {
        setNewComment('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      // Also filter out any children if they were deleted by Cascade (or manually handle)
      setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const replies = comments.filter(c => c.parent_id === comment.id).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const isOwner = user?.id === comment.user_id;

    return (
      <div key={comment.id} className={`space-y-4 ${isReply ? 'ml-6 md:ml-12 border-l border-white/5 pl-4 md:pl-6' : ''}`}>
        <div className="group bg-white/5 border border-white/5 hover:border-[#1ce783]/20 rounded-2xl p-4 md:p-6 transition-all duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-[10px] font-black text-black uppercase">
                {comment.username.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-tight">{comment.username}</h4>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isReply && (
                <button 
                  onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                  className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#1ce783] transition-colors px-2 py-1"
                >
                  Reply
                </button>
              )}
              {isOwner && (
                <button 
                  onClick={() => handleDelete(comment.id)}
                  className="text-gray-600 hover:text-red-500 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-gray-300 text-sm leading-relaxed font-medium">
            {comment.content}
          </p>

          {/* Inline Reply Form */}
          {replyToId === comment.id && (
            <form 
              onSubmit={(e) => handleSubmit(e, comment.id)} 
              className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Replying to ${comment.username}...`}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1ce783] transition-all min-h-[80px] resize-none"
              />
              <div className="flex justify-end gap-2">
                 <button 
                    type="button" 
                    onClick={() => setReplyToId(null)}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
                  >
                    Cancel
                 </button>
                 <button 
                    type="submit" 
                    disabled={submitting || !replyText.trim()}
                    className="bg-[#1ce783] text-black px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-20"
                  >
                    Post Reply
                 </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Render child replies recursively */}
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  const topLevelComments = comments.filter(c => !c.parent_id);

  return (
    <div className="mt-16 border-t border-white/5 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black text-[#1ce783] uppercase tracking-[0.4em] mb-1">Community</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">
            Collective <span className="text-[#1ce783]">Vibe</span>
          </h2>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-full border border-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {comments.length} Thoughts
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Post Comment */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest mb-4">Leave a mark</h3>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "What's the verdict?" : "Sign in to join the talk..."}
                disabled={!user || submitting}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm outline-none focus:border-[#1ce783] transition-all min-h-[120px] resize-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || submitting || !newComment.trim()}
                className="w-full bg-[#1ce783] hover:bg-white text-black py-3 rounded-xl font-black uppercase italic tracking-widest transition-all transform active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
              >
                {submitting ? 'Streaming...' : 'Post Thought'}
              </button>
              {!user && (
                <p className="text-[9px] text-gray-500 text-center font-bold uppercase tracking-tight">
                  Authentication required for community access
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Comment List */}
        <div className="lg:col-span-2 space-y-8">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
            ))
          ) : topLevelComments.length > 0 ? (
            topLevelComments.map((comment) => renderComment(comment))
          ) : (
            <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
              <p className="text-gray-500 font-black uppercase italic text-xs tracking-widest">Silence is golden, but your opinion is better.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
