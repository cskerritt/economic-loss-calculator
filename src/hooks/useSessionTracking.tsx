import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  
  // Detect OS
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Detect Browser
  let browser = 'Unknown Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  
  return `${browser} on ${os}`;
}

function getSessionToken(): string {
  // Create a unique session token for this browser session
  let token = sessionStorage.getItem('session_token');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('session_token', token);
  }
  return token;
}

export function useSessionTracking() {
  const { user, session } = useAuth();

  const trackSession = useCallback(async () => {
    if (!user || !session) return;

    const sessionToken = getSessionToken();
    const deviceInfo = getDeviceInfo();
    const userAgent = navigator.userAgent;

    try {
      // Try to update existing session first
      const { data: existingSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_token', sessionToken)
        .single();

      if (existingSession) {
        // Update last active time
        await supabase
          .from('user_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('session_token', sessionToken);
      } else {
        // Insert new session
        await supabase.from('user_sessions').insert({
          user_id: user.id,
          session_token: sessionToken,
          device_info: deviceInfo,
          user_agent: userAgent,
        });
      }
    } catch (error) {
      console.error('Failed to track session:', error);
    }
  }, [user, session]);

  const removeCurrentSession = useCallback(async () => {
    const sessionToken = getSessionToken();
    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken);
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  }, []);

  useEffect(() => {
    if (user && session) {
      trackSession();
      
      // Update last active periodically
      const interval = setInterval(trackSession, 5 * 60 * 1000); // Every 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [user, session, trackSession]);

  return { trackSession, removeCurrentSession };
}

export function getCurrentSessionToken(): string {
  return sessionStorage.getItem('session_token') || '';
}
