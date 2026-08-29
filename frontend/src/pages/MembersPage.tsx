import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MemberTable } from '../components/members/MemberTable';
import { Dialog } from '../components/ui/Dialog';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/cn';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { memberService } from '../services/memberService';
import type { Member, MemberStatus } from '../types/member';

const statusFilterOptions: { value: MemberStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
];

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all');
  const [memberPendingDelete, setMemberPendingDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await memberService.list({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setMembers(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadMembers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadMembers]);

  const handleDeleteConfirm = async () => {
    if (!memberPendingDelete) return;
    setIsDeleting(true);
    try {
      await memberService.remove(memberPendingDelete.id);
      setMemberPendingDelete(null);
      await loadMembers();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Defensive client-side filter in case the backend doesn't yet honor
  // the `search`/`status` query params.
  const visibleMembers = members.filter((member) => {
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      member.full_name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <TextReveal as="h1" className="text-2xl">
          Members
        </TextReveal>
        <Link
          to="/members/new"
          className={cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg hover:shadow-primary/20',
          )}
        >
          Enroll Member
        </Link>
      </div>

      <GlassCard className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            id="member-search"
            label="Search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <label htmlFor="status-filter" className="mb-1.5 block text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id="status-filter"
            className="flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'all')}
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {error && (
        <GlassCard className="mb-6 border border-destructive/30">
          <p className="mb-3 text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadMembers()}>
            Retry
          </Button>
        </GlassCard>
      )}

      {isLoading ? (
        <GlassCard>
          <p className="text-muted-foreground">Loading members...</p>
        </GlassCard>
      ) : visibleMembers.length === 0 && !error ? (
        <GlassCard>
          <p className="text-muted-foreground">
            No members found. Try adjusting your search or filters, or enroll a new member.
          </p>
        </GlassCard>
      ) : (
        !error && <MemberTable members={visibleMembers} onDelete={setMemberPendingDelete} />
      )}

      <Dialog
        open={memberPendingDelete !== null}
        onClose={() => setMemberPendingDelete(null)}
        title="Remove Member"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Are you sure you want to deactivate{' '}
          <span className="font-semibold text-foreground">{memberPendingDelete?.full_name}</span>? This
          can be reversed later by an admin.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setMemberPendingDelete(null)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => void handleDeleteConfirm()}>
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </Dialog>
    </PageWrapper>
  );
}
