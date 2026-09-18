import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { TextReveal } from '../components/ui/TextReveal';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { leadService } from '../services/leadService';
import type { Lead } from '../types/lead';

/** Admin-only page: review "Join the Crew" inquiries submitted from the public site. */
export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLeads(await leadService.list());
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load inquiries.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Join the Crew Inquiries
        </TextReveal>
        <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
          Back to Admin
        </Link>
      </div>

      <GlassCard>
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        {isLoading ? (
          <p className="text-muted-foreground">Loading inquiries...</p>
        ) : leads.length === 0 ? (
          <p className="text-muted-foreground">No inquiries yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Preferred time</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium text-foreground">{lead.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.phone_number}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.whatsapp_number}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.preferred_time}</TableCell>
                  <TableCell className="max-w-xs whitespace-pre-wrap text-muted-foreground">
                    {lead.note ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </PageWrapper>
  );
}
