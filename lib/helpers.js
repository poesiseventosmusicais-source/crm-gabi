export const CASE_TYPES = ['Divórcio', 'Inventário', 'Guarda/Pensão', 'União Estável', 'Outro'];
export const STATUS_LIST = ['Consulta Inicial', 'Em andamento', 'Aguardando Documentos', 'Aguardando Audiência', 'Acordo', 'Encerrado'];
export const PAYMENT_STATUS = ['Pendente', 'Parcial', 'Pago'];
export const ORIGINS = ['Indicação', 'Instagram', 'Google', 'OAB', 'Outro'];
export const PROCESS_SYSTEMS = ['EPROC', 'SAJ', 'Outro'];
export const PROCESS_DEADLINE_THEMES = ['Petição Inicial', 'Contestação', 'Manifestação', 'Recurso', 'Audiência', 'Notificação', 'Outro'];
export const CASE_DEADLINE_THEMES = ['Petição Inicial', 'Notificação', 'Outro'];
export const URGENCY = ['Urgente', 'Comum'];

export function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
}

export function daysUntil(d) {
  if (!d) return Infinity;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d + 'T12:00:00'); target.setHours(0,0,0,0);
  return Math.ceil((target - today) / 864e5);
}

export function daysSince(d) {
  if (!d) return Infinity;
  const today = new Date(); today.setHours(0,0,0,0);
  const x = d.includes('T') ? new Date(d) : new Date(d + 'T12:00:00');
  x.setHours(0,0,0,0);
  return Math.ceil((today - x) / 864e5);
}

export function todayISO() { return new Date().toISOString().split('T')[0]; }

export function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

export function statusColor(s) {
  const m = { 'Consulta Inicial':'purple', 'Em andamento':'blue', 'Aguardando Documentos':'yellow', 'Aguardando Audiência':'orange', 'Acordo':'green', 'Encerrado':'gray' };
  return m[s] || 'gray';
}

export function paymentColor(s) {
  const m = { 'Pendente':'red', 'Parcial':'yellow', 'Pago':'green' };
  return m[s] || 'gray';
}

export function urgencyColor(days) {
  if (days < 0) return 'red';
  if (days <= 3) return 'orange';
  if (days <= 7) return 'yellow';
  return 'green';
}

export function urgencyLabel(days) {
  if (days < 0) return `Vencido ${Math.abs(days)}d`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `${days}d`;
}

export function openWhatsApp(phone) {
  if (!phone) return;
  const clean = phone.replace(/\D/g, '');
  const num = clean.length <= 11 ? '55' + clean : clean;
  window.open(`https://wa.me/${num}`, '_blank');
}

export function getCalendarDays(view) {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(today);
  if (view === 'month') {
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());
  } else {
    start.setDate(today.getDate() - today.getDay());
  }
  const numDays = view === 'month' ? 35 : view === '2weeks' ? 14 : 7;
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}
