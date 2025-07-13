/**
 * ENTERPRISE GOOGLE AUTHENTICATION
 * Full OAuth integration with profile management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Loader2, Mail, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';

interface EnhancedGoogleAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const EnhancedGoogleAuth: React.FC<EnhancedGoogleAuthProps> = ({ 
  onSuccess, 
  onError,
  className 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }

      // The redirect will handle the success flow
      toast.success('Redirecting to Google...', {
        icon: <Shield className="w-4 h-4" />
      });

      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Google Sign-in failed. Please try again.';
      console.error('Google OAuth Error:', error);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        variant="outline"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span className="text-gray-900">
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </span>
        <ExternalLink className="w-4 h-4 text-gray-600" />
      </Button>
    </motion.div>
  );
};

interface UserProfileProps {
  user: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
    provider?: string;
    verified?: boolean;
  };
  onSignOut?: () => void;
  showActions?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  onSignOut,
  showActions = true 
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!onSignOut) return;
    
    setIsSigningOut(true);
    try {
      await onSignOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Sign out failed');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-10 h-10 rounded-full border-2 border-purple-500/20 object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        {user.verified && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-800">
            <Shield className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user.name || user.email.split('@')[0]}
        </p>
        <div className="flex items-center gap-1">
          <Mail className="w-3 h-3 text-gray-400" />
          <p className="text-xs text-gray-400 truncate">
            {user.email}
          </p>
        </div>
        {user.provider && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
              {user.provider}
            </span>
          </div>
        )}
      </div>
      
      {showActions && onSignOut && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-xs border-gray-600 hover:bg-gray-700"
        >
          {isSigningOut ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            'Sign Out'
          )}
        </Button>
      )}
      
      {user.provider === 'google' && (
        <div className="flex-shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
};