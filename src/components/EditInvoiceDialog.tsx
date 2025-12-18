import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Save, X, CalendarIcon, Hash, User, DollarSign, Percent, Package } from 'lucide-react';
import { formatNumber, formatInputNumber, parseFormattedNumber } from '@/lib/formatters';
import { ClientSelector } from '@/components/ClientSelector';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

export const EditInvoiceDialog = ({ invoice, onUpdate, trigger, clients, onAddClient }: any) => {
  const [open, setOpen] = useState(false);
  const [totalStr, setTotalStr] = useState('');
  const [ncf, setNcf] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [restPercentage, setRestPercentage] = useState<number>(0);
  const [prods, setProds] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      setTotalStr(formatInputNumber(invoice.total_amount.toString()));
      setNcf(invoice.ncf ? invoice.ncf.replace('B010000', '') : '');
      setInvoiceDate(new Date(invoice.invoice_date));
      setSelectedClientId(invoice.client_id);
      setRestPercentage(invoice.rest_percentage || 0);
      setProds(invoice.products || []);
    }
  }, [open, invoice]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const total = parseFormattedNumber(totalStr);
      const prodTotal = prods.reduce((s, p) => s + p.amount, 0);
      
      const restAmount = Math.max(0, total - prodTotal);
      const restComm = restAmount * (restPercentage / 100);
      const prodComm = prods.reduce((s, p) => s + p.commission, 0); // Suma comisiones individuales
      const totalComm = prodComm + restComm;

      await onUpdate(
        invoice.id, 
        ncf ? `B010000${ncf}` : null, 
        format(invoiceDate, 'yyyy-MM-dd'), 
        total, 
        restAmount, 
        restPercentage, 
        restComm, 
        totalComm, 
        prods, 
        selectedClientId
      );
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClient = clients?.find((c: any) => c.id === selectedClientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white dark:bg-slate-950">
        <div className="gradient-primary p-6 px-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">Editar Operación</DialogTitle>
              <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Ajuste completo</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-white/70 hover:text-white rounded-full"><X className="h-5 w-5" /></Button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Fila 1 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 font-bold text-sm justify-start">
                    <CalendarIcon className="mr-2 h-3 w-3 text-primary" /> {format(invoiceDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 rounded-xl"><Calendar mode="single" selected={invoiceDate} onSelect={(d) => d && setInvoiceDate(d)} locale={es} /></PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">NCF (Finales)</Label>
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 h-11 px-3">
                <span className="text-[10px] font-mono font-black text-slate-400 mr-2 border-r pr-2">B010000</span>
                <Input value={ncf} onChange={e => setNcf(e.target.value.replace(/\D/g, '').slice(0, 4))} className="border-0 bg-transparent font-mono font-bold text-sm h-full" placeholder="0000" />
              </div>
            </div>
          </div>

          {/* Fila 2 */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Cliente</Label>
            <ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={(c: any) => setSelectedClientId(c?.id)} onAddClient={onAddClient} />
          </div>

          {/* Fila 3: Financiero */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Subtotal Factura</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                  <Input value={totalStr} onChange={e => setTotalStr(formatInputNumber(e.target.value))} className="h-12 pl-7 text-xl font-black rounded-xl border-slate-200" />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">% Resto</Label>
                <Input type="number" value={restPercentage} onChange={e => setRestPercentage(Number(e.target.value))} className="h-12 text-center text-lg font-bold rounded-xl border-slate-200" />
              </div>
            </div>
          </div>

          {/* Fila 4: Productos (CON EDICIÓN DE PORCENTAJE) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-dashed border-slate-200">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">Desglose de Productos</span>
            </div>
            <div className="space-y-3">
              {prods.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex-1 font-bold text-sm text-slate-700">{p.product_name}</div>
                  
                  {/* INPUT DE PORCENTAJE */}
                  <div className="w-20 relative">
                     <Input 
                        type="number" 
                        value={p.percentage} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          const n = [...prods];
                          // Recalcula la comisión al cambiar el porcentaje
                          n[i] = { ...p, percentage: val, commission: p.amount * (val / 100) };
                          setProds(n);
                        }}
                        className="h-9 pr-6 text-center font-bold text-xs"
                     />
                     <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                  </div>

                  {/* INPUT DE MONTO */}
                  <div className="w-32 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <Input 
                      value={formatNumber(p.amount)} 
                      onChange={e => {
                        const val = parseFormattedNumber(e.target.value);
                        const n = [...prods];
                        // Recalcula la comisión al cambiar el monto
                        n[i] = { ...p, amount: val, commission: val * (p.percentage / 100) };
                        setProds(n);
                      }} 
                      className="text-right font-bold h-9 pl-5 text-sm" 
                    />
                  </div>
                </div>
              ))}
              {prods.length === 0 && <p className="text-center text-xs text-muted-foreground italic py-2">Sin productos asignados</p>}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || ncf.length < 4 || !selectedClientId} className="flex-[2] h-12 rounded-xl font-black gradient-primary shadow-lg text-white">
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
