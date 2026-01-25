
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: { username?: string; avatar_url?: string }) => Promise<{ success: boolean; message: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; message: string }>;
  deleteAvatar: () => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

// Correct usage of named import createContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Correct usage of named import useState
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Correct usage of named import useEffect
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Auth initialization failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    closeAuthModal();
    return { success: true, message: 'Welcome back!' };
  };

  const register = async (username: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });
    if (error) return { success: false, message: error.message };
    closeAuthModal();
    return { success: true, message: 'Account created successfully!' };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { success: false, message: 'No active session' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pics/${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user_profiles')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user_profiles')
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl, message: 'Upload successful' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const deleteAvatar = async () => {
    if (!user) return { success: false, message: 'No active session' };
    
    const currentUrl = user.user_metadata?.avatar_url;
    if (!currentUrl) return { success: true, message: 'No avatar to delete' };

    try {
      const pathParts = currentUrl.split('/user_profiles/')[1];
      if (pathParts) {
        const decodedPath = decodeURIComponent(pathParts.split('?')[0]);
        await supabase.storage.from('user_profiles').remove([decodedPath]);
      }

      return await updateProfile({ avatar_url: '' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const updateProfile = async (data: { username?: string; avatar_url?: string }) => {
    if (!user) return { success: false, message: 'No active session' };

    const { data: updatedUser, error: authError } = await supabase.auth.updateUser({
      data: { 
        username: data.username !== undefined ? data.username : user.user_metadata?.username,
        avatar_url: data.avatar_url !== undefined ? data.avatar_url : user.user_metadata?.avatar_url
      }
    });
    
    if (authError) return { success: false, message: authError.message };

    const { error: profileError } = await supabase.from('user-info').upsert({
      user_id: user.id,
      name: data.username !== undefined ? data.username : user.user_metadata?.username,
      profile_pic: data.avatar_url !== undefined ? data.avatar_url : user.user_metadata?.avatar_url,
    }, { onConflict: 'user_id' });

    if (profileError) console.error("Profile sync error:", profileError.message);

    // NOTE: We no longer update the 'comments' table directly here.
    // Instead, the CommentSection uses a relational join to 'user-info' 
    // to fetch the latest name and picture, which is much more efficient
    // and prevents "missing column" crashes.

    setUser(updatedUser.user);
    return { success: true, message: 'Profile updated!' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsProfileModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, isAuthModalOpen, isProfileModalOpen, 
      openAuthModal, closeAuthModal, openProfileModal, closeProfileModal,
      login, register, updateProfile, uploadAvatar, deleteAvatar, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  // Correct usage of named import useContext
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
