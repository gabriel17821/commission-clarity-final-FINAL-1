import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { cn } from "@/lib/utils";

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
      
      // Recalcular montos basados en los nuevos valores
      const restAmount = Math.max(0, total - prodTotal);
      const restComm = restAmount * (restPercentage / 100);
      const prodComm = prods.reduce((s, p) => s + (p.amount * (p.percentage / 100)), 0);
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
    } catch (error) {
      console.error("Error updating invoice:", error);
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
        {/* Header Visual */}
        <div className="gradient-primary p-6 px-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">Editar Operación</DialogTitle>
              <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Ajuste completo de factura</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpen(false)} 
            className="text-white/70 hover:text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Bloque 1: Datos Generales */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <CalendarIcon className="h-3 w-3 text-primary" /> Fecha
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 font-bold text-sm justify-start hover:bg-slate-50">
                    {format(invoiceDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 rounded-xl shadow-xl border-none">
                  <Calendar mode="single" selected={invoiceDate} onSelect={(d) => d && setInvoiceDate(d)} locale={es} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <Hash className="h-3 w-3 text-primary" /> NCF (Finales)
              </Label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 h-11 px-3 focus-within:ring-2 ring-primary/20 transition-all">
                <span className="text-[10px] font-mono font-black text-slate-400 mr-2 border-r pr-2">B010000</span>
                <Input 
                  value={ncf} 
                  onChange={e => setNcf(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                  className="border-0 focus-visible:ring-0 font-mono font-bold text-sm h-full bg-transparent p-0" 
                  placeholder="0000" 
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Cliente */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
              <User className="h-3 w-3 text-primary" /> Cliente
            </Label>
            <ClientSelector 
              clients={clients} 
              selectedClient={selectedClient} 
              onSelectClient={(c: any) => setSelectedClientId(c?.id)} 
              onAddClient={onAddClient} 
            />
          </div>

          {/* Bloque 3: Valores Numéricos */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-primary" /> Subtotal Factura
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                  <Input 
                    value={totalStr} 
                    onChange={e => setTotalStr(formatInputNumber(e.target.value))} 
                    className="h-12 pl-7 text-xl font-black bg-white dark:bg-slate-950 border-slate-200 rounded-xl focus-visible:ring-primary" 
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Percent className="h-3 w-3 text-primary" /> % Resto
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={restPercentage} 
                    onChange={e => setRestPercentage(Number(e.target.value))} 
                    className="h-12 text-center text-lg font-bold bg-white dark:bg-slate-950 border-slate-200 rounded-xl" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 4: Productos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-dashed border-slate-200">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">Desglose de Productos</span>
            </div>
            <div className="space-y-3">
              {prods.map((p, i) => (
                <div key={i} className="group flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-primary/30">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{p.product_name}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{p.percentage}% Com.</p>
                  </div>
                  <div className="w-32 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <Input 
                      value={formatNumber(p.amount)} 
                      onChange={e => {
                        const val = parseFormattedNumber(e.target.value);
                        const n = [...prods];
                        n[i] = { ...p, amount: val, commission: val * (p.percentage / 100) };
                        setProds(n);
                      }} 
                      className="text-right font-bold h-9 pl-5 bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all text-sm" 
                    />
                  </div>
                </div>
              ))}
              {prods.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4 italic">No hay productos individuales asignados.</p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-500 hover:text-slate-700"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || ncf.length < 4 || !selectedClientId}
            className="flex-[2] h-12 rounded-xl font-black gradient-primary shadow-lg shadow-primary/20 text-white hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
