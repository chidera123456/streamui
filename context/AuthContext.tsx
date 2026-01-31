
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
  updateProfile: (data: { username?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const updateProfile = async (data: { username?: string }) => {
    if (!user) return { success: false, message: 'No active session' };

    const { data: updatedUser, error: authError } = await supabase.auth.updateUser({
      data: { 
        username: data.username !== undefined ? data.username : user.user_metadata?.username
      }
    });
    
    if (authError) return { success: false, message: authError.message };

    const { error: profileError } = await supabase.from('user-info').upsert({
      user_id: user.id,
      name: data.username !== undefined ? data.username : user.user_metadata?.username,
    }, { onConflict: 'user_id' });

    if (profileError) console.error("Profile sync error:", profileError.message);

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
      login, register, updateProfile, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
