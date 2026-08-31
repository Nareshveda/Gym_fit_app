import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Member } from '../../types/member';
import { MemberForm } from './MemberForm';

vi.mock('../../services/feeService', () => ({
  feeService: { listPlans: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../services/locationService', () => ({
  locationService: { list: vi.fn().mockResolvedValue([]) },
}));

// A member with every nullable contact field actually null — this shape is
// exactly what the API legitimately returns (address/email/emergency
// contact are all Optional server-side). Editing a member like this used to
// throw inside `validate()`'s unconditional `.trim()` calls and silently
// drop the Save Changes click.
const memberWithNullContactFields: Partial<Member> = {
  id: '1',
  member_code: 'GT-0001',
  full_name: 'Priya Sharma',
  email: null,
  phone: '9876543210',
  whatsapp_number: null,
  birth_month: 3,
  birth_year: 1998,
  gender: 'female',
  address: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  training_category: 'group_training',
  medical_history: null,
  goal: null,
  location_id: null,
  referred_by_name: null,
  referred_by_member_id: null,
  join_date: '2026-01-01',
  status: 'active',
};

describe('MemberForm', () => {
  it('renders in edit mode without crashing when contact fields are null', () => {
    render(
      <MemberForm mode="edit" initialValues={memberWithNullContactFields} onSubmit={vi.fn()} />,
    );
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Priya Sharma');
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('');
  });

  it('submits successfully when Save Changes is clicked on a member with null contact fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <MemberForm mode="edit" initialValues={memberWithNullContactFields} onSubmit={onSubmit} />,
    );

    // Fill in the required-but-currently-null fields, matching what a staff
    // member would actually do when completing a previously incomplete record.
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'priya@example.com' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/emergency contact name/i), {
      target: { value: 'Raj Sharma' },
    });
    fireEvent.change(screen.getByLabelText(/emergency contact phone/i), {
      target: { value: '9876500000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ email: 'priya@example.com' });
  });
});
