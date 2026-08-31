import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import { cn } from '../../lib/cn';
import { feeService } from '../../services/feeService';
import { locationService } from '../../services/locationService';
import type { MembershipPlan } from '../../types/fee';
import type { Location } from '../../types/location';
import type {
  Member,
  MemberCreatePayload,
  MemberGender,
  MemberStatus,
  TrainingCategory,
} from '../../types/member';

/**
 * Form state = the member create/update payload, plus a few fields that
 * only exist during enrollment (create mode): an initial height/weight
 * reading and a membership plan to subscribe to. `MemberEnrollPage` strips
 * these out before calling `memberService.create` and issues the follow-up
 * vitals/subscription calls itself — they aren't part of the members table.
 */
export interface MemberFormValues extends MemberCreatePayload {
  initial_height_cm?: string;
  initial_weight_kg?: string;
  membership_plan_id?: string;
}

interface MemberFormProps {
  mode: 'create' | 'edit';
  /**
   * A `Member` fetched from the API (edit mode) — several of its fields are
   * nullable at the API/DB level (e.g. a member enrolled before a field was
   * required, or one whose contact details are simply unknown), so this is
   * intentionally `Partial<Member>` rather than `Partial<MemberFormValues>`;
   * the null-coalescing in the initial state below is what makes it safe to
   * feed into a form that treats these as required strings.
   */
  initialValues?: Partial<Member>;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel?: () => void;
  submitError?: string | null;
}

const emptyValues: MemberFormValues = {
  full_name: '',
  email: '',
  phone: '',
  whatsapp_number: '',
  birth_month: 0,
  birth_year: 0,
  gender: 'prefer_not_to_say',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  training_category: 'group_training',
  medical_history: '',
  goal: '',
  location_id: null,
  referred_by_name: '',
  join_date: new Date().toISOString().slice(0, 10),
  status: 'active',
  initial_height_cm: '',
  initial_weight_kg: '',
  membership_plan_id: '',
};

const genderOptions: { value: MemberGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const trainingCategoryOptions: { value: TrainingCategory; label: string }[] = [
  { value: 'personal_training', label: 'Personal Training' },
  { value: 'group_training', label: 'Group Training' },
];

const statusOptions: { value: MemberStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
];

const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((label, index) => ({ value: index + 1, label }));

const CURRENT_YEAR = new Date().getFullYear();

const selectClasses = cn(
  'flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
);

const textareaClasses = cn(
  'flex w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
);

// Mirrors backend/app/schemas/member.py's _PHONE_PATTERN / _NAME_PATTERN —
// same rules enforced client-side for instant feedback, server-side as the
// source of truth. This is the direct fix for a real bug found in testing:
// the old form let phone numbers with 16+ characters through unchecked.
const PHONE_PATTERN = /^\+?[0-9][0-9 -]{5,20}[0-9]$/;
const NAME_PATTERN = /^[A-Za-z][A-Za-z.' -]{0,149}$/;

function isValidPhone(value: string): boolean {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15 && PHONE_PATTERN.test(value);
}

function isValidName(value: string): boolean {
  return NAME_PATTERN.test(value);
}

type FormErrors = Partial<Record<keyof MemberFormValues, string>>;

function validate(values: MemberFormValues, requirePlanSelection: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!values.full_name.trim()) {
    errors.full_name = 'Full name is required.';
  } else if (!isValidName(values.full_name.trim())) {
    errors.full_name = 'Letters, spaces, hyphens, apostrophes, and periods only.';
  }
  // email/address/emergency contact are optional at the API level (see
  // backend/app/schemas/member.py's MemberBase — all default to None), so
  // these only validate *format* when a value is actually provided. Requiring
  // them unconditionally used to block saving any edit to a member enrolled
  // without one of these fields on file, with no visible top-level error.
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.phone.trim()) {
    errors.phone = 'Phone is required.';
  } else if (!isValidPhone(values.phone.trim())) {
    errors.phone = '7-15 digits, optionally with +, spaces, or hyphens.';
  }
  if (values.whatsapp_number?.trim() && !isValidPhone(values.whatsapp_number.trim())) {
    errors.whatsapp_number = '7-15 digits, optionally with +, spaces, or hyphens.';
  }
  if (!values.birth_month) errors.birth_month = 'Month of birth is required.';
  if (!values.birth_year || values.birth_year < 1900 || values.birth_year > CURRENT_YEAR) {
    errors.birth_year = `Enter a year between 1900 and ${CURRENT_YEAR}.`;
  }
  if (values.emergency_contact_name.trim() && !isValidName(values.emergency_contact_name.trim())) {
    errors.emergency_contact_name = 'Letters, spaces, hyphens, apostrophes, and periods only.';
  }
  if (
    values.emergency_contact_phone.trim() &&
    !isValidPhone(values.emergency_contact_phone.trim())
  ) {
    errors.emergency_contact_phone = '7-15 digits, optionally with +, spaces, or hyphens.';
  }
  if (values.referred_by_name?.trim() && !isValidName(values.referred_by_name.trim())) {
    errors.referred_by_name = 'Letters, spaces, hyphens, apostrophes, and periods only.';
  }
  if (!values.join_date) errors.join_date = 'Join date is required.';
  if (requirePlanSelection && !values.membership_plan_id) {
    errors.membership_plan_id = 'Select a membership plan.';
  }
  return errors;
}

