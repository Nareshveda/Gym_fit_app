import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from 'react';
import { FileText, Paperclip, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { Input } from '../components/ui/Input';
import { PageWrapper } from '../components/ui/PageWrapper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { TextReveal } from '../components/ui/TextReveal';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../lib/currency';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { equipmentService } from '../services/equipmentService';
import { locationService } from '../services/locationService';
import { EQUIPMENT_DOCUMENT_ACCEPT, type Equipment, type EquipmentCreatePayload } from '../types/equipment';
import type { Location } from '../types/location';

/** Absolute URL for a document path returned by the API (e.g. `/uploads/equipment/xxx.pdf`). */
function documentHref(documentUrl: string): string {
  return `${import.meta.env.VITE_API_URL}${documentUrl}`;
}

const ADMIN_PANEL_ROLES = new Set(['owner', 'admin']);

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

interface FormState {
  name: string;
  brand: string;
  purchase_date: string;
  amount: string;
  warranty_details: string;
  service_schedule: string;
  notes: string;
  location_ids: number[];
}

const emptyForm: FormState = {
  name: '',
  brand: '',
  purchase_date: '',
  amount: '',
  warranty_details: '',
  service_schedule: '',
  notes: '',
  location_ids: [],
};

/** Admin-only inventory page: equipment records and which location(s) they belong to. */
export default function InventoryPage() {
  const { user } = useAuth();
  const role = user ? (user.role as string) : undefined;
  const hasAdminAccess = role !== undefined && ADMIN_PANEL_ROLES.has(role);

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingDocumentFor, setUploadingDocumentFor] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!hasAdminAccess) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [equipmentData, locationData] = await Promise.all([
        equipmentService.list(),
        locationService.list(),
      ]);
      setEquipment(equipmentData);
      setLocations(locationData);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load inventory.'));
    } finally {
      setIsLoading(false);
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!hasAdminAccess) {
    return (
      <PageWrapper>
        <TextReveal as="h1" className="mb-6 text-2xl">
          Inventory
        </TextReveal>
        <GlassCard>
          <p className="text-muted-foreground">
            You do not have permission to view this page. Contact an owner or admin.
          </p>
        </GlassCard>
      </PageWrapper>
    );
  }

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setDocumentFile(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleDocumentChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDocumentFile(event.target.files?.[0] ?? null);
  };

  const handleUploadDocument = async (item: Equipment, file: File) => {
    setUploadingDocumentFor(item.id);
    try {
      const updated = await equipmentService.uploadDocument(item.id, file);
      setEquipment((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)));
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Could not upload this document.'));
    } finally {
      setUploadingDocumentFor(null);
    }
  };

  const toggleLocation = (locationId: number) => {
    setForm((prev) => ({
      ...prev,
      location_ids: prev.location_ids.includes(locationId)
        ? prev.location_ids.filter((id) => id !== locationId)
        : [...prev.location_ids, locationId],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload: EquipmentCreatePayload = {
        name: form.name,
        brand: form.brand || null,
        purchase_date: form.purchase_date || null,
        amount: form.amount ? Number(form.amount) : null,
        warranty_details: form.warranty_details || null,
        service_schedule: form.service_schedule || null,
        notes: form.notes || null,
        location_ids: form.location_ids,
      };
      let created = await equipmentService.create(payload);
      if (documentFile) {
        created = await equipmentService.uploadDocument(created.id, documentFile);
      }
      setEquipment((prev) => [...prev, created]);
      setFormOpen(false);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not save this equipment record.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Equipment) => {
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await equipmentService.remove(item.id);
      setEquipment((prev) => prev.filter((existing) => existing.id !== item.id));
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Could not delete this equipment record.'));
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Inventory
        </TextReveal>
        <GradientButton onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Add Equipment
        </GradientButton>
      </div>

      <GlassCard>
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        {isLoading ? (
          <p className="text-muted-foreground">Loading inventory...</p>
        ) : equipment.length === 0 ? (
          <p className="text-muted-foreground">No equipment recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead>Service Schedule</TableHead>
                  <TableHead>Location(s)</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.brand ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.purchase_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.amount ? formatINR(item.amount) : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.warranty_details ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.service_schedule ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.locations.length === 0
                        ? 'Unassigned'
                        : item.locations.map((location) => location.name).join(', ')}
                    </TableCell>
                    <TableCell>
                      {item.document_url ? (
                        <a
                          href={documentHref(item.document_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {item.document_filename ?? 'View'}
                        </a>
                      ) : (
                        <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                          <Paperclip className="h-4 w-4" />
                          {uploadingDocumentFor === item.id ? 'Uploading…' : 'Attach'}
                          <input
                            type="file"
                            accept={EQUIPMENT_DOCUMENT_ACCEPT}
                            className="hidden"
                            disabled={uploadingDocumentFor === item.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void handleUploadDocument(item, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="destructive" size="sm" onClick={() => void handleDelete(item)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Add Equipment">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="equipment-name"
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              id="equipment-brand"
              label="Brand"
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="equipment-purchase-date"
              type="date"
              label="Date of Purchase"
              value={form.purchase_date}
              onChange={(e) => setForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
            />
            <Input
              id="equipment-amount"
              type="number"
              min="0"
              step="0.01"
              label="Amount"
              leadingElement={<span className="font-semibold text-primary">₹</span>}
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <Input
            id="equipment-warranty"
            label="Warranty Details"
            value={form.warranty_details}
            onChange={(e) => setForm((prev) => ({ ...prev, warranty_details: e.target.value }))}
          />
          <Input
            id="equipment-service-schedule"
            label="Service Schedule"
            placeholder="e.g. Quarterly, every 6 months"
            value={form.service_schedule}
            onChange={(e) => setForm((prev) => ({ ...prev, service_schedule: e.target.value }))}
          />
          <Input
            id="equipment-notes"
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <div>
            <label htmlFor="equipment-document" className="mb-1.5 block text-sm font-medium text-foreground">
              Document (warranty card, invoice, receipt — optional)
            </label>
            <input
              id="equipment-document"
              type="file"
              accept={EQUIPMENT_DOCUMENT_ACCEPT}
              onChange={handleDocumentChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent-foreground hover:file:bg-accent/80"
            />
            <p className="mt-1 text-xs text-muted-foreground">JPG, PDF, or Word (.doc/.docx), up to 10 MB.</p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Location(s)</p>
            {locations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No locations yet — add one under Admin → Locations.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {locations.map((location) => (
                  <label key={location.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={form.location_ids.includes(location.id)}
                      onChange={() => toggleLocation(location.id)}
                    />
                    {location.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <GradientButton type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add Equipment'}
            </GradientButton>
          </div>
        </form>
      </Dialog>
    </PageWrapper>
  );
}
