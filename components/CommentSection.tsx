
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types';
import ProfilePreviewModal from './ProfilePreviewModal';

interface Props {
  mediaId: number;
  mediaType: string;
  mediaTitle?: string;
}

// Extend the local comment type to include profile data fetched from the join
interface CommentWithProfile extends Comment {
  profiles?: {
    name: string;
    profile_pic: string;
  };
}

const CommentSection: React.FC<Props> = ({ mediaId, mediaType }) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set<string>());
  const [previewUser, setPreviewUser] = useState<any>(null);

  const userHasComment = user && comments.some(c => c.user_id === user.id && !c.parent_id);

  const fetchComments = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // We fetch from comments and join with the 'user-info' table to get the LATEST avatar and name
      // This bypasses the need for 'avatar_url' and 'username' columns in the 'comments' table
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles: "user-info" (
            name,
            profile_pic
          )
        `)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType);

      if (fetchError) throw fetchError;
      
      let commentsData = (data as CommentWithProfile[]) || [];

      if (sortBy === 'top') {
        commentsData.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          const scoreA = (a.likes || 0) - (a.dislikes || 0) + (a.is_hearted ? 500 : 0) + ((a.reply_count || 0) * 2);
          const scoreB = (b.likes || 0) - (b.dislikes || 0) + (b.is_hearted ? 500 : 0) + ((b.reply_count || 0) * 2);
          return scoreB - scoreA;
        });
      } else {
        commentsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setComments(commentsData);
    } catch (err: any) {
      console.error("Fetch comments error:", err);
      setError("Failed to sync discussion.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [mediaId, mediaType, sortBy]);

  useEffect(() => {
    fetchComments(true);
  }, [mediaId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    setError(null);
    const content = parentId ? replyText : newComment;
    
    if (!content.trim()) return;
    if (!user) {
      openAuthModal();
      return;
    }

    if (!parentId && userHasComment) {
      setError("You've already reviewed this. Try editing your existing comment!");
      return;
    }

    setSubmitting(true);

    try {
      // NOTE: Removed 'avatar_url' and 'username' from the payload 
      // as they are handled by the 'profiles' join in the fetch.
      const payload = { 
        user_id: user.id, 
        media_id: mediaId, 
        media_type: mediaType, 
        content: content, 
        parent_id: parentId,
        likes: 0, 
        dislikes: 0, 
        is_pinned: false, 
        is_hearted: false,
        reply_count: 0
      };

      const { error: insertError } = await supabase.from('comments').insert([payload]);
      
      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw new Error(insertError.message);
      }
      
      if (!parentId) setNewComment('');
      else { setReplyToId(null); setReplyText(''); }
      
      await fetchComments();
    } catch (err: any) {
      console.error("Comment Post Failed:", err);
      setError(err.message || "Post failed. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInteraction = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) { openAuthModal(); return; }
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      const updateData = type === 'like' 
        ? { likes: (comment.likes || 0) + 1 }
        : { dislikes: (comment.dislikes || 0) + 1 };
        
      const { error: updateError } = await supabase.from('comments').update(updateData).eq('id', commentId);
      if (updateError) throw updateError;
      fetchComments();
    } catch (err) {
      console.error("Interaction failed:", err);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const renderComment = (comment: CommentWithProfile, isReply: boolean = false) => {
    const replies = comments.filter(c => c.parent_id === comment.id);
    const isExpanded = expandedReplies.has(comment.id);
    const isOwn = user?.id === comment.user_id;
    const isDeleted = comment.content === null;

    // Use the joined profile data, falling back to basic info if the join is empty
    const displayName = comment.profiles?.name || comment.username || 'User';
    const displayAvatar = comment.profiles?.profile_pic || comment.avatar_url;

    return (
      <div key={comment.id} className={`w-full ${isReply ? 'mt-3 pl-4 border-l border-white/5' : 'mt-6'}`}>
        <div className="flex gap-3">
          <button 
            onClick={() => setPreviewUser({ id: comment.user_id, username: displayName, avatar_url: displayAvatar })}
            className="shrink-0"
          >
            <div className={`${isReply ? 'w-6 h-6' : 'w-9 h-9'} rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black`}>
              {displayAvatar ? <img src={displayAvatar} className="w-full h-full object-cover" /> : displayName.charAt(0)}
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[12px] font-black text-white hover:underline cursor-pointer">@{displayName.toLowerCase()}</span>
              <span className="text-[10px] text-gray-500 font-bold">{getTimeAgo(comment.created_at)}</span>
              {comment.is_pinned && <span className="bg-[#1ce783]/20 text-[#1ce783] text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm flex items-center gap-1">📌 Pinned</span>}
              {comment.is_hearted && <span className="text-red-500 text-[10px]">❤️</span>}
            </div>

            <div className="text-[13px] text-gray-200 leading-relaxed mb-2">
              {isDeleted ? (
                <span className="text-gray-600 italic font-medium">[comment deleted]</span>
              ) : (
                comment.content
              )}
            </div>

            {!isDeleted && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 group">
                  <button onClick={() => handleInteraction(comment.id, 'like')} className="p-1 text-gray-500 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.708c.286 0 .566.123.76.339l.135.143c.842.893.69 2.32-.326 3.012l-1.125.756a1 1 0 00-.448.832v.003c0 .17-.067.33-.187.45l-.135.135a1 1 0 01-.707.293H12.382a1 1 0 00-.894.553l-.511 1.022a1 1 0 01-.894.553H8.382a1 1 0 01-.894-.553l-.511-1.022a1 1 0 00-.894-.553H3.123a1 1 0 01-.894-.553l-.511-1.022a1 1 0 00-.894-.553H1a1 1 0 01-1-1v-4a1 1 0 011-1h3.123a1 1 0 00.894.553l.511 1.022a1 1 0 01.894.553h1.618a1 1 0 01.894.553l.511 1.022a1 1 0 00.894.553h3.708a1 1 0 00.894-.553l.511-1.022a1 1 0 01.894-.553H14V10z"/></svg>
                  </button>
                  <span className="text-[10px] font-black text-gray-500 group-hover:text-white transition-colors">{comment.likes}</span>
                </div>
                
                <button onClick={() => handleInteraction(comment.id, 'dislike')} className="p-1 text-gray-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.292a1 1 0 00-.76.339l-.135.143c-.842.893-.69 2.32.326 3.012l1.125.756a1 1 0 00.448.832v.003c0 .17.067.33.187.45l.135.135a1 1 0 01.707.293h2.618a1 1 0 00.894.553l.511 1.022a1 1 0 01.894.553h1.618a1 1 0 01.894-.553l.511-1.022a1 1 0 00.894-.553h3.123a1 1 0 01.894.553l.511 1.022a1 1 0 00.894.553H23a1 1 0 011 1v4a1 1 0 01-1 1h-3.123a1 1 0 00-.894-.553l-.511-1.022a1 1 0 01-.894-.553h-1.618a1 1 0 01-.894-.553l-.511-1.022a1 1 0 00-.894-.553h-3.708a1 1 0 00-.894.553l-.511-1.022a1 1 0 01-.894.553H10V14z"/></svg>
                </button>

                {!isReply && (
                  <button onClick={() => { if (!user) openAuthModal(); else setReplyToId(replyToId === comment.id ? null : comment.id); }} className="text-[10px] font-black uppercase text-gray-500 hover:text-white">Reply</button>
                )}

                {isOwn && <button onClick={async () => {
                   if (!window.confirm("Delete this comment?")) return;
                   const { error } = await supabase.from('comments').update({ content: null }).eq('id', comment.id);
                   if (!error) fetchComments();
                }} className="text-[10px] font-black uppercase text-gray-600 hover:text-red-500">Delete</button>}
              </div>
            )}

            {replyToId === comment.id && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3 flex gap-3 animate-in slide-in-from-top-2 duration-200">
                <input autoFocus value={replyText} onChange={(e) => { setReplyText(e.target.value); setError(null); }} placeholder="Add a reply..." className="flex-1 bg-transparent border-b border-white/20 pb-1 text-[12px] outline-none focus:border-[#1ce783] transition-all" />
                <button type="submit" disabled={!replyText.trim() || submitting} className="text-[10px] font-black uppercase text-[#1ce783] hover:scale-105 active:scale-95 transition-all">
                  {submitting ? '...' : 'Post'}
                </button>
              </form>
            )}

            {replies.length > 0 && !isReply && (
              <button onClick={() => setExpandedReplies(prev => { const n = new Set(prev); if (n.has(comment.id)) n.delete(comment.id); else n.add(comment.id); return n; })} className="mt-2 text-[#3ea6ff] text-[12px] font-black hover:bg-[#3ea6ff]/10 px-2 py-1 rounded-full transition-all">
                {isExpanded ? 'Hide' : `View ${replies.length}`} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {isExpanded && !isReply && (
              <div className="mt-1 animate-in slide-in-from-left-1 duration-200">
                {replies.map(r => renderComment(r, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-16 w-full max-w-3xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">
            {comments.length} <span className="text-[#1ce783]">Discussion</span>
          </h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setSortBy('top')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${sortBy === 'top' ? 'text-[#1ce783]' : 'text-gray-500 hover:text-white'}`}>Top</button>
          <button onClick={() => setSortBy('newest')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${sortBy === 'newest' ? 'text-[#1ce783]' : 'text-gray-500 hover:text-white'}`}>Newest</button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in slide-in-from-top-2">
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      <div className="mb-10">
        {!user ? (
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[12px] text-gray-500 text-center font-bold">
            Join the elite circle. <button onClick={openAuthModal} className="text-[#1ce783] hover:underline">Sign In</button>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e)} className="flex gap-4 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-sm font-black text-black shrink-0 shadow-lg">
              {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover rounded-full" /> : user.user_metadata?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => { setNewComment(e.target.value); setError(null); }}
                placeholder={userHasComment ? "You've already reviewed this movie." : "Share your impression..."}
                disabled={userHasComment || submitting}
                className="w-full bg-transparent border-b border-white/10 py-2 text-[14px] outline-none focus:border-[#1ce783] transition-all resize-none min-h-[40px] disabled:opacity-40"
                rows={1}
              />
              <div className="flex justify-end gap-2 mt-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                 <button type="button" onClick={() => { setNewComment(''); setError(null); }} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Cancel</button>
                 <button type="submit" disabled={!newComment.trim() || submitting || userHasComment} className="px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-sm bg-[#1ce783] text-black disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#1ce783]/20">
                   {submitting ? 'Posting...' : 'Comment'}
                 </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div></div>
        ) : comments.length === 0 ? (
          <p className="py-20 text-center text-gray-600 italic font-medium">Be the pioneer of this discussion.</p>
        ) : (
          comments.filter(c => !c.parent_id).map(c => renderComment(c))
        )}
      </div>

      <ProfilePreviewModal user={previewUser} onClose={() => setPreviewUser(null)} />
    </div>
  );
};

export default CommentSection;
