
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types';

interface Props {
  mediaId: number;
  mediaType: string;
  mediaTitle?: string;
  currentEpisode?: number;
}

type SortOption = 'newest' | 'oldest' | 'top';

const CommentSection: React.FC<Props> = ({ mediaId, mediaType, mediaTitle = "this title", currentEpisode }) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set<string>());
  const [userDislikes, setUserDislikes] = useState<Set<string>>(new Set<string>());
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userId = user?.id || 'guest';
    const storedLikes = localStorage.getItem(`zen_likes_${userId}`);
    const storedDislikes = localStorage.getItem(`zen_dislikes_${userId}`);
    
    if (storedLikes) {
      try { setUserLikes(new Set<string>(JSON.parse(storedLikes))); } catch (e) {}
    }
    if (storedDislikes) {
      try { setUserDislikes(new Set<string>(JSON.parse(storedDislikes))); } catch (e) {}
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

  const saveInteractionsToLocal = (newLikes: Set<string>, newDislikes: Set<string>) => {
    const userId = user?.id || 'guest';
    localStorage.setItem(`zen_likes_${userId}`, JSON.stringify(Array.from(newLikes)));
    localStorage.setItem(`zen_dislikes_${userId}`, JSON.stringify(Array.from(newDislikes)));
  };

  const fetchProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const { data } = await supabase.from('profiles').select('id, avatar_url').in('id', userIds);
      if (data) {
        const profileMap = data.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.avatar_url }), {});
        setProfiles(prev => ({ ...prev, ...profileMap }));
      }
    } catch (err) {}
  };

  const fetchComments = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      let query = supabase.from('comments').select('*').eq('media_id', mediaId).eq('media_type', mediaType);
      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
      else if (sortBy === 'top') query = query.order('likes', { ascending: false });

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      const commentsData: Comment[] = (data as Comment[]) || [];
      setComments(commentsData);
      fetchProfiles(Array.from(new Set(commentsData.map(c => c.user_id))));
    } catch (err) {
      setError("Failed to sync discussion.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [mediaId, mediaType, sortBy]);

  useEffect(() => {
    fetchComments(true);
    const channel = supabase.channel(`discussion_${mediaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `media_id=eq.${mediaId}` }, () => fetchComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mediaId, fetchComments]);

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
      if (!parentId) setNewComment('');
      else { setReplyToId(null); setReplyText(''); }
    } catch (err) {
      setError("Failed to post.");
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
      else { 
        nextLikes += 1; nextLikesSet.add(commentId);
        if (isDisliked) { nextDislikes = Math.max(0, nextDislikes - 1); nextDislikesSet.delete(commentId); }
      }
    } else {
      if (isDisliked) { nextDislikes = Math.max(0, nextDislikes - 1); nextDislikesSet.delete(commentId); }
      else { 
        nextDislikes += 1; nextDislikesSet.add(commentId);
        if (isLiked) { nextLikes = Math.max(0, nextLikes - 1); nextLikesSet.delete(commentId); }
      }
    }

    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: nextLikes, dislikes: nextDislikes } : c));
    setUserLikes(nextLikesSet);
    setUserDislikes(nextDislikesSet);
    saveInteractionsToLocal(nextLikesSet, nextDislikesSet);

    try {
      await supabase.from('comments').update({ likes: nextLikes, dislikes: nextDislikes }).eq('id', commentId);
    } catch (err) { fetchComments(); }
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const replies = comments.filter(c => c.parent_id === comment.id);
    const isLiked = userLikes.has(comment.id);
    const isDisliked = userDislikes.has(comment.id);
    const avatarUrl = profiles[comment.user_id];

    // Mock badges for the aesthetic
    const isGoldUser = comment.likes && comment.likes > 5;

    return (
      <div key={comment.id} className={`flex gap-2.5 md:gap-3 ${isReply ? 'ml-8 md:ml-12 mt-3 md:mt-4' : 'mt-5 md:mt-6'}`}>
        <div className="shrink-0">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden bg-[#1a1c22]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] md:text-xs text-gray-500 bg-[#23252b]">
                {comment.username.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
            <span className={`text-[12px] md:text-[13px] font-bold ${isGoldUser ? 'text-[#ffdd95]' : 'text-[#888]'}`}>
              {comment.username}
            </span>
            {isGoldUser && (
              <span className="text-[8px] md:text-[9px] bg-[#332a18] text-[#ffdd95] px-1 rounded-[2px] font-bold uppercase tracking-tighter">CRAB</span>
            )}
            <span className="text-[10px] md:text-[11px] text-gray-600 font-medium whitespace-nowrap">
              {getTimeAgo(comment.created_at)}
            </span>
          </div>

          <p className="text-[#ccc] text-[13px] md:text-[14px] leading-snug mb-2 font-normal">
            {comment.content}
          </p>

          <div className="flex items-center gap-3 md:gap-4 text-gray-500 text-[11px] md:text-[12px] font-medium">
            <button 
              onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <svg className="w-3 md:w-3.5 h-3 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>

            <button 
              onClick={() => handleInteraction(comment.id, 'like')}
              className={`flex items-center gap-0.5 md:gap-1 hover:text-white transition-colors ${isLiked ? 'text-white' : ''}`}
            >
              <svg className="w-3 md:w-3.5 h-3 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {comment.likes || ''}
            </button>

            <button 
              onClick={() => handleInteraction(comment.id, 'dislike')}
              className={`flex items-center gap-0.5 md:gap-1 hover:text-white transition-colors ${isDisliked ? 'text-white' : ''}`}
            >
              <svg className="w-3 md:w-3.5 h-3 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              {comment.dislikes || ''}
            </button>

            <button className="flex items-center gap-0.5 hover:text-white transition-colors">
              <svg className="w-3 md:w-3.5 h-3 md:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 10a2 2 0 100 4 2 2 0 000-4zM18 10a2 2 0 100 4 2 2 0 000-4zM6 10a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              More
            </button>
          </div>

          {replyToId === comment.id && (
            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-[#16181d] border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#555] min-h-[70px] text-white"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setReplyToId(null)} className="px-3 py-1 text-[11px] font-bold text-gray-500 uppercase">Cancel</button>
                <button type="submit" className="bg-[#555] text-white px-3 py-1 rounded-sm text-[11px] font-bold uppercase">Post</button>
              </div>
            </form>
          )}

          {replies.map(reply => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 md:mt-12 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] md:text-[20px] font-bold text-white flex items-center gap-2">
          <svg className="w-4 md:w-5 h-4 md:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          {comments.length} Comments
        </h2>

        <div className="relative" ref={sortRef}>
          <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="text-[12px] md:text-[13px] text-gray-400 flex items-center gap-1 font-bold">
            Sort by <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-[#23252b] border border-white/5 rounded shadow-xl z-50 min-w-[110px]">
              {(['newest', 'top'] as SortOption[]).map(opt => (
                <button key={opt} onClick={() => { setSortBy(opt); setShowSortDropdown(false); }} className={`w-full px-3 py-2 text-left text-[11px] font-bold hover:bg-white/5 ${sortBy === opt ? 'text-white' : 'text-gray-400'}`}>
                  {opt === 'newest' ? 'Newest' : 'Top Rated'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 md:mb-8">
        {!user ? (
          <div className="bg-[#16181d] rounded-sm p-3.5 text-[12px] md:text-[13px] text-gray-500 font-medium">
            You must be <button onClick={openAuthModal} className="text-[#ffdd95] hover:underline">login</button> to post a comment
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2.5 md:gap-3">
             <div className="shrink-0">
               <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#23252b] flex items-center justify-center text-[10px] md:text-xs text-gray-500 font-bold">
                 {user.user_metadata?.username?.charAt(0) || 'U'}
               </div>
             </div>
             <div className="flex-1 relative">
               <textarea
                 value={newComment}
                 onChange={(e) => setNewComment(e.target.value)}
                 placeholder="Leave a comment"
                 className="w-full bg-[#16181d] border-b border-white/5 p-2.5 md:p-3 text-[13px] md:text-[14px] outline-none focus:border-white/20 min-h-[80px] md:min-h-[90px] text-white resize-none"
               />
               <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                 <button type="button" className="text-gray-500 hover:text-white transition-colors">
                   <svg className="w-4 md:w-5 h-4 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </button>
                 {newComment.trim() && (
                    <button type="submit" disabled={submitting} className="bg-[#555] text-white px-4 md:px-6 py-1.5 rounded-sm text-[11px] font-bold uppercase hover:bg-white hover:text-black transition-all">
                      {submitting ? '...' : 'Post'}
                    </button>
                 )}
               </div>
             </div>
          </form>
        )}
      </div>

      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="py-8 text-center text-gray-500 text-[10px] uppercase tracking-widest font-bold">Loading...</div>
        ) : comments.filter(c => !c.parent_id).map(c => renderComment(c))}
      </div>
    </div>
  );
};

export default CommentSection;