/** Shared create/edit form for member enrollment records. */
export function MemberForm({ mode, initialValues, onSubmit, onCancel, submitError }: MemberFormProps) {
  const [values, setValues] = useState<MemberFormValues>({
    ...emptyValues,
    ...initialValues,
    // These are nullable on `Member` (the API may legitimately return null
    // for a member with no address/emergency contact/email on file), but
    // required strings in form state — coalesce here, once, so the rest of
    // the form (and `validate`'s unconditional `.trim()` calls) never has
    // to null-check them. Editing a member with a null value in any of
    // these used to throw inside `validate()` and silently abort the save.
    email: initialValues?.email ?? emptyValues.email,
    address: initialValues?.address ?? emptyValues.address,
    emergency_contact_name: initialValues?.emergency_contact_name ?? emptyValues.emergency_contact_name,
    emergency_contact_phone: initialValues?.emergency_contact_phone ?? emptyValues.emergency_contact_phone,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (mode !== 'create') return;
    feeService
      .listPlans()
      .then((allPlans) => setPlans(allPlans.filter((plan) => plan.is_active)))
      .catch(() => setPlans([]));
  }, [mode]);

  useEffect(() => {
    locationService
      .list()
      .then((allLocations) => setLocations(allLocations.filter((location) => location.is_active)))
      .catch(() => setLocations([]));
  }, []);

  const setField = <K extends keyof MemberFormValues>(field: K, value: MemberFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, mode === 'create' && plans.length > 0);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {submitError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      )}
      {!submitError && hasFieldErrors && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Please fix the highlighted field{Object.keys(errors).length > 1 ? 's' : ''} below before saving.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="full_name"
          label="Full Name"
          value={values.full_name}
          onChange={(e) => setField('full_name', e.target.value)}
          error={errors.full_name}
          maxLength={150}
          required
        />
        <Input
          id="email"
          type="email"
          label="Email"
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          error={errors.email}
        />
        <Input
          id="phone"
          label="Mobile Number"
          inputMode="tel"
          maxLength={20}
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
          error={errors.phone}
          required
        />
        <Input
          id="whatsapp_number"
          label="WhatsApp Number"
          inputMode="tel"
          maxLength={20}
          value={values.whatsapp_number ?? ''}
          onChange={(e) => setField('whatsapp_number', e.target.value)}
          error={errors.whatsapp_number}
        />
        <div className="w-full">
          <label htmlFor="birth_month" className="mb-1.5 block text-sm font-medium text-foreground">
            Month of Birth
          </label>
          <select
            id="birth_month"
            className={selectClasses}
            value={values.birth_month || ''}
            onChange={(e) => setField('birth_month', Number(e.target.value))}
          >
            <option value="" disabled>
              Select month
            </option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.birth_month && <p className="mt-1 text-sm text-destructive">{errors.birth_month}</p>}
        </div>
        <Input
          id="birth_year"
          type="number"
          label="Year of Birth"
          min={1900}
          max={CURRENT_YEAR}
          value={values.birth_year || ''}
          onChange={(e) => setField('birth_year', Number(e.target.value))}
          error={errors.birth_year}
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
        {mode === 'create' && (
          <div className="w-full">
            <label htmlFor="training_category" className="mb-1.5 block text-sm font-medium text-foreground">
              Member Code Type
            </label>
            <select
              id="training_category"
              className={selectClasses}
              value={values.training_category}
              onChange={(e) => setField('training_category', e.target.value as TrainingCategory)}
            >
              {trainingCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Sets the member&apos;s permanent PT-/GT- code prefix — not the member&apos;s Plan (select that below).
            </p>
          </div>
        )}
        <div className="w-full">
          <label htmlFor="location_id" className="mb-1.5 block text-sm font-medium text-foreground">
            Branch / Location
          </label>
          <select
            id="location_id"
            className={selectClasses}
            value={values.location_id ?? ''}
            onChange={(e) => setField('location_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Unassigned</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
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
          maxLength={150}
          value={values.emergency_contact_name}
          onChange={(e) => setField('emergency_contact_name', e.target.value)}
          error={errors.emergency_contact_name}
        />
        <Input
          id="emergency_contact_phone"
          label="Emergency Contact Phone"
          inputMode="tel"
          maxLength={20}
          value={values.emergency_contact_phone}
          onChange={(e) => setField('emergency_contact_phone', e.target.value)}
          error={errors.emergency_contact_phone}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="goal"
          label="Goal"
          placeholder="e.g. Weight loss, muscle gain, endurance"
          maxLength={255}
          value={values.goal ?? ''}
          onChange={(e) => setField('goal', e.target.value)}
        />
        <Input
          id="referred_by_name"
          label="Referred By (optional)"
          placeholder="Name of the person who referred this member"
          maxLength={150}
          value={values.referred_by_name ?? ''}
          onChange={(e) => setField('referred_by_name', e.target.value)}
          error={errors.referred_by_name}
        />
      </div>

      <div className="w-full">
        <label htmlFor="medical_history" className="mb-1.5 block text-sm font-medium text-foreground">
          Medical History
        </label>
        <textarea
          id="medical_history"
          rows={3}
          maxLength={2000}
          placeholder="Conditions, injuries, or anything a trainer should know about"
          className={textareaClasses}
          value={values.medical_history ?? ''}
          onChange={(e) => setField('medical_history', e.target.value)}
        />
      </div>

      {mode === 'create' && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Enrollment Vitals &amp; Membership</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="initial_height_cm"
              type="number"
              step="0.1"
              min="0"
              label="Height (cm)"
              value={values.initial_height_cm ?? ''}
              onChange={(e) => setField('initial_height_cm', e.target.value)}
            />
            <Input
              id="initial_weight_kg"
              type="number"
              step="0.1"
              min="0"
              label="Weight (kg)"
              value={values.initial_weight_kg ?? ''}
              onChange={(e) => setField('initial_weight_kg', e.target.value)}
            />
            <div className="w-full">
              <label htmlFor="membership_plan_id" className="mb-1.5 block text-sm font-medium text-foreground">
                Membership Plan
              </label>
              <select
                id="membership_plan_id"
                className={selectClasses}
                value={values.membership_plan_id ?? ''}
                onChange={(e) => setField('membership_plan_id', e.target.value)}
                disabled={plans.length === 0}
                required={plans.length > 0}
              >
                <option value="" disabled>
                  {plans.length === 0 ? 'No plans available yet' : 'Select a plan'}
                </option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.duration_type})
                  </option>
                ))}
              </select>
              {errors.membership_plan_id && (
                <p className="mt-1 text-sm text-destructive">{errors.membership_plan_id}</p>
              )}
            </div>
          </div>
        </div>
      )}

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
