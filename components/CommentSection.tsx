
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Comment } from '../types';

interface Props {
  mediaId: number;
  mediaType: string;
  mediaTitle?: string;
  currentEpisode?: number;
}

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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);
      
      if (!error && data) {
        const profileMap = data.reduce((acc: any, p: any) => ({
          ...acc,
          [p.id]: p.avatar_url
        }), {});
        setProfiles(prev => ({ ...prev, ...profileMap }));
      }
    } catch (err) {
      console.debug('Profiles inaccessible:', err);
    }
  };

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const commentsData: Comment[] = (data as Comment[]) || [];
      setComments(commentsData);
      
      const userIds: string[] = Array.from(new Set(commentsData.map(c => c.user_id)));
      fetchProfiles(userIds);
    } catch (err) {
      setError("Failed to sync discussion.");
    } finally {
      setLoading(false);
    }
  }, [mediaId, mediaType]);

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel(`discussion_${mediaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `media_id=eq.${mediaId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newC = payload.new as Comment;
          setComments(prev => [newC, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
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
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert([{ user_id: user.id, media_id: mediaId, media_type: mediaType, content: content, username: username, parent_id: parentId }])
        .select();

      if (insertError) throw insertError;
      if (!parentId) setNewComment('');
      else { setReplyToId(null); setReplyText(''); }
    } catch (err) {
      setError("Failed to post.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const replies = comments.filter(c => c.parent_id === comment.id).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const avatarUrl = profiles[comment.user_id];
    // Mocking rank badges for aesthetic accuracy to the screenshot
    const hasBadge = comment.username.length % 2 === 0;
    const badgeName = comment.username.length % 3 === 0 ? "STARFISH" : "CRAB";

    return (
      <div key={comment.id} className={`flex gap-4 ${isReply ? 'ml-12 mt-6' : 'mt-8'} animate-comment-in`}>
        <div className="shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-800 border border-white/5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 bg-white/5 uppercase">
                {comment.username.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {hasBadge && (
              <div className="bg-[#f0ad4e]/10 border border-[#f0ad4e]/30 px-1 py-0.5 rounded flex items-center gap-1">
                <svg className="w-2 h-2 text-[#f0ad4e]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-[9px] font-black text-[#f0ad4e] uppercase leading-none">{badgeName}</span>
              </div>
            )}
            <span className={`text-[13px] font-bold ${hasBadge ? 'text-[#f0ad4e]' : 'text-gray-200'}`}>{comment.username}</span>
            <span className="text-[11px] text-gray-500 font-medium ml-1">{getTimeAgo(comment.created_at)}</span>
          </div>

          <p className="mt-1.5 text-gray-300 text-[14px] leading-relaxed whitespace-pre-wrap">{comment.content}</p>

          <div className="mt-3 flex items-center gap-4 text-gray-500">
            <button 
              onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              Reply
            </button>
            <button className="flex items-center gap-1 text-[11px] font-bold hover:text-[#1ce783] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
              {comment.username.length % 5}
            </button>
            <button className="flex items-center gap-1 text-[11px] font-bold hover:text-red-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: 'rotate(180deg)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
              0
            </button>
            <button className="flex items-center gap-1 text-[11px] font-bold hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
              More
            </button>
          </div>

          {replyToId === comment.id && (
            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Leave a comment"
                  className="w-full bg-[#1a1a24] border border-white/5 rounded px-4 py-3 text-sm outline-none focus:border-[#1ce783]/50 min-h-[80px] resize-none pr-10"
                />
                <button type="button" className="absolute right-3 top-3 text-gray-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                 <button type="button" onClick={() => setReplyToId(null)} className="px-4 py-1.5 text-[11px] font-bold uppercase text-gray-500 hover:text-white">Cancel</button>
                 <button type="submit" disabled={submitting || !replyText.trim()} className="bg-[#1ce783] text-black px-6 py-1.5 rounded text-[11px] font-black uppercase disabled:opacity-30">Post</button>
              </div>
            </form>
          )}

          {replies.map(reply => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-12 max-w-5xl mx-auto px-4">
      {/* Discussion Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-6">
          {currentEpisode && (
            <button className="text-[16px] font-bold text-gray-400 hover:text-white flex items-center gap-1 group">
              Episode {currentEpisode}
              <svg className="w-4 h-4 mt-0.5 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            <span className="text-[16px] font-bold text-white">{comments.length} Comments</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 cursor-pointer hover:text-white">
          <span className="text-[12px] font-bold uppercase tracking-tight">Sort by</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* Auth State & Input */}
      {!user ? (
        <div className="bg-[#1a1a24] rounded px-5 py-4 flex items-center gap-4 border border-white/5 mb-8">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-[14px] text-gray-400">
            You must be <button onClick={openAuthModal} className="text-[#1ce783] hover:underline font-bold">login</button> to post a comment
          </p>
        </div>
      ) : (
        <div className="flex gap-4 mb-10">
          <div className="shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-800 border border-white/5">
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 bg-white/5 uppercase">
                {user.user_metadata?.username?.charAt(0) || user.email?.charAt(0)}
              </div>
            </div>
          </div>
          <form onSubmit={(e) => handleSubmit(e)} className="flex-1">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a comment"
                disabled={submitting}
                className="w-full bg-[#1a1a24] border border-white/5 rounded px-5 py-4 text-[14px] outline-none focus:border-[#1ce783]/50 min-h-[100px] resize-none pr-12 disabled:opacity-50"
              />
              <button type="button" className="absolute right-4 top-4 text-gray-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>
            {newComment.trim() && (
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={submitting} className="bg-[#1ce783] text-black px-10 py-2 rounded font-black uppercase text-[12px] tracking-widest hover:brightness-110 transition-all">
                  Post
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-2 border-[#1ce783] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : comments.filter(c => !c.parent_id).length > 0 ? (
          comments.filter(c => !c.parent_id).map(c => renderComment(c))
        ) : (
          <div className="py-20 text-center text-gray-600 font-bold uppercase text-[12px] tracking-widest border border-dashed border-white/5 rounded">
            The discussion hasn't started yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
