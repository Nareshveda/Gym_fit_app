import { useState, type FormEvent } from 'react';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import { leadService } from '../../services/leadService';
import type { AxiosError } from 'axios';

const NOTE_MAX_WORDS = 500;

function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/** "Join the Crew" inquiry form. Owns its own submit + error/loading/success state. */
export function JoinCrewForm() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const noteWordCount = countWords(note);
  const noteTooLong = noteWordCount > NOTE_MAX_WORDS;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (noteTooLong) {
      setError(`Note must be ${NOTE_MAX_WORDS} words or fewer.`);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await leadService.create({
        full_name: fullName,
        phone_number: phoneNumber,
        whatsapp_number: whatsappNumber,
        preferred_time: preferredTime,
        note: note.trim() === '' ? null : note,
      });
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(
        axiosError.response?.data?.detail ??
          'Could not submit your inquiry. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-emerald-600">
          Thanks! We've got your details and will call you at your preferred time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Full name"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        label="Phone number"
        type="tel"
        autoComplete="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
      />
      <Input
        label="WhatsApp number"
        type="tel"
        autoComplete="tel"
        value={whatsappNumber}
        onChange={(e) => setWhatsappNumber(e.target.value)}
        required
      />
      <Input
        label="Preferred time to call/discuss"
        placeholder="e.g. Weekdays after 6pm"
        value={preferredTime}
        onChange={(e) => setPreferredTime(e.target.value)}
        required
      />
      <div className="w-full">
        <label htmlFor="join-crew-note" className="mb-1.5 block text-sm font-medium text-foreground">
          Note (optional)
        </label>
        <textarea
          id="join-crew-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Tell us what you're looking for..."
          className="flex w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className={`mt-1 text-xs ${noteTooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
          {noteWordCount}/{NOTE_MAX_WORDS} words
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <GradientButton type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? 'Submitting...' : 'Submit inquiry'}
      </GradientButton>
    </form>
  );
}
