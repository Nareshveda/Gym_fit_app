import { useEffect, useState } from 'react';

const formatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

/** Small, always-visible IST clock pinned to the bottom-left corner of every page. */
export function IstClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-2 left-2 z-50 select-none rounded-md bg-background/70 px-2 py-1 text-[11px] leading-none text-muted-foreground backdrop-blur">
      {formatter.format(now)} IST
    </div>
  );
}
