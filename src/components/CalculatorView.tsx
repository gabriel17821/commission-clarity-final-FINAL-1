import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, FileText, CalendarIcon, Package, Trash2, ChevronRight, User } from "lucide-react";
import { ProductManager } from "@/components/ProductManager";
import { ClientSelector } from "@/components/ClientSelector";
import { SaveSuccessAnimation } from "@/components/SaveSuccessAnimation";
import { InvoicePreviewDialog } from "@/components/InvoicePreviewDialog";
import { ProductCatalogDialog } from "@/components/ProductCatalogDialog";
import { EditRestPercentageDialog } from "@/components/EditRestPercentageDialog";
import { formatNumber, formatCurrency, formatInputNumber, parseFormattedNumber } from "@/lib/formatters";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const CalculatorView = ({ products, productAmounts, totalInvoice, setTotalInvoice, restPercentage, onProductChange, onReset, onAddProduct, onUpdateProduct, onDeleteProduct, onUpdateRestPercentage, onSaveInvoice, suggestedNcf, clients, onAddClient, activeSeller }: any) => {
  const [displayValue, setDisplayValue] = useState(totalInvoice > 0 ? formatInputNumber(totalInvoice.toString()) : '');
  const [activeProductIds, setActiveProductIds] = useState<string[]>([]);
  const [ncfSuffix, setNcfSuffix] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);

  useEffect(() => { if (suggestedNcf) setNcfSuffix(String(suggestedNcf).padStart(4, '0')); }, [suggestedNcf]);

  const calculations = useMemo(() => {
    const breakdown = products.filter((p: any) => activeProductIds.includes(p.id)).map((p: any) => {
      const amt = productAmounts[p.id] || 0;
      return { name: p.name, amount: amt, percentage: p.percentage, commission: amt * (p.percentage / 100), color: p.color };
    });
    const pTotal = breakdown.reduce((s: number, i: any) => s + i.amount, 0);
    const rAmt = Math.max(0, totalInvoice - pTotal);
    const rComm = rAmt * (restPercentage / 100);
    const tComm = breakdown.reduce((s: number, i: any) => s + i.commission, 0) + rComm;
    return { breakdown, restAmount: rAmt, restCommission: rComm, totalCommission: tComm };
  }, [totalInvoice, productAmounts, products, restPercentage, activeProductIds]);

  const handleReset = () => {
    onReset(); setDisplayValue(''); setNcfSuffix(''); setActiveProductIds([]); setSelectedClient(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SaveSuccessAnimation show={showSaveAnimation} onComplete={() => { setShowSaveAnimation(false); handleReset(); }} />

      {/* Header Minimalista */}
      <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Calculator className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Nueva Operación</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Calculadora</h1>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 pr-4 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs">
            {activeSeller?.name?.charAt(0) || <User size={14} />}
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{activeSeller?.name}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cuerpo Principal */}
        <div className="lg:col-span-7 space-y-8">
          {/* Sección 1: Datos de la Factura */}
          <section className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-900 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Fecha Emisión</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 dark:border-slate-800 font-semibold justify-start transition-all hover:bg-slate-50">
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" /> {format(invoiceDate, 'dd MMM, yyyy', { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden"><Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es}/></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">NCF Suffix</Label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 h-12 px-4 focus-within:ring-2 ring-primary/20 transition-all">
                  <span className="text-[10px] font-black text-slate-300 mr-2 border-r pr-2">B010000</span>
                  <Input value={ncfSuffix} onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} className="border-0 focus-visible:ring-0 font-mono font-bold text-base h-full bg-transparent p-0" placeholder="0000" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cliente</Label>
              <ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} onAddClient={onAddClient} />
            </div>
          </section>

          {/* Sección 2: El Monto (Foco Central) */}
          <section className="bg-slate-900 dark:bg-primary/10 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><FileText size={120} /></div>
            <div className="relative z-10 space-y-4">
              <Label className="text-sm font-bold text-primary-foreground/60 tracking-tight">Monto total de la factura (Subtotal antes de ITBIS)</Label>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-light text-white/40">$</span>
                <Input 
                  value={displayValue} 
                  onChange={e=>{
                    const f=formatInputNumber(e.target.value); 
                    setDisplayValue(f); 
                    setTotalInvoice(parseFormattedNumber(f));
                  }} 
                  className="h-auto bg-transparent border-0 focus-visible:ring-0 text-6xl font-black p-0 tracking-tighter placeholder:text-white/10" 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar de Productos y Comisión */}
        <aside className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-950 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Package size={18}/></div>
                <h3 className="text-sm font-black uppercase tracking-wider">Productos</h3>
              </div>
              <ProductCatalogDialog products={products} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} onAddProduct={onAddProduct} />
            </div>

            <div className="min-h-[100px] space-y-4">
              <ProductManager products={products} activeProductIds={activeProductIds} productAmounts={productAmounts} onProductChange={onProductChange} onAddProductToInvoice={id=>setActiveProductIds(v=>[...new Set([...v, id])])} onRemoveProductFromInvoice={id=>setActiveProductIds(v=>v.filter(x=>x!==id))} onAddProduct={onAddProduct} />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-900 space-y-4">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black">{restPercentage}%</div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Resto</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tabular-nums">${formatNumber(calculations.restAmount)}</span>
                  <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                </div>
              </div>

              {/* Resultado Final Compacto */}
              <div className="gradient-primary rounded-[2rem] p-6 text-white mt-4 shadow-lg shadow-primary/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Comisión Total</p>
                <div className="flex justify-between items-end">
                  <h4 className="text-4xl font-black tracking-tighter">${formatCurrency(calculations.totalCommission)}</h4>
                  <Button onClick={handleReset} variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Botón de Acción Principal Flotante/Compacto */}
          {totalInvoice > 0 && (
            <div className="animate-in zoom-in-95 duration-300">
              <Button 
                disabled={!(ncfSuffix.length === 4 && selectedClient)}
                className={cn(
                  "w-full h-16 rounded-[2rem] text-lg font-black tracking-tight shadow-xl transition-all",
                  (ncfSuffix.length === 4 && selectedClient) 
                    ? "gradient-primary hover:scale-[1.02] active:scale-95" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
                onClick={()=>setShowPreviewDialog(true)}
              >
                Guardar Factura <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              {!(ncfSuffix.length === 4 && selectedClient) && (
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest mt-4">Falta NCF y Cliente</p>
              )}
            </div>
          )}
        </aside>
      </div>

      <InvoicePreviewDialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog} onConfirm={async ()=>{ setShowPreviewDialog(false); setShowSaveAnimation(true); await onSaveInvoice(ncfSuffix, format(invoiceDate, 'yyyy-MM-dd'), selectedClient?.id);}} data={{ ncf: `B010000${ncfSuffix}`, invoiceDate, clientName: selectedClient?.name, totalAmount: totalInvoice, ...calculations, restPercentage }} />
    </div>
  );
};
