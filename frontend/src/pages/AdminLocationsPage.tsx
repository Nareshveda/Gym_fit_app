import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { Input } from '../components/ui/Input';
import { PageWrapper } from '../components/ui/PageWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { TextReveal } from '../components/ui/TextReveal';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { locationService } from '../services/locationService';
import type { Location } from '../types/location';

/** Admin-only page: add/deactivate/delete gym branches/locations. */
export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLocations(await locationService.list());
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load locations.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const created = await locationService.create({
        name,
        address: address || null,
        phone: phone || null,
      });
      setLocations((prev) => [...prev, created]);
      setName('');
      setAddress('');
      setPhone('');
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not add this location.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (location: Location) => {
    const confirmed = window.confirm(
      `Delete "${location.name}"? Members/staff assigned to it will be unassigned, not deleted.`,
    );
    if (!confirmed) return;
    try {
      await locationService.remove(location.id);
      setLocations((prev) => prev.filter((item) => item.id !== location.id));
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Could not delete this location.'));
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      const updated = await locationService.update(location.id, { is_active: !location.is_active });
      setLocations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Could not update this location.'));
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Locations / Branches
        </TextReveal>
        <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
          Back to Admin
        </Link>
      </div>

      <GlassCard className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">Add a Location</h2>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
          {formError && <p className="sm:col-span-3 text-sm text-destructive">{formError}</p>}
          <Input id="location-name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="location-address" label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input id="location-phone" label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="sm:col-span-3 flex justify-end">
            <GradientButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Location'}
            </GradientButton>
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        {isLoading ? (
          <p className="text-muted-foreground">Loading locations...</p>
        ) : locations.length === 0 ? (
          <p className="text-muted-foreground">No locations yet. Add your first branch above.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium text-foreground">{location.name}</TableCell>
                  <TableCell className="text-muted-foreground">{location.address ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{location.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={location.is_active ? 'success' : 'outline'}>
                      {location.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleToggleActive(location)}>
                        {location.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => void handleDelete(location)}>
                        Delete
                      </Button>
                    </div>
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
