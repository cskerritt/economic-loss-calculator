import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at != null;

  // Don't show if no user, already verified, or dismissed
  if (!user || isEmailVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user.email) return;

    setIsResending(true);
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setIsResending(false);

    if (error) {
      toast({
        title: 'Failed to resend',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox and click the verification link.',
      });
    }
  };

  return (
    <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
      <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-yellow-700 dark:text-yellow-300">
          Your email ({user.email}) is not verified.
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResendVerification}
            disabled={isResending}
            className="h-7 text-xs border-yellow-500/50 hover:bg-yellow-500/20"
          >
            {isResending ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Mail className="w-3 h-3 mr-1" />
            )}
            Resend Verification
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function EmailVerificationStatus() {
  const { user } = useAuth();

  if (!user) return null;

  const isEmailVerified = user.email_confirmed_at != null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isEmailVerified ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Email verified</span>
        </>
      ) : (
        <>
          <Mail className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-600 dark:text-yellow-400">Email not verified</span>
        </>
      )}
    </div>
  );
}
