import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { Input } from '../components/ui/Input';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { adminService } from '../services/adminService';
import type { AdminRole, CreateStaffPayload } from '../types/admin';

const roleOptions: { value: AdminRole; label: string }[] = [
  { value: 'staff', label: 'Staff' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
];

/** Admin-only staff/trainer account creation — the only place a role above "staff" can be granted. */
export default function AdminStaffCreatePage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('staff');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: CreateStaffPayload = {
        full_name: fullName,
        email,
        phone: phone || null,
        password,
        role,
      };
      await adminService.createStaff(payload);
      navigate('/admin/users');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create this account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Add Staff
        </TextReveal>
        <Link to="/admin/users" className="text-sm font-medium text-primary hover:underline">
          Back to Staff Management
        </Link>
      </div>

      <GlassCard className="max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Input
            id="staff-full-name"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            id="staff-email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="staff-phone"
            label="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="staff-password"
            type="password"
            label="Temporary Password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="w-full">
            <label htmlFor="staff-role" className="mb-1.5 block text-sm font-medium text-foreground">
              Role
            </label>
            <select
              id="staff-role"
              className="flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex justify-end">
            <GradientButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </GradientButton>
          </div>
        </form>
      </GlassCard>
    </PageWrapper>
  );
}
