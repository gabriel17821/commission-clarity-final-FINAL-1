/**
 * Formatea un número con separadores de miles y dos decimales
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(value);
};

/**
 * Formatea un número con separadores de miles (sin decimales obligatorios)
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Formatea el input del usuario con comas mientras escribe
 */
export const formatInputNumber = (value: string): string => {
  const cleanValue = value.replace(/[^0-9.]/g, '');
  if (!cleanValue) return '';
  
  const parts = cleanValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
};

/**
 * Convierte un string formateado (con comas) a un número real
 */
export const parseFormattedNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value.replace(/,/g, '')) || 0;
};

export const parseDateSafe = (dateString: string): Date => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  const date = new Date(dateString);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
};
