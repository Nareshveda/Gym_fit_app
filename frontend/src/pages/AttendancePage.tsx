import { useCallback, useState } from 'react';
import { MemberSearchBox } from '../components/attendance/MemberSearchBox';
import { TodayAttendanceList } from '../components/attendance/TodayAttendanceList';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';

export default function AttendancePage() {
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleCheckedIn = useCallback(() => {
    setRefreshSignal((count) => count + 1);
  }, []);

  return (
    <PageWrapper>
      <TextReveal as="h1" className="mb-6 text-2xl">
        Attendance
      </TextReveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Check In a Member</h2>
          <MemberSearchBox onCheckedIn={handleCheckedIn} />
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Today's Attendance</h2>
          <TodayAttendanceList refreshSignal={refreshSignal} />
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
