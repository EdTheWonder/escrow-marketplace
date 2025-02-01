export function getStatusDisplay(status: string) {
  switch (status) {
    case 'available':
      return { text: 'Available', color: 'var(--success)' };
    case 'in_escrow':
      return { text: 'In Escrow', color: 'var(--warning)' };
    case 'pending_feedback':
      return { text: 'Pending Feedback', color: 'var(--warning)' };
    case 'sold':
      return { text: 'Trade Completed', color: 'var(--muted)' };
    default:
      return { text: status, color: 'var(--muted)' };
  }
}
