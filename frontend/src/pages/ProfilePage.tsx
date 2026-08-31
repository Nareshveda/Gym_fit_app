import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { Input } from '../components/ui/Input';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../lib/extractErrorMessage';

const AVATAR_ACCEPT = '.jpg,.jpeg,.png';

/** Profile page shared by both actor types (staff and self-service members) — picture upload plus name. */
export default function ProfilePage() {
  const { user, uploadAvatar, updateProfile } = useAuth();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);

  const backTo = user?.actor === 'member' ? '/portal' : '/dashboard';

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setAvatarError(extractErrorMessage(err, 'Could not upload this picture.'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError(null);
    setNameSaved(false);
    setIsSavingName(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
      setNameSaved(true);
    } catch (err) {
      setNameError(extractErrorMessage(err, 'Could not save your name.'));
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between gap-4">
        <TextReveal as="h1" className="text-2xl">
          My Profile
        </TextReveal>
        <Link to={backTo} className="text-sm font-medium text-primary hover:underline">
          Back
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <GlassCard className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
            {user?.avatar_url ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                alt="Your profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-10 w-10" />
            )}
          </div>
          <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
            <p className="text-lg font-bold text-amber-500">{user?.full_name ?? 'Welcome'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <label>
              <span className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-input px-4 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground">
                {isUploadingAvatar ? 'Uploading…' : 'Change Picture'}
              </span>
              <input
                type="file"
                accept={AVATAR_ACCEPT}
                className="hidden"
                disabled={isUploadingAvatar}
                onChange={(e) => void handleAvatarChange(e)}
              />
            </label>
            <p className="text-xs text-muted-foreground">JPG or PNG, up to 10 MB.</p>
            {avatarError && <p className="text-sm text-destructive">{avatarError}</p>}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Display Name</h2>
          <form onSubmit={(e) => void handleNameSubmit(e)} className="flex flex-col gap-4 sm:max-w-sm">
            <Input
              id="profile-full-name"
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setNameSaved(false);
              }}
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            {nameSaved && <p className="text-sm text-emerald-600">Saved.</p>}
            <div className="flex justify-end">
              <GradientButton type="submit" disabled={isSavingName}>
                {isSavingName ? 'Saving…' : 'Save Name'}
              </GradientButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
