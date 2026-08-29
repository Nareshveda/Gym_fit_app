import { useCallback, useEffect, useState } from 'react';
import { attendanceService } from '../../services/attendanceService';
import type { AttendanceRecord } from '../../types/attendance';
import { AnimatedList } from '../ui/AnimatedList';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TodayAttendanceListProps {
  /** Bump this (e.g. after a check-in) to trigger a refetch. */
  refreshSignal: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Front-desk view of everyone checked in today, with a one-click check-out. */
export function TodayAttendanceList({ refreshSignal }: TodayAttendanceListProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const items = await attendanceService.list(today);
      setRecords(items);
    } catch {
      setLoadError("Could not load today's attendance.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadToday();
  }, [loadToday, refreshSignal]);

  const handleCheckOut = useCallback(async (record: AttendanceRecord) => {
    setCheckingOutId(record.id);
    setActionError(null);
    try {
      const updated = await attendanceService.checkOut(record.id);
      setRecords((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setActionError(`Could not check out ${record.member_name}. Try again.`);
    } finally {
      setCheckingOutId(null);
    }
  }, []);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading today's attendance…</p>;
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground">No check-ins yet today.</p>;
  }

  const isCheckingOut = checkingOutId !== null;

  return (
    <div>
      {actionError && <p className="mb-3 text-sm text-destructive">{actionError}</p>}
      <AnimatedList className="divide-y divide-border rounded-xl border border-border">
        {records.map((record) => {
          const isCheckedOut = record.check_out_at !== null;
          return (
            <div key={record.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{record.member_name}</p>
                <p className="text-xs text-muted-foreground">
                  In: {formatTime(record.check_in_at)}
                  {isCheckedOut && record.check_out_at ? ` · Out: ${formatTime(record.check_out_at)}` : ''}
                </p>
              </div>
              {isCheckedOut ? (
                <Badge variant="outline">Checked out</Badge>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCheckingOut}
                  onClick={() => handleCheckOut(record)}
                >
                  {checkingOutId === record.id ? 'Checking out…' : 'Check Out'}
                </Button>
              )}
            </div>
          );
        })}
      </AnimatedList>
    </div>
  );
}
