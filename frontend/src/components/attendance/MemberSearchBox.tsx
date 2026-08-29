import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { attendanceService } from '../../services/attendanceService';
import type { MemberSearchResponse, MemberSearchResult } from '../../types/attendance';
import { Badge, type BadgeVariant } from '../ui/Badge';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';

interface MemberSearchBoxProps {
  /** Called after a successful check-in so the parent can refresh today's list. */
  onCheckedIn: () => void;
}

const SEARCH_DEBOUNCE_MS = 300;

const statusBadgeVariant: Record<MemberSearchResult['status'], BadgeVariant> = {
  active: 'success',
  pending: 'warning',
  suspended: 'destructive',
  inactive: 'outline',
};

/**
 * Front-desk widget: search members by name/phone, then check one in with
 * a single click. Member search hits `/api/v1/members` directly (the
 * Member Enrollment module's endpoint) since it isn't part of the
 * Attendance API this module owns.
 */
export function MemberSearchBox({ onCheckedIn }: MemberSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current !== undefined) {
      window.clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    debounceRef.current = window.setTimeout(() => {
      api
        .get<MemberSearchResponse>('/members', { params: { search: trimmed, limit: 8 } })
        .then(({ data }) => {
          setResults(data.items);
        })
        .catch(() => {
          setSearchError('Could not search members. Try again.');
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleCheckIn = useCallback(
    async (member: MemberSearchResult) => {
      setCheckingInId(member.id);
      setCheckInError(null);
      try {
        await attendanceService.checkIn({ member_id: member.id, method: 'manual' });
        setQuery('');
        setResults([]);
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
        label="Find a member"
        placeholder="Search by name or phone…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {checkInError && <p className="mt-2 text-sm text-destructive">{checkInError}</p>}

      {trimmedQuery && (
        <div className="mt-3 divide-y divide-border rounded-xl border border-border">
          {isSearching && <p className="p-4 text-sm text-muted-foreground">Searching…</p>}

          {!isSearching && searchError && (
            <p className="p-4 text-sm text-destructive">{searchError}</p>
          )}

          {!isSearching && !searchError && results.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No members found.</p>
          )}

          {!isSearching &&
            !searchError &&
            results.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{member.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.phone}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={statusBadgeVariant[member.status]}>{member.status}</Badge>
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
