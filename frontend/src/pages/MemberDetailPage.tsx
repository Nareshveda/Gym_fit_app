import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MemberCard } from '../components/members/MemberCard';
import { SetMemberPasswordDialog } from '../components/members/SetMemberPasswordDialog';
import { AnimatedList } from '../components/ui/AnimatedList';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { downloadAttendancePdf } from '../lib/attendancePdf';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { attendanceService } from '../services/attendanceService';
import { locationService } from '../services/locationService';
import { memberService } from '../services/memberService';
import type { Location } from '../types/location';
import type { Member } from '../types/member';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

const genderLabels: Record<Member['gender'], string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const enrollmentWarning = (location.state as { warning?: string } | null)?.warning ?? null;

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    locationService.list().then(setLocations).catch(() => setLocations([]));
  }, []);

  const loadMember = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await memberService.get(id);
      setMember(data);
    } catch (err) {
      setError(extractErrorMessage(err, GENERIC_ERROR));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await memberService.remove(id);
      navigate('/members');
    } catch (err) {
      setError(extractErrorMessage(err, GENERIC_ERROR));
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetPassword = async (password: string) => {
    if (!id) return;
    setPasswordError(null);
    setIsSettingPassword(true);
    try {
      await memberService.setCredentials(id, { password });
      setIsPasswordDialogOpen(false);
    } catch (err) {
      setPasswordError(extractErrorMessage(err, GENERIC_ERROR));
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleExportAttendancePdf = async () => {
    if (!id || !member) return;
    setIsExportingPdf(true);
    try {
      const records = await attendanceService.getMemberAttendance(Number(id));
      downloadAttendancePdf({
        title: `Attendance Report — ${member.full_name}`,
        subtitle: `Member code: ${member.member_code}`,
        rows: records.map((record) => ({
          date: record.date,
          checkIn: record.check_in_time,
          checkOut: record.check_out_time,
        })),
        fileName: `attendance-${member.member_code}.pdf`,
      });
    } catch (err) {
      setError(extractErrorMessage(err, GENERIC_ERROR));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between gap-4">
        <TextReveal as="h1" className="text-2xl">
          Member Details
        </TextReveal>
        <Link to="/members" className="text-sm font-medium text-primary hover:underline">
          Back to Members
        </Link>
      </div>

      {isLoading && (
        <GlassCard>
          <p className="text-muted-foreground">Loading member...</p>
        </GlassCard>
      )}

      {!isLoading && error && (
        <GlassCard className="border border-destructive/30">
          <p className="mb-3 text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadMember()}>
            Retry
          </Button>
        </GlassCard>
      )}

      {!isLoading && !error && !member && (
        <GlassCard>
          <p className="text-muted-foreground">Member not found.</p>
        </GlassCard>
      )}

      {!isLoading && !error && member && (
        <div className="flex flex-col gap-6">
          {enrollmentWarning && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
              {enrollmentWarning}
            </p>
          )}

          <MemberCard member={member} />

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
              Login Access
            </Button>
            <Button type="button" variant="outline" disabled={isExportingPdf} onClick={() => void handleExportAttendancePdf()}>
              {isExportingPdf ? 'Preparing PDF…' : 'Attendance Report (PDF)'}
            </Button>
            <Link
              to={`/members/${member.id}/vitals`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-background shadow-md transition-shadow hover:shadow-lg hover:shadow-primary/20"
            >
              Vitals &amp; Progress
            </Link>
            <Link
              to={`/members/${member.id}/edit`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input px-4 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Edit
            </Link>
            <Button type="button" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              Remove Member
            </Button>
          </div>

          <AnimatedList className="flex flex-col gap-6">
            {[
              <GlassCard key="personal">
                <h3 className="mb-4 text-lg font-semibold">Personal Information</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Member Code</dt>
                    <dd className="font-mono">{member.member_code}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Month/Year of Birth</dt>
                    <dd>{monthNames[member.birth_month - 1]} {member.birth_year}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Age</dt>
                    <dd>{member.age}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Gender</dt>
                    <dd>{genderLabels[member.gender]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">WhatsApp Number</dt>
                    <dd>{member.whatsapp_number || '—'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase text-muted-foreground">Address</dt>
                    <dd className="whitespace-pre-wrap">{member.address}</dd>
                  </div>
                </dl>
              </GlassCard>,
              <GlassCard key="emergency">
                <h3 className="mb-4 text-lg font-semibold">Emergency Contact</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Name</dt>
                    <dd>{member.emergency_contact_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Phone</dt>
                    <dd>{member.emergency_contact_phone}</dd>
                  </div>
                </dl>
              </GlassCard>,
              <GlassCard key="training">
                <h3 className="mb-4 text-lg font-semibold">Plan &amp; Training</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Plan</dt>
                    <dd>{member.current_plan_name ?? 'No plan assigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Goal</dt>
                    <dd>{member.goal || '—'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase text-muted-foreground">Medical History</dt>
                    <dd className="whitespace-pre-wrap">{member.medical_history || '—'}</dd>
                  </div>
                </dl>
              </GlassCard>,
              <GlassCard key="membership">
                <h3 className="mb-4 text-lg font-semibold">Membership</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Join Date</dt>
                    <dd>{formatDate(member.join_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Status</dt>
                    <dd className="capitalize">{member.status}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Branch / Location</dt>
                    <dd>
                      {locations.find((location) => location.id === member.location_id)?.name || 'Unassigned'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Referred By</dt>
                    <dd>{member.referred_by_name || '—'}</dd>
                  </div>
                </dl>
              </GlassCard>,
            ]}
          </AnimatedList>
        </div>
      )}

      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove Member">
        <p className="mb-4 text-sm text-muted-foreground">
          Are you sure you want to deactivate{' '}
          <span className="font-semibold text-foreground">{member?.full_name}</span>? This can be
          reversed later by an admin.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => void handleDelete()}>
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </Dialog>

      <SetMemberPasswordDialog
        open={isPasswordDialogOpen}
        memberEmail={member?.email ?? null}
        submitting={isSettingPassword}
        error={passwordError}
        onClose={() => setIsPasswordDialogOpen(false)}
        onSubmit={(password) => void handleSetPassword(password)}
      />
    </PageWrapper>
  );
}
