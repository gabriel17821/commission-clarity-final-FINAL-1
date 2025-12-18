import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, FileText, CalendarIcon, Package, Trash2, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-4 animate-in fade-in duration-500">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { 
          setShowSaveAnimation(false); 
          handleReset();
        }} 
      />

      <Card className="overflow-hidden border-none shadow-2xl bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800">
        {/* Header con Gradiente */}
        <div className="gradient-primary p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 transform">
            <Calculator size={120} />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Calculator className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Calculadora de Comisiones</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs font-bold uppercase opacity-90 tracking-widest">{activeSeller?.name || 'Vendedor'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 min-w-[200px]">
              <p className="text-[10px] font-black opacity-80 uppercase tracking-tighter mb-1">Comisión Estimada</p>
              <p className="text-4xl font-black tabular-nums">${formatCurrency(calculations.totalCommission)}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Columna Izquierda: Datos de Factura */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" /> Fecha de Factura
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 border-2 justify-start font-semibold text-sm transition-all hover:border-primary/50">
                        {format(invoiceDate, 'PPP', { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    NCF (Últimos 4)
                  </Label>
                  <div className="flex items-center border-2 rounded-xl h-12 bg-muted/20 px-4 focus-within:border-primary transition-all">
                    <span className="text-xs font-mono font-bold text-muted-foreground border-r pr-3 mr-3">B010000</span>
                    <Input 
                      value={ncfSuffix} 
                      onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} 
                      className="border-0 focus-visible:ring-0 font-mono font-bold text-base p-0 h-full" 
                      placeholder="0000" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Cliente</Label>
                <ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} onAddClient={onAddClient} />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  Monto Subtotal de la Factura <span className="text-primary font-black">(Sin ITBIS)</span>
                </Label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300 group-focus-within:text-primary transition-colors">$</span>
                  <Input 
                    value={displayValue} 
                    onChange={e=>{
                      const f=formatInputNumber(e.target.value); 
                      setDisplayValue(f); 
                      setTotalInvoice(parseFormattedNumber(f));
                    }} 
                    className="h-20 pl-12 text-4xl font-black border-2 border-slate-100 dark:border-slate-800 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl shadow-inner bg-slate-50/50 dark:bg-slate-900/50" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Productos y Resto */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 flex-1 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" /> Productos
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Comisiones específicas</p>
                  </div>
                  <ProductCatalogDialog products={products} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} onAddProduct={onAddProduct} />
                </div>
                
                <div className="min-h-[200px]">
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

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">
                        {restPercentage}%
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Resto de Factura</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg tabular-nums">${formatNumber(calculations.restAmount)}</span>
                      <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones Secundarias */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 font-bold border-2 hover:bg-destructive/5 hover:text-destructive hover:border-destructive transition-all rounded-xl"
                  onClick={handleReset}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Limpiar Datos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Barra de Acción Principal */}
        {totalInvoice > 0 && (
          <div className={cn(
            "p-6 border-t transition-all duration-300",
            (ncfSuffix.length === 4 && selectedClient) ? "bg-primary/5 opacity-100" : "bg-muted/30 opacity-60 grayscale"
          )}>
            {!(ncfSuffix.length === 4 && selectedClient) && (
              <p className="text-center text-xs font-bold text-muted-foreground uppercase mb-4 animate-pulse">
                Completa el NCF y selecciona un cliente para continuar
              </p>
            )}
            <Button 
              disabled={!(ncfSuffix.length === 4 && selectedClient)}
              className="w-full h-16 text-xl font-black gradient-primary shadow-xl hover:shadow-primary/20 transition-all rounded-2xl disabled:opacity-50" 
              onClick={()=>setShowPreviewDialog(true)}
            >
              <CheckCircle2 className="mr-3 h-6 w-6" /> REVISAR Y GUARDAR FACTURA
            </Button>
          </div>
        )}
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
