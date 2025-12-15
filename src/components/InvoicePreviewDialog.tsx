import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, User, Calendar, Hash, Package, DollarSign, TrendingUp, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface Breakdown {
  name: string;
  label: string;
  amount: number;
  percentage: number;
  commission: number;
  color: string;
}

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
    breakdown: Breakdown[];
    restAmount: number;
    restPercentage: number;
    restCommission: number;
    totalCommission: number;
  };
}

export const InvoicePreviewDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
  data,
}: InvoicePreviewDialogProps) => {
  const hasProducts = data.breakdown.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Vista Previa de Factura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Invoice Header Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-foreground">{data.ncf}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(data.invoiceDate, "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            {data.clientName && (
              <div className="p-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-semibold text-foreground">{data.clientName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Amount */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Factura</p>
                    <p className="text-2xl font-bold text-foreground">${formatNumber(data.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Breakdown */}
            {hasProducts && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Productos Variables</span>
                </div>
                <div className="space-y-2">
                  {data.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span 
                          className="px-2 py-1 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.percentage}%
                        </span>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">${formatNumber(item.amount)}</p>
                        <p className="font-semibold text-success">${formatCurrency(item.commission)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rest */}
            {data.restAmount > 0 && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-bold">
                      {data.restPercentage}%
                    </span>
                    <span className="font-medium text-foreground">Resto de productos</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">${formatNumber(data.restAmount)}</p>
                    <p className="font-semibold text-success">${formatCurrency(data.restCommission)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Commission */}
            <div className="p-4 bg-gradient-to-r from-success/10 to-success/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tu Comisión Total</p>
                    <p className="text-3xl font-black text-success">${formatCurrency(data.totalCommission)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a editar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto gap-2 gradient-success text-success-foreground"
          >
            <Check className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Confirmar y Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};