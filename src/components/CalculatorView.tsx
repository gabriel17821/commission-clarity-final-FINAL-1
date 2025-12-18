import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Trash2, Save, User, DollarSign, CalendarIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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
  
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeller?.id]);

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
    <div className="container max-w-[1400px] mx-auto py-4 space-y-4 animate-in fade-in duration-500">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { setShowSaveAnimation(false); handleReset(); }} 
      />

      {/* Header Compacto */}
      <div className="flex flex-row justify-between items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Calculadora</h2>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-1.5 rounded-full border shadow-sm">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-md">
            {activeSeller?.name?.charAt(0) || <User size={12} />}
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{activeSeller?.name}</span>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[1.5rem] overflow-visible">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- COLUMNA IZQUIERDA: INPUTS (4 cols) --- */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              {/* 1. FECHA Y NCF (Arriba del todo) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Fecha Factura
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(
                        "w-full justify-start text-left font-bold h-11 rounded-xl border-slate-200 text-sm px-3 hover:bg-slate-50",
                        !invoiceDate && "text-muted-foreground"
                      )}>
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {format(invoiceDate, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-none" align="start">
                      <Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    NCF (4 Finales)
                  </Label>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 h-11 px-3 focus-within:ring-2 ring-primary/20 transition-all hover:bg-slate-50">
                    <span className="text-[10px] font-mono font-bold text-slate-400 mr-2 border-r pr-2 py-0.5">B01</span>
                    <Input 
                      value={ncfSuffix} 
                      onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} 
                      className="border-0 focus-visible:ring-0 font-mono font-bold text-base h-full bg-transparent p-0 tracking-widest w-full" 
                      placeholder="0000" 
                    />
                  </div>
                </div>
              </div>

              {/* 2. CLIENTE (En medio) */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Cliente
                </Label>
                <div className="bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
                    <ClientSelector 
                    clients={clients} 
                    selectedClient={selectedClient} 
                    onSelectClient={setSelectedClient} 
                    onAddClient={onAddClient} 
                    />
                </div>
              </div>

              <div className="flex-1"></div>

              {/* 3. TOTAL FACTURA (Abajo, Destacado con Fondo Oscuro) */}
              <div className="space-y-2 bg-slate-900 dark:bg-slate-800 p-5 rounded-2xl shadow-lg shadow-slate-900/10">
                <Label className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-white"><DollarSign className="h-4 w-4 text-primary"/> Total Factura</span>
                  <span className="text-[9px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded font-black tracking-wider">SIN ITBIS</span>
                </Label>
                <div className="relative group">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-medium text-slate-500 pointer-events-none">$</span>
                  <Input 
                    value={displayValue} 
                    onChange={e=>{
                      const f = formatInputNumber(e.target.value);
                      setDisplayValue(f);
                      setTotalInvoice(parseFormattedNumber(f));
                    }}
                    className="h-16 pl-6 text-5xl font-black border-none focus:ring-0 bg-transparent text-white placeholder:text-slate-700 tracking-tight w-full p-0" 
                    placeholder="0" 
                  />
                </div>
              </div>

              {/* Botón Mobile */}
              <div className="lg:hidden">
                 <Button 
                  disabled={!isFormValid}
                  onClick={()=>setShowPreviewDialog(true)}
                  className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 rounded-xl"
                >
                  <Save className="mr-2 h-4 w-4" /> Guardar Factura
                </Button>
              </div>
            </div>

            {/* --- COLUMNA DERECHA: PRODUCTOS (8 cols) --- */}
            <div className="lg:col-span-8 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 p-5">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between mb-1">
                   <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Package className="h-4 w-4" /> Desglose de Productos
                   </h3>
                   <ProductCatalogDialog 
                      products={products} 
                      onUpdateProduct={onUpdateProduct} 
                      onDeleteProduct={onDeleteProduct} 
                      onAddProduct={onAddProduct} 
                   />
                </div>

                <div className="space-y-2">
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

                <Separator className="bg-slate-200" />

                {/* Área de Totales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2">
                    {/* Resto */}
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resto ({restPercentage}%)</span>
                            <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                        </div>
                        <span className="text-2xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                            ${formatNumber(calculations.restAmount)}
                        </span>
                    </div>

                    {/* Comisión Total y Botones (Lado a lado) */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-primary/5 dark:bg-primary/10 p-3 rounded-xl border border-primary/10 flex flex-col justify-center h-20">
                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">Comisión Total</p>
                            <p className="text-3xl font-black text-primary tracking-tight tabular-nums">
                                ${formatCurrency(calculations.totalCommission)}
                            </p>
                        </div>
                        
                        {/* Botones de acción horizontal */}
                        <div className="flex flex-row items-center gap-2 h-20">
                             <Button 
                                variant="outline" 
                                size="icon"
                                onClick={handleReset} 
                                className="h-full w-14 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-xl border-slate-200"
                                title="Limpiar formulario"
                            >
                                <Trash2 size={20} />
                            </Button>
                            <Button 
                                disabled={!isFormValid}
                                onClick={()=>setShowPreviewDialog(true)}
                                className="h-full px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Save className="h-5 w-5 mr-2" />
                                Guardar
                            </Button>
                        </div>
                    </div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
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
