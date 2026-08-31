import { jsPDF } from 'jspdf';

export interface AttendancePdfRow {
  date: string;
  checkIn: string;
  checkOut: string | null;
}

interface AttendancePdfOptions {
  title: string;
  subtitle?: string;
  rows: AttendancePdfRow[];
  fileName: string;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

/**
 * Builds a simple attendance report PDF (title, subtitle, and a
 * date/check-in/check-out table) and triggers a browser download.
 * Client-side only — no backend involvement, works offline.
 */
export function downloadAttendancePdf({ title, subtitle, rows, fileName }: AttendancePdfOptions): void {
  const doc = new jsPDF();
  const marginX = 14;
  let y = 20;

  doc.setFontSize(16);
  doc.text(title, marginX, y);
  y += 8;

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, marginX, y);
    doc.setTextColor(0);
    y += 8;
  }

  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()}`, marginX, y);
  y += 10;

  const colX = { date: marginX, checkIn: marginX + 45, checkOut: marginX + 105 };
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', colX.date, y);
  doc.text('Check In', colX.checkIn, y);
  doc.text('Check Out', colX.checkOut, y);
  doc.setFont('helvetica', 'normal');
  y += 4;
  doc.line(marginX, y, 196, y);
  y += 6;

  if (rows.length === 0) {
    doc.setTextColor(120);
    doc.text('No attendance records.', marginX, y);
    doc.setTextColor(0);
  }

  for (const row of rows) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(row.date, colX.date, y);
    doc.text(formatDateTime(row.checkIn), colX.checkIn, y);
    doc.text(formatDateTime(row.checkOut), colX.checkOut, y);
    y += 7;
  }

  doc.save(fileName);
}
