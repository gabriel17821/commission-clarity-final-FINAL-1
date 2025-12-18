import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, FileText, CalendarIcon, Package, Trash2, Check, User, Hash, DollarSign, Percent } from "lucide-react";
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

export const CalculatorView = ({ 
  products, 
  productAmounts, 
  totalInvoice, 
  setTotalInvoice, 
  restPercentage, 
  onProductChange, 
  onReset, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onUpdateRestPercentage, 
  onSaveInvoice, 
  suggestedNcf, 
  clients, 
  onAddClient, 
  activeSeller 
}: any) => {
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
    onReset();
    setDisplayValue('');
    setNcfSuffix(suggestedNcf ? String(suggestedNcf).padStart(4, '0') : '');
    setActiveProductIds([]);
    setSelectedClient(null);
    setInvoiceDate(new Date());
  };

  const isFormValid = totalInvoice > 0 && ncfSuffix.length === 4 && selectedClient;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 px-2 animate-in fade-in duration-500">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { 
          setShowSaveAnimation(false); 
          handleReset(); 
        }} 
      />
      
      <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem]">
        
        {/* Header: Estilo Premium (Igual que el Dialog) */}
        <div className="gradient-primary p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Nueva Operación</h2>
              <div className="flex items-center gap-2 opacity-90">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"/>
                <p className="text-[10px] font-bold uppercase tracking-widest">{activeSeller?.name || 'Vendedor'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-1">Comisión Estimada</p>
            <div className="bg-white/10 px-6 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
              <p className="text-4xl font-black tabular-nums tracking-tight">${formatCurrency(calculations.totalCommission)}</p>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: Inputs (Factura) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Fila 1: Fecha y NCF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3 text-primary" /> Fecha Factura
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-sm justify-start hover:bg-slate-50 transition-all">
                      {format(invoiceDate, 'PPP', { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-xl rounded-xl">
                    <Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es}/>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Hash className="h-3 w-3 text-primary" /> NCF (4 Finales)
                </Label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 h-12 px-4 focus-within:ring-2 ring-primary/20 transition-all">
                  <span className="text-[10px] font-mono font-black text-slate-400 mr-2 border-r pr-2">B010000</span>
                  <Input 
                    value={ncfSuffix} 
                    onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} 
                    className="border-0 focus-visible:ring-0 font-mono font-bold text-base h-full bg-transparent p-0" 
                    placeholder="0000" 
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Cliente */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <User className="h-3 w-3 text-primary" /> Cliente
              </Label>
              <ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} onAddClient={onAddClient} />
            </div>

            {/* Fila 3: Subtotal (Hero Input) */}
            <div className="space-y-3 pt-4 border-t border-dashed">
              <Label className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Subtotal Factura <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-black">Antes de ITBIS</span>
              </Label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300 group-focus-within:text-primary transition-colors">$</span>
                <Input 
                  value={displayValue} 
                  onChange={e=>{
                    const f=formatInputNumber(e.target.value); 
                    setDisplayValue(f); 
                    setTotalInvoice(parseFormattedNumber(f));
                  }} 
                  className="h-24 pl-14 text-5xl font-black border-2 border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-900/50 tracking-tight" 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Productos y Totales */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Panel de Productos */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 flex-1 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Productos</h3>
                </div>
                <ProductCatalogDialog products={products} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} onAddProduct={onAddProduct} />
              </div>
              
              <div className="min-h-[150px]">
                <ProductManager 
                  products={products} 
                  activeProductIds={activeProductIds} 
                  productAmounts={productAmounts} 
                  onProductChange={onProductChange} 
                  onAddProductToInvoice={id=>setActiveProductIds(v=>[...new Set([...v, id])])} 
                  onRemoveProductFromInvoice={id=>setActiveProductIds(v=>v.filter(x=>x!==id))} 
                  onAddProduct={onAddProduct} 
                />
              </div>

              {/* Sección Resto */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600">
                      {restPercentage}%
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resto Factura</span>
                      <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                    </div>
                  </div>
                  <span className="font-bold text-xl tabular-nums tracking-tight">${formatNumber(calculations.restAmount)}</span>
                </div>
              </div>
            </div>

            {/* Botón de Limpiar */}
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-12 rounded-xl font-bold"
              onClick={handleReset}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Limpiar Formulario
            </Button>
          </div>
        </div>

        {/* Footer de Acción Principal */}
        <div className={cn(
          "p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-all duration-300",
          isFormValid ? "opacity-100" : "opacity-70 grayscale-[0.5]"
        )}>
          {!isFormValid && (
             <div className="flex justify-center mb-4 gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className={cn(ncfSuffix.length === 4 ? "text-green-500" : "text-orange-400")}>• NCF</span>
                <span className={cn(selectedClient ? "text-green-500" : "text-orange-400")}>• Cliente</span>
                <span className={cn(totalInvoice > 0 ? "text-green-500" : "text-orange-400")}>• Monto</span>
             </div>
          )}
          <Button 
            disabled={!isFormValid}
            className="w-full h-16 text-xl font-black gradient-primary shadow-xl hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-2xl disabled:opacity-50" 
            onClick={()=>setShowPreviewDialog(true)}
          >
            <FileText className="mr-3 h-6 w-6" /> REVISAR Y GUARDAR
          </Button>
        </div>
      </Card>

      <InvoicePreviewDialog 
        open={showPreviewDialog} 
        onOpenChange={setShowPreviewDialog} 
        onConfirm={async ()=>{ 
          setShowPreviewDialog(false); 
          setShowSaveAnimation(true); 
          await onSaveInvoice(ncfSuffix, format(invoiceDate, 'yyyy-MM-dd'), selectedClient?.id);
        }} 
        data={{ 
          ncf: `B010000${ncfSuffix}`, 
          invoiceDate, 
          clientName: selectedClient?.name, 
          totalAmount: totalInvoice, 
          ...calculations, 
          restPercentage 
        }} 
      />
    </div>
  );
};
