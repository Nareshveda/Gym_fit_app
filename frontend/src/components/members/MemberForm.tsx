import { type FormEvent, useState } from 'react';
import { Button } from '../ui/Button';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import { cn } from '../../lib/cn';
import type {
  MemberCreatePayload,
  MemberGender,
  MemberStatus,
} from '../../types/member';

export type MemberFormValues = MemberCreatePayload;

interface MemberFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<MemberFormValues>;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel?: () => void;
  submitError?: string | null;
}

const emptyValues: MemberFormValues = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: 'prefer_not_to_say',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  photo_url: '',
  join_date: new Date().toISOString().slice(0, 10),
  status: 'active',
};

const genderOptions: { value: MemberGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const statusOptions: { value: MemberStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
];

const selectClasses = cn(
  'flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
);

const textareaClasses = cn(
  'flex w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
);

type FormErrors = Partial<Record<keyof MemberFormValues, string>>;

function validate(values: MemberFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.full_name.trim()) errors.full_name = 'Full name is required.';
  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.phone.trim()) errors.phone = 'Phone is required.';
  if (!values.date_of_birth) errors.date_of_birth = 'Date of birth is required.';
  if (!values.address.trim()) errors.address = 'Address is required.';
  if (!values.emergency_contact_name.trim()) {
    errors.emergency_contact_name = 'Emergency contact name is required.';
  }
  if (!values.emergency_contact_phone.trim()) {
    errors.emergency_contact_phone = 'Emergency contact phone is required.';
  }
  if (!values.join_date) errors.join_date = 'Join date is required.';
  return errors;
}

/** Shared create/edit form for member enrollment records. */
export function MemberForm({ mode, initialValues, onSubmit, onCancel, submitError }: MemberFormProps) {
  const [values, setValues] = useState<MemberFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof MemberFormValues>(field: K, value: MemberFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...values,
        photo_url: values.photo_url ? values.photo_url.trim() : null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {submitError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="full_name"
          label="Full Name"
          value={values.full_name}
          onChange={(e) => setField('full_name', e.target.value)}
          error={errors.full_name}
          required
        />
        <Input
          id="email"
          type="email"
          label="Email"
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          error={errors.email}
          required
        />
        <Input
          id="phone"
          label="Phone"
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
          error={errors.phone}
          required
        />
        <Input
          id="date_of_birth"
          type="date"
          label="Date of Birth"
          value={values.date_of_birth}
          onChange={(e) => setField('date_of_birth', e.target.value)}
          error={errors.date_of_birth}
          required
        />
        <div className="w-full">
          <label htmlFor="gender" className="mb-1.5 block text-sm font-medium text-foreground">
            Gender
          </label>
          <select
            id="gender"
            className={selectClasses}
            value={values.gender}
            onChange={(e) => setField('gender', e.target.value as MemberGender)}
          >
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="join_date"
          type="date"
          label="Join Date"
          value={values.join_date}
          onChange={(e) => setField('join_date', e.target.value)}
          error={errors.join_date}
          required
        />
      </div>

      <div className="w-full">
        <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-foreground">
          Address
        </label>
        <textarea
          id="address"
          rows={3}
          className={textareaClasses}
          value={values.address}
          onChange={(e) => setField('address', e.target.value)}
        />
        {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="emergency_contact_name"
          label="Emergency Contact Name"
          value={values.emergency_contact_name}
          onChange={(e) => setField('emergency_contact_name', e.target.value)}
          error={errors.emergency_contact_name}
          required
        />
        <Input
          id="emergency_contact_phone"
          label="Emergency Contact Phone"
          value={values.emergency_contact_phone}
          onChange={(e) => setField('emergency_contact_phone', e.target.value)}
          error={errors.emergency_contact_phone}
          required
        />
        <Input
          id="photo_url"
          label="Photo URL"
          placeholder="https://..."
          value={values.photo_url ?? ''}
          onChange={(e) => setField('photo_url', e.target.value)}
        />
        {mode === 'edit' && (
          <div className="w-full">
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-foreground">
              Status
            </label>
            <select
              id="status"
              className={selectClasses}
              value={values.status}
              onChange={(e) => setField('status', e.target.value as MemberStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <GradientButton type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Enroll Member'
              : 'Save Changes'}
        </GradientButton>
      </div>
    </form>
  );
}
