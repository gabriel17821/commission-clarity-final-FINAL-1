import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Check, Save, User, Hash, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  data: {
    ncf: string;
    invoiceDate: Date;
    clientName: string | null;
    totalAmount: number;
    breakdown: any[];
    restAmount: number;
    restPercentage: number;
    restCommission: number;
    totalCommission: number;
  };
}

export const InvoicePreviewDialog = ({ open, onOpenChange, onConfirm, loading, data }: InvoicePreviewDialogProps) => {
  const activeProducts = data.breakdown.filter(item => item.amount > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-none shadow-2xl">
        {/* Header Fijo */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b border-border shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
              <Save className="h-6 w-6" />
              {loading ? 'Guardando Factura...' : 'Confirmar Factura'}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Área de Contenido con Scroll Independiente */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-background">
          {/* Info Principal */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 pb-6 border-b border-dashed">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-black flex items-center gap-1">
                <Hash className="h-3 w-3" /> NCF
              </span>
              <p className="font-mono text-lg font-bold text-foreground">{data.ncf}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-black flex items-center justify-end gap-1">
                <Calendar className="h-3 w-3" /> FECHA
              </span>
              <p className="text-lg font-bold text-foreground">
                {format(data.invoiceDate, "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div className="col-span-2 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-black flex items-center gap-1">
                <User className="h-3 w-3" /> CLIENTE
              </span>
              <p className="text-lg font-bold text-foreground">
                {data.clientName || 'SIN CLIENTE ASIGNADO'}
              </p>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-black text-muted-foreground border-b-2 pb-2">
              <div className="col-span-6">Descripción</div>
              <div className="col-span-2 text-center">%</div>
              <div className="col-span-4 text-right">Comisión</div>
            </div>

            <div className="space-y-3">
              {activeProducts.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center py-1">
                  <div className="col-span-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-sm text-foreground">{item.name}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-black">{item.percentage}%</span>
                  </div>
                  <div className="col-span-4 text-right font-bold text-success">
                    ${formatCurrency(item.commission)}
                  </div>
                </div>
              ))}

              {data.restAmount > 0 && (
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-4 bg-muted/40 rounded-xl border border-dashed border-border">
                  <div className="col-span-6 font-bold text-sm">Resto de productos</div>
                  <div className="col-span-2 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/20 text-primary text-[10px] font-black">{data.restPercentage}%</span>
                  </div>
                  <div className="col-span-4 text-right font-bold text-success">
                    ${formatCurrency(data.restCommission)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Totales */}
          <div className="pt-6 border-t-2 border-border space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Factura</span>
              <span className="text-2xl font-black text-foreground">${formatNumber(data.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Fijo (Sticky) - NUNCA SE OCULTA */}
        <div className="bg-muted/50 p-6 border-t border-border shrink-0">
          <div className="flex items-center justify-between mb-6 bg-success/10 p-5 rounded-2xl border-2 border-success/20">
            <span className="font-black text-success-foreground uppercase tracking-tighter text-sm">TU COMISIÓN TOTAL</span>
            <span className="text-4xl font-black text-success tracking-tighter">${formatCurrency(data.totalCommission)}</span>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-14 text-base font-bold border-2 border-border hover:bg-background"
            >
              <ArrowLeft className="mr-2 h-5 w-5" /> Volver
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-14 text-base font-bold gradient-success shadow-lg"
            >
              <Check className="mr-2 h-5 w-5" />
              {loading ? 'Guardando...' : 'Confirmar y Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
