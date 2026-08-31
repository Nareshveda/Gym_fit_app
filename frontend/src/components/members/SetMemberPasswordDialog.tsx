import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';

interface SetMemberPasswordDialogProps {
  open: boolean;
  memberEmail: string | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

/** Staff-only dialog to grant or reset a member's self-service login password. */
export function SetMemberPasswordDialog({
  open,
  memberEmail,
  submitting,
  error,
  onClose,
  onSubmit,
}: SetMemberPasswordDialogProps) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(password);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Member Login Access">
      {!memberEmail ? (
        <p className="text-sm text-muted-foreground">
          This member has no email on file. Add one from the Edit page before granting login access.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sets a password the member can use to sign in at the same login page and see their own
            attendance and vitals. They&apos;ll sign in with <span className="font-medium text-foreground">{memberEmail}</span>.
          </p>
          <Input
            id="member-login-password"
            type="password"
            label="New Password"
            minLength={8}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <GradientButton type="submit" disabled={submitting || password.length < 8}>
              {submitting ? 'Saving…' : 'Set Password'}
            </GradientButton>
          </div>
        </form>
      )}
    </Dialog>
  );
}
