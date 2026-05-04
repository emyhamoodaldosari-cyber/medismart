export function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function buildWhatsAppLink(contact?: string) {
  if (!contact) return '#';
  const sanitized = contact.replace(/[^0-9]/g, '');
  return `https://wa.me/${sanitized}`;
}

export function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
