import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, User, Hash, DollarSign, Percent, Save, X } from "lucide-react";
import { ClientSelector } from "@/components/ClientSelector";
import { formatInputNumber, parseFormattedNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onUpdate: (id: string, updates: any) => Promise<void>;
  clients: any[];
  onAddClient: (name: string) => Promise<void>;
}

export const EditInvoiceDialog = ({
  open,
  onOpenChange,
  invoice,
  onUpdate,
  clients,
  onAddClient,
}: EditInvoiceDialogProps) => {
  const [formData, setFormData] = useState<any>(null);
  const [displayAmount, setDisplayAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local cuando se abre el invoice
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_date: new Date(invoice.invoice_date),
        ncf: invoice.ncf?.replace("B010000", "") || "",
        client_id: invoice.client_id,
        total_amount: invoice.total_amount,
        rest_percentage: invoice.rest_percentage || 0,
      });
      setDisplayAmount(formatInputNumber(invoice.total_amount.toString()));
    }
  }, [invoice]);

  if (!formData) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(invoice.id, {
        ...formData,
        ncf: formData.ncf ? `B010000${formData.ncf}` : null,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
        {/* Header con estilo de la App */}
        <div className="gradient-primary p-8 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Save size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">Editar Factura</DialogTitle>
              <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Ajuste de datos de operación</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-white dark:bg-slate-950">
          {/* Bloque 1: Identificación y Fecha */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <CalendarIcon size={12} className="text-primary" /> Fecha de Emisión
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 font-semibold justify-start transition-all hover:bg-slate-50">
                    {format(formData.invoice_date, 'dd MMM, yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
                  <Calendar 
                    mode="single" 
                    selected={formData.invoice_date} 
                    onSelect={(d) => d && setFormData({...formData, invoice_date: d})} 
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Hash size={12} className="text-primary" /> NCF Suffix
              </Label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 h-12 px-4 focus-within:ring-2 ring-primary/20 transition-all">
                <span className="text-[10px] font-black text-slate-300 mr-2 border-r pr-2">B010000</span>
                <Input 
                  value={formData.ncf} 
                  onChange={(e) => setFormData({...formData, ncf: e.target.value.replace(/\D/g,'').slice(0,4)})}
                  className="border-0 focus-visible:ring-0 font-mono font-bold text-base h-full bg-transparent p-0" 
                  placeholder="0000" 
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Cliente */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
              <User size={12} className="text-primary" /> Cliente
            </Label>
            <ClientSelector 
              clients={clients} 
              selectedClient={clients.find(c => c.id === formData.client_id)} 
              onSelectClient={(client: any) => setFormData({...formData, client_id: client?.id})} 
              onAddClient={onAddClient} 
            />
          </div>

          {/* Bloque 3: Valores Financieros */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <DollarSign size={12} className="text-primary" /> Monto Subtotal
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                  <Input 
                    value={displayAmount}
                    onChange={(e) => {
                      const f = formatInputNumber(e.target.value);
                      setDisplayAmount(f);
                      setFormData({...formData, total_amount: parseFormattedNumber(f)});
                    }}
                    className="h-12 pl-8 rounded-xl font-bold border-slate-200 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <Percent size={12} className="text-primary" /> % de Comisión
                </Label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={formData.rest_percentage}
                    onChange={(e) => setFormData({...formData, rest_percentage: Number(e.target.value)})}
                    className="h-12 pr-8 rounded-xl font-bold border-slate-200 focus:border-primary transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 bg-slate-50 border-t flex gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-200"
          >
            <X size={18} className="mr-2" /> Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || !formData.client_id || formData.ncf.length < 4}
            className="flex-[2] h-12 rounded-2xl font-black gradient-primary shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
