import { useCallback, useEffect, useMemo, useState } from 'react';
import { staffAttendanceService } from '../../services/staffAttendanceService';
import type { StaffListItem } from '../../types/staffAttendance';
import { Badge } from '../ui/Badge';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';

interface StaffSearchBoxProps {
  /** Called after a successful check-in so the parent can refresh today's list. */
  onCheckedIn: () => void;
}

/** Front-desk widget: search staff/trainers by name, then check one in. */
export function StaffSearchBox({ onCheckedIn }: StaffSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const items = await staffAttendanceService.listStaff();
      setStaff(items.filter((item) => item.is_active));
    } catch {
      setLoadError('Could not load the staff directory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return staff.filter((item) => item.full_name.toLowerCase().includes(trimmed)).slice(0, 8);
  }, [query, staff]);

  const handleCheckIn = useCallback(
    async (member: StaffListItem) => {
      setCheckingInId(member.id);
      setCheckInError(null);
      try {
        await staffAttendanceService.checkIn({ staff_id: member.id });
        setQuery('');
        onCheckedIn();
      } catch {
        setCheckInError(`Could not check in ${member.full_name}. Try again.`);
      } finally {
        setCheckingInId(null);
      }
    },
    [onCheckedIn],
  );

  const trimmedQuery = query.trim();
  const isCheckingIn = checkingInId !== null;

  return (
    <div className="w-full">
      <Input
        label="Find a staff member"
        placeholder="Search by name…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={isLoading}
      />

      {loadError && <p className="mt-2 text-sm text-destructive">{loadError}</p>}
      {checkInError && <p className="mt-2 text-sm text-destructive">{checkInError}</p>}

      {trimmedQuery && !loadError && (
        <div className="mt-3 divide-y divide-border rounded-xl border border-border">
          {results.length === 0 && <p className="p-4 text-sm text-muted-foreground">No staff found.</p>}

          {results.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{member.full_name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {member.role}
                </Badge>
                <GradientButton
                  type="button"
                  size="sm"
                  disabled={isCheckingIn}
                  onClick={() => handleCheckIn(member)}
                >
                  {checkingInId === member.id ? 'Checking in…' : 'Check In'}
                </GradientButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
