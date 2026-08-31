import { useCallback, useState } from 'react';
import { MemberSearchBox } from '../components/attendance/MemberSearchBox';
import { StaffSearchBox } from '../components/attendance/StaffSearchBox';
import { TodayAttendanceList } from '../components/attendance/TodayAttendanceList';
import { TodayStaffAttendanceList } from '../components/attendance/TodayStaffAttendanceList';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { cn } from '../lib/cn';

type AttendanceTab = 'members' | 'staff';

export default function AttendancePage() {
  const [tab, setTab] = useState<AttendanceTab>('members');
  const [memberRefreshSignal, setMemberRefreshSignal] = useState(0);
  const [staffRefreshSignal, setStaffRefreshSignal] = useState(0);

  const handleMemberCheckedIn = useCallback(() => {
    setMemberRefreshSignal((count) => count + 1);
  }, []);

  const handleStaffCheckedIn = useCallback(() => {
    setStaffRefreshSignal((count) => count + 1);
  }, []);

  return (
    <PageWrapper>
      <TextReveal as="h1" className="mb-6 text-2xl">
        Attendance
      </TextReveal>

      <div className="mb-6 inline-flex rounded-xl border border-border p-1">
        {(
          [
            { value: 'members', label: 'Members' },
            { value: 'staff', label: 'Staff & Trainers' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTab(option.value)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              tab === option.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === 'members' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Check In a Member</h2>
            <MemberSearchBox onCheckedIn={handleMemberCheckedIn} />
          </GlassCard>

          <GlassCard>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Today's Attendance</h2>
            <TodayAttendanceList refreshSignal={memberRefreshSignal} />
          </GlassCard>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Check In Staff / Trainer</h2>
            <StaffSearchBox onCheckedIn={handleStaffCheckedIn} />
          </GlassCard>

          <GlassCard>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Today's Staff Attendance</h2>
            <TodayStaffAttendanceList refreshSignal={staffRefreshSignal} />
          </GlassCard>
        </div>
      )}
    </PageWrapper>
  );
}
