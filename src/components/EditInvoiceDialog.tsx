import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save, X, Calendar as CalendarIcon, User } from 'lucide-react';
import { formatCurrency, formatNumber, formatInputNumber, parseFormattedNumber } from '@/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const EditInvoiceDialog = ({ invoice, clients, onUpdate, trigger }: any) => {
  const [open, setOpen] = useState(false);
  const [totalStr, setTotalStr] = useState('');
  const [ncf, setNcf] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (open && invoice) {
      setTotalStr(formatInputNumber(invoice.total_amount.toString()));
      setNcf(invoice.ncf.slice(-4));
      setProducts(invoice.products || []);
    }
  }, [open, invoice]);

  const handleUpdate = async () => {
    const total = parseFormattedNumber(totalStr);
    const prodTotal = products.reduce((sum, p) => sum + p.amount, 0);
    const restAmount = Math.max(0, total - prodTotal);
    const restComm = restAmount * (invoice.rest_percentage / 100);
    const totalComm = products.reduce((sum, p) => sum + p.commission, 0) + restComm;

    await onUpdate(
      invoice.id,
      `B010000${ncf}`,
      invoice.invoice_date,
      total,
      restAmount,
      invoice.rest_percentage,
      restComm,
      totalComm,
      products,
      invoice.client_id
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary/10 px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Pencil className="h-5 w-5" /> Editar Factura {invoice.ncf}
          </DialogTitle>
        </div>

        <div className="p-8 space-y-8">
          {/* Cabecera Estilo Factura */}
          <div className="grid grid-cols-2 gap-8 pb-6 border-b border-dashed">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">NCF (4 finales)</span>
              <Input 
                value={ncf} 
                onChange={e => setNcf(e.target.value.replace(/\D/g, '').slice(0,4))} 
                className="font-mono font-bold text-lg h-10 border-primary/20"
              />
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Monto Total Real</span>
              <Input 
                value={totalStr} 
                onChange={e => setTotalStr(formatInputNumber(e.target.value))} 
                className="text-right font-black text-xl h-10 border-primary/20"
              />
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-muted-foreground px-2">
              <div className="col-span-6">Producto</div>
              <div className="col-span-2 text-center">%</div>
              <div className="col-span-4 text-right">Monto ($)</div>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {products.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-lg group">
                  <div className="col-span-6 font-medium text-sm">{p.product_name}</div>
                  <div className="col-span-2 text-center text-xs font-bold bg-background rounded p-1">{p.percentage}%</div>
                  <div className="col-span-4">
                    <Input 
                      value={formatNumber(p.amount)} 
                      onChange={e => {
                        const newVal = parseFormattedNumber(e.target.value);
                        const newProds = [...products];
                        newProds[i] = {...p, amount: newVal, commission: newVal * (p.percentage/100)};
                        setProducts(newProds);
                      }}
                      className="h-8 text-right font-bold text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen Final */}
          <div className="pt-6 border-t-2 border-primary/20">
            <div className="flex justify-between items-center p-4 bg-primary text-white rounded-xl shadow-inner">
              <span className="font-bold">Nueva Comisión Total</span>
              <span className="text-3xl font-black">
                ${formatCurrency(products.reduce((s, p) => s + p.commission, 0) + (Math.max(0, parseFormattedNumber(totalStr) - products.reduce((s, p) => s + p.amount, 0)) * (invoice.rest_percentage/100)))}
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="px-8">Cancelar</Button>
            <Button onClick={handleUpdate} className="px-8 gradient-primary font-bold">Guardar Cambios</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
