import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BackLinkProps {
  to: string;
  label: string;
}

/** Small "‹ Back to X" navigation link, shown above a page's heading. */
export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
