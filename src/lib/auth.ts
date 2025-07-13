import { supabase } from './supabase';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
}

export class AuthService {
  async getCurrentUser(): Promise<AppUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<{ user?: AppUser; error?: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      if (!data.user) return { error: new Error('No user returned') };

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email,
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<{ user?: AppUser; error?: any }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email,
          }
        }
      });

      if (error) return { error };
      if (!data.user) return { error: new Error('No user returned') };

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: name || data.user.email,
        }
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  onAuthStateChange(callback: (user: AppUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email,
        });
      } else {
        callback(null);
      }
    });
  }
}

// Keep the original function exports for backward compatibility
export const getCurrentUser = async (): Promise<AppUser | null> => {
  const authService = new AuthService();
  return authService.getCurrentUser();
};

export const signIn = async (email: string, password: string): Promise<AppUser> => {
  const authService = new AuthService();
  const result = await authService.signIn(email, password);
  if (result.error) throw result.error;
  return result.user!;
};

export const signUp = async (email: string, password: string, name?: string): Promise<AppUser> => {
  const authService = new AuthService();
  const result = await authService.signUp(email, password, name);
  if (result.error) throw result.error;
  return result.user!;
};

export const signOut = async (): Promise<void> => {
  const authService = new AuthService();
  return authService.signOut();
};

export const onAuthStateChange = (callback: (user: AppUser | null) => void) => {
  const authService = new AuthService();
  return authService.onAuthStateChange(callback);
};
