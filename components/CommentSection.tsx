
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types';

interface Props {
  mediaId: number;
  mediaType: string;
  mediaTitle?: string;
}

interface ProfileData {
  username?: string;
  avatar_url?: string;
}

type SortOption = 'newest' | 'top';

const CommentSection: React.FC<Props> = ({ mediaId, mediaType }) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set<string>());
  const [userDislikes, setUserDislikes] = useState<Set<string>>(new Set<string>());
  const [sortBy, setSortBy] = useState<SortOption>('top');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set<string>());
  
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const userId = user?.id || 'guest';
    const storedLikes = localStorage.getItem(`zen_likes_${userId}`);
    const storedDislikes = localStorage.getItem(`zen_dislikes_${userId}`);
    
    if (storedLikes) {
      try {
        setUserLikes(new Set<string>(JSON.parse(storedLikes)));
      } catch (err) {
        console.error("Failed to parse likes", err);
      }
    }
    if (storedDislikes) {
      try {
        setUserDislikes(new Set<string>(JSON.parse(storedDislikes)));
      } catch (err) {
        console.error("Failed to parse dislikes", err);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const { data } = await supabase.from('profiles').select('id, avatar_url, username').in('id', userIds);
      if (data) {
        const profileMap = data.reduce((acc: Record<string, ProfileData>, p: { id: string; avatar_url: string; username: string }) => ({ 
          ...acc, 
          [p.id]: { avatar_url: p.avatar_url, username: p.username } 
        }), {});
        setProfiles(prev => ({ ...prev, ...profileMap }));
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const fetchComments = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      let query = supabase.from('comments').select('*').eq('media_id', mediaId).eq('media_type', mediaType);
      
      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'top') query = query.order('likes', { ascending: false });

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      const commentsData: Comment[] = (data as Comment[]) || [];
      setComments(commentsData);
      fetchProfiles(Array.from(new Set(commentsData.map(c => c.user_id))));
    } catch (err) {
      console.error("Discussion sync failed:", err);
      setError("Failed to sync discussion.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [mediaId, mediaType, sortBy]);

  useEffect(() => {
    fetchComments(true);
  }, [mediaId, fetchComments]);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newComment;
    if (!content.trim() || submitting || !user) return;

    setSubmitting(true);
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';

    try {
      const { error: insertError } = await supabase.from('comments').insert([{ 
        user_id: user.id, media_id: mediaId, media_type: mediaType, 
        content: content, username: username, parent_id: parentId,
        likes: 0, dislikes: 0
      }]);
      if (insertError) throw insertError;
      
      if (!parentId) {
        setNewComment('');
      } else {
        setReplyToId(null);
        setReplyText('');
        if (!expandedReplies.has(parentId)) toggleReplies(parentId);
      }
      
      fetchComments();
    } catch (err) {
      console.error("Comment post error:", err);
      setError("Could not post your comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (commentId: string) => {
    if (!editingText.trim() || submitting || !user) return;
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('comments')
        .update({ content: editingText })
        .eq('id', commentId); 
      
      if (updateError) throw updateError;
      
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editingText } : c));
      setEditingCommentId(null);
      setEditingText('');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update comment.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    const target = comments.find(c => c.id === commentId);
    if (!target) return;

    // Safety: only send the delete request if we believe the user is the owner
    if (target.user_id !== user.id) {
      setError("You are not the owner of this comment.");
      return;
    }

    if (!window.confirm("Permanently delete this comment?")) return;

    setSubmitting(true);
    setError(null);

    try {
      // Execute the delete. We rely on RLS to verify ownership on the server side.
      // We don't need to filter by user_id in the eq() if the Policy handles it.
      const { error: deleteError, count } = await supabase
        .from('comments')
        .delete({ count: 'exact' })
        .eq('id', commentId);
      
      if (deleteError) throw deleteError;

      if (count === 0) {
        throw new Error("Access Denied: The database rejected the deletion. Please ensure the SQL fix was applied.");
      }

      // Successful delete: remove from local state immediately
      setComments(prev => {
        const idsToRemove = new Set([commentId]);
        let sizeBefore;
        do {
          sizeBefore = idsToRemove.size;
          prev.forEach(c => {
            if (c.parent_id && idsToRemove.has(c.parent_id)) {
              idsToRemove.add(c.id);
            }
          });
        } while (idsToRemove.size !== sizeBefore);
        
        return prev.filter(c => !idsToRemove.has(c.id));
      });

      if (replyToId === commentId) setReplyToId(null);
      if (editingCommentId === commentId) setEditingCommentId(null);

    } catch (err) {
      console.error("Delete failure:", err);
      const message = err instanceof Error ? err.message : "Could not delete comment.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInteraction = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) { openAuthModal(); return; }
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    let nextLikes = comment.likes || 0;
    let nextDislikes = comment.dislikes || 0;
    const isLiked = userLikes.has(commentId);
    const isDisliked = userDislikes.has(commentId);
    const nextLikesSet = new Set<string>(userLikes);
    const nextDislikesSet = new Set<string>(userDislikes);

    if (type === 'like') {
      if (isLiked) { nextLikes = Math.max(0, nextLikes - 1); nextLikesSet.delete(commentId); } 
      else { nextLikes += 1; nextLikesSet.add(commentId); if (isDisliked) { nextDislikes = Math.max(0, nextDislikes - 1); nextDislikesSet.delete(commentId); } }
    } else {
      if (isDisliked) { nextDislikes = Math.max(0, nextDislikes - 1); nextDislikesSet.delete(commentId); } 
      else { nextDislikes += 1; nextDislikesSet.add(commentId); if (isLiked) { nextLikes = Math.max(0, nextLikes - 1); nextLikesSet.delete(commentId); } }
    }

    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: nextLikes, dislikes: nextDislikes } : c));
    setUserLikes(nextLikesSet);
    setUserDislikes(nextDislikesSet);

    try {
      await supabase.from('comments').update({ likes: nextLikes, dislikes: nextDislikes }).eq('id', commentId);
    } catch { /* ignore interaction update err */ }
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const replies = comments.filter(c => c.parent_id === comment.id);
    const profile = profiles[comment.user_id];
    const displayUsername = profile?.username || comment.username;
    const avatarUrl = profile?.avatar_url;
    const isExpanded = expandedReplies.has(comment.id);
    const isOwnComment = user?.id === comment.user_id;
    const isEditing = editingCommentId === comment.id;

    return (
      <div key={comment.id} className="w-full">
        <div className={`flex gap-4 ${isReply ? 'mt-4' : 'mt-8'}`}>
          <div className="shrink-0">
            <div className={`${isReply ? 'w-6 h-6' : 'w-10 h-10'} rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase`}>
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : displayUsername?.charAt(0) || '?'}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold text-white leading-none">@{displayUsername?.toLowerCase().replace(/\s/g, '') || 'anonymous'}</span>
              <span className="text-[11px] text-gray-500 font-medium">{getTimeAgo(comment.created_at)}</span>
              {isOwnComment && <span className="bg-[#1ce783]/20 text-[#1ce783] text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ml-1">You</span>}
            </div>

            {isEditing ? (
              <div className="mt-2 bg-white/5 rounded-xl p-3 border border-white/10">
                <textarea autoFocus value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full bg-transparent border-b border-[#1ce783] py-2 text-[14px] outline-none text-white resize-none" rows={2} />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-[11px] font-bold text-white hover:bg-white/10 rounded-full">Cancel</button>
                  <button onClick={() => handleEditSave(comment.id)} disabled={submitting} className="px-4 py-1 text-[11px] font-bold bg-[#1ce783] text-black rounded-full transition-all disabled:opacity-50">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-white text-[14px] leading-normal mb-2 whitespace-pre-wrap">{comment.content}</p>
            )}

            {!isEditing && (
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleInteraction(comment.id, 'like')} className={`p-1 hover:bg-white/10 rounded-full transition-colors transform-gpu active:scale-125 ${userLikes.has(comment.id) ? 'text-white' : ''}`}>
                    <svg className="w-4 h-4" fill={userLikes.has(comment.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904"/></svg>
                  </button>
                  <span className="text-[11px] font-medium">{comment.likes || 0}</span>
                </div>
                <button onClick={() => { if (!user) { openAuthModal(); return; } setReplyToId(replyToId === comment.id ? null : comment.id); }} className="text-[11px] font-bold px-3 py-1 hover:bg-white/10 rounded-full transition-colors transform-gpu active:scale-95">Reply</button>
                {isOwnComment && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingCommentId(comment.id); setEditingText(comment.content); }} className="text-[9px] font-black uppercase text-gray-500 hover:text-[#1ce783] transition-colors">Edit</button>
                    <button onClick={() => handleDelete(comment.id)} disabled={submitting} className="text-[9px] font-black uppercase text-gray-500 hover:text-red-500 transition-colors disabled:opacity-30">Delete</button>
                  </div>
                )}
              </div>
            )}

            {replyToId === comment.id && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4 flex gap-4 animate-in slide-in-from-top-2 duration-200">
                <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Add a reply..." className="flex-1 bg-transparent border-b border-white/20 pb-1 text-[13px] outline-none focus:border-white transition-all" />
                <button type="submit" disabled={!replyText.trim() || submitting} className="text-[11px] font-black uppercase text-[#1ce783] disabled:opacity-30 transform-gpu active:scale-90 transition-all">Post</button>
              </form>
            )}

            {replies.length > 0 && !isReply && (
              <button onClick={() => toggleReplies(comment.id)} className="mt-2 flex items-center gap-2 text-[#3ea6ff] text-[13px] font-bold hover:text-white transition-colors">
                <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>

        {isExpanded && !isReply && (
          <div className="ml-10 md:ml-14 border-l border-white/5 pl-2 animate-in slide-in-from-left-2 duration-200">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12 w-full max-w-4xl mx-auto px-2">
      <div className="flex flex-col gap-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <span className="flex-1 pr-8 text-red-400">Sync Error</span>
              <button onClick={() => setError(null)} className="shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">✕</button>
            </div>
            <p className="text-gray-400 font-bold lowercase normal-case tracking-normal text-[13px] leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <div className="flex items-center gap-8 border-b border-white/5 pb-4">
          <h2 className="text-[20px] font-black uppercase italic tracking-tighter text-white">
            {comments.length} <span className="text-[#1ce783]">Comments</span>
          </h2>
          <div className="relative" ref={sortRef}>
            <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="text-[12px] text-gray-400 flex items-center gap-2 font-bold hover:text-white transition-colors">
              Sort by {sortBy === 'top' ? 'Top' : 'Newest'}
            </button>
            {showSortDropdown && (
              <div className="absolute left-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[120px] animate-in fade-in zoom-in-95 duration-150">
                {['top', 'newest'].map(opt => (
                  <button key={opt} onClick={() => { setSortBy(opt as SortOption); setShowSortDropdown(false); fetchComments(); }} className="w-full px-4 py-2 text-left text-[11px] font-bold text-gray-300 hover:bg-[#1ce783] hover:text-black uppercase tracking-widest transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          {!user ? (
            <div className="bg-white/5 rounded-xl p-4 text-[13px] text-gray-400 border border-white/5">
              Join the conversation. <button onClick={openAuthModal} className="text-[#1ce783] font-black hover:underline">Sign In</button>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e)} className="flex gap-4 group">
               <div className="shrink-0 pt-1">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-sm font-black text-black shadow-lg">
                   {user.user_metadata?.username?.charAt(0) || 'U'}
                 </div>
               </div>
               <div className="flex-1">
                 <textarea
                   value={newComment}
                   onChange={(e) => setNewComment(e.target.value)}
                   placeholder="Add a comment..."
                   className="w-full bg-transparent border-b border-white/20 py-2 text-[14px] outline-none focus:border-[#1ce783] transition-all resize-none min-h-[40px]"
                   rows={1}
                 />
                 <div className="flex justify-end gap-2 mt-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <button type="button" onClick={() => setNewComment('')} className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-white">Cancel</button>
                    <button type="submit" disabled={!newComment.trim() || submitting} className="px-6 py-2 text-[12px] font-black uppercase tracking-widest rounded-full bg-[#1ce783] text-black disabled:opacity-30 hover:scale-105 transition-all transform-gpu">Comment</button>
                 </div>
               </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm font-bold italic">No comments yet.</div>
          ) : (
            comments.filter(c => !c.parent_id).map(c => renderComment(c))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
