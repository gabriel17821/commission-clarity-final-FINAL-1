import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Check, Save, User, Hash, Calendar } from 'lucide-react';

export const InvoicePreviewDialog = ({ open, onOpenChange, onConfirm, loading, data }: any) => {
  const activeProducts = data.breakdown.filter((item: any) => item.amount > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-none shadow-2xl">
        <div className="bg-primary/5 px-6 py-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-primary">
              <Save className="h-5 w-5" /> Confirmar Factura
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-background">
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 pb-4 border-b border-dashed">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-black text-muted-foreground">NCF</span>
              <p className="font-mono text-base font-bold">{data.ncf}</p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] uppercase font-black text-muted-foreground">FECHA</span>
              <p className="text-base font-bold">{format(data.invoiceDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
            <div className="col-span-2 space-y-0.5">
              <span className="text-[10px] uppercase font-black text-muted-foreground">CLIENTE</span>
              <p className="text-base font-bold">{data.clientName || 'SIN CLIENTE ASIGNADO'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-muted-foreground border-b pb-1">
              <div className="col-span-6">DESCRIPCIÓN</div>
              <div className="col-span-2 text-center">%</div>
              <div className="col-span-4 text-right">COMISIÓN</div>
            </div>
            {activeProducts.map((item: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm font-bold">
                <div className="col-span-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
                <div className="col-span-2 text-center text-muted-foreground">{item.percentage}%</div>
                <div className="col-span-4 text-right text-success">${formatCurrency(item.commission)}</div>
              </div>
            ))}
            {data.restAmount > 0 && (
              <div className="grid grid-cols-12 gap-2 items-center text-sm font-bold bg-muted/30 p-2 rounded-lg">
                <div className="col-span-6">Resto de productos</div>
                <div className="col-span-2 text-center text-muted-foreground">{data.restPercentage}%</div>
                <div className="col-span-4 text-right text-success">${formatCurrency(data.restCommission)}</div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Total Factura</span>
              <span className="text-xl font-black">${formatNumber(data.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-6 border-t shrink-0">
          <div className="flex items-center justify-between mb-4 bg-success/10 p-4 rounded-xl border border-success/20">
            <span className="font-bold text-success text-xs uppercase">COMISIÓN TOTAL</span>
            <span className="text-3xl font-black text-success">${formatCurrency(data.totalCommission)}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
            <Button onClick={onConfirm} disabled={loading} className="flex-1 h-12 font-bold gradient-success shadow-md"><Check className="mr-2 h-4 w-4" /> {loading ? 'Guardando...' : 'Confirmar'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
