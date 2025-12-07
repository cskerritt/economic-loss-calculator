import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentSessionToken } from '@/hooks/useSessionTracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Laptop, Smartphone, Monitor, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface UserSession {
  id: string;
  device_info: string | null;
  user_agent: string | null;
  last_active_at: string;
  created_at: string;
  session_token: string;
}

function getDeviceIcon(deviceInfo: string | null) {
  if (!deviceInfo) return <Monitor className="h-5 w-5" />;
  const info = deviceInfo.toLowerCase();
  if (info.includes('android') || info.includes('ios')) {
    return <Smartphone className="h-5 w-5" />;
  }
  return <Laptop className="h-5 w-5" />;
}

export function SessionManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const currentToken = getCurrentSessionToken();

  const fetchSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(s => s.id !== sessionId));
      toast({
        title: 'Session revoked',
        description: 'The device has been signed out',
      });
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke session',
        variant: 'destructive',
      });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    setRevokingAll(true);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user?.id)
        .neq('session_token', currentToken);

      if (error) throw error;

      setSessions(sessions.filter(s => s.session_token === currentToken));
      toast({
        title: 'All other sessions revoked',
        description: 'All other devices have been signed out',
      });
    } catch (error) {
      console.error('Failed to revoke sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke sessions',
        variant: 'destructive',
      });
    } finally {
      setRevokingAll(false);
    }
  };

  const otherSessions = sessions.filter(s => s.session_token !== currentToken);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Active Sessions</CardTitle>
            <CardDescription>
              Manage your active sessions across devices
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSessions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Current Session */}
            {sessions.filter(s => s.session_token === currentToken).map(session => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5"
              >
                <div className="text-primary">
                  {getDeviceIcon(session.device_info)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {session.device_info || 'Unknown Device'}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Active {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}

            {otherSessions.length > 0 && (
              <>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {otherSessions.length} other session{otherSessions.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={revokeAllOtherSessions}
                    disabled={revokingAll}
                  >
                    {revokingAll ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Sign out all others
                  </Button>
                </div>

                {/* Other Sessions */}
                <div className="space-y-2">
                  {otherSessions.map(session => (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="text-muted-foreground">
                        {getDeviceIcon(session.device_info)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">
                          {session.device_info || 'Unknown Device'}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          Last active {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                        disabled={revoking === session.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {revoking === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No active sessions found
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
