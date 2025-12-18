import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save, X, ArrowLeft, Check } from 'lucide-react';
import { formatCurrency, formatNumber, formatInputNumber, parseFormattedNumber } from '@/lib/formatters';

export const EditInvoiceDialog = ({ invoice, onUpdate, trigger }: any) => {
  const [open, setOpen] = useState(false);
  const [totalStr, setTotalStr] = useState('');
  const [ncf, setNcf] = useState('');
  const [prods, setProds] = useState<any[]>([]);

  useEffect(() => {
    if (open && invoice) {
      setTotalStr(formatInputNumber(invoice.total_amount.toString()));
      setNcf(invoice.ncf.slice(-4));
      setProds(invoice.products || []);
    }
  }, [open, invoice]);

  const handleSave = async () => {
    const total = parseFormattedNumber(totalStr);
    const prodTotal = prods.reduce((s, p) => s + p.amount, 0);
    const restAmount = Math.max(0, total - prodTotal);
    const restComm = restAmount * (invoice.rest_percentage / 100);
    const totalComm = prods.reduce((s, p) => s + p.commission, 0) + restComm;

    await onUpdate(invoice.id, `B010000${ncf}`, invoice.invoice_date, total, restAmount, invoice.rest_percentage, restComm, totalComm, prods, invoice.client_id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-none">
        <div className="bg-primary/5 px-6 py-4 border-b shrink-0">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg font-bold text-primary"><Pencil className="h-5 w-5" /> Editar Factura</DialogTitle></DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-6 pb-4 border-b border-dashed">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-muted-foreground">ÚLTIMOS 4 NCF</span>
              <Input value={ncf} onChange={e => setNcf(e.target.value.replace(/\D/g, '').slice(0,4))} className="font-mono font-bold border-primary/20" />
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-black text-muted-foreground">TOTAL FACTURA</span>
              <Input value={totalStr} onChange={e => setTotalStr(formatInputNumber(e.target.value))} className="text-right font-black text-lg border-primary/20" />
            </div>
          </div>
          <div className="space-y-3">
             <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-muted-foreground border-b pb-1">
                <div className="col-span-7">PRODUCTO</div>
                <div className="col-span-5 text-right">MONTO ($)</div>
             </div>
             {prods.map((p, i) => (
               <div key={i} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-7 font-bold text-sm">{p.product_name}</div>
                  <div className="col-span-5"><Input value={formatNumber(p.amount)} onChange={e => {
                    const val = parseFormattedNumber(e.target.value);
                    const n = [...prods];
                    n[i] = {...p, amount: val, commission: val * (p.percentage/100)};
                    setProds(n);
                  }} className="text-right h-8 font-bold" /></div>
               </div>
             ))}
          </div>
        </div>
        <div className="bg-muted/50 p-6 border-t shrink-0">
           <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-12 font-bold">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 h-12 font-bold gradient-primary shadow-md"><Save className="mr-2 h-4 w-4" /> Guardar Cambios</Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
