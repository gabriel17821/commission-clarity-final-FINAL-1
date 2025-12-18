import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Trash2, Save, User, DollarSign, CalendarIcon, ChevronRight } from "lucide-react";
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
  }, [activeSeller?.id]);

  useEffect(() => { 
    if (suggestedNcf) setNcfSuffix(String(suggestedNcf).padStart(4, '0')); 
  }, [suggestedNcf]);

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
    <div className="container max-w-[1400px] mx-auto py-6 space-y-6 animate-in fade-in duration-500">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { setShowSaveAnimation(false); handleReset(); }} 
      />

      {/* Header Refinado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Calculadora <ChevronRight className="text-primary h-6 w-6" />
          </h2>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Gestión de comisiones</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border-2 border-primary/10 px-4 py-2 rounded-2xl shadow-sm">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
            {activeSeller?.name?.charAt(0) || <User size={14} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Vendedor Activo</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{activeSeller?.name}</span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* --- COLUMNA IZQUIERDA: CONFIGURACIÓN (5 cols) --- */}
            <div className="lg:col-span-5 p-8 border-r border-slate-100 dark:border-slate-900 space-y-8 bg-slate-50/30">
              
              {/* 1. FECHA Y NCF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Fecha de Emisión
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-bold h-12 rounded-xl border-slate-200 shadow-sm bg-white">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {format(invoiceDate, 'dd MMM, yyyy', { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-none" align="start">
                      <Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    NCF Finales
                  </Label>
                  <div className="flex items-center bg-white rounded-xl border-2 border-slate-200 h-12 px-4 focus-within:border-primary transition-all shadow-sm group">
                    <span className="text-xs font-mono font-black text-slate-300 group-focus-within:text-primary mr-3 border-r pr-3 py-1">B01</span>
                    <Input 
                      value={ncfSuffix} 
                      onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} 
                      className="border-0 focus-visible:ring-0 font-mono font-bold text-lg h-full bg-transparent p-0 tracking-[0.2em] w-full" 
                      placeholder="0000" 
                    />
                  </div>
                </div>
              </div>

              {/* 2. CLIENTE (Ocupa más espacio visual) */}
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                   Información del Cliente
                </Label>
                <div className="bg-white p-2 rounded-[1.5rem] border-2 border-slate-100 shadow-sm min-h-[100px] flex flex-col justify-center">
                    <ClientSelector 
                      clients={clients} 
                      selectedClient={selectedClient} 
                      onSelectClient={setSelectedClient} 
                      onAddClient={onAddClient} 
                    />
                </div>
              </div>

              {/* 3. TOTAL FACTURA (Rediseño Total) */}
              <div className="relative pt-4">
                <div className="absolute inset-0 bg-primary/5 rounded-[2rem] -rotate-1 scale-[1.02] -z-10" />
                <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5 rounded-[1.8rem] bg-white dark:bg-slate-900">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Importe Total de Factura
                      </Label>
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-md">SIN ITBIS</span>
                    </div>
                    <div className="relative group">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300 pointer-events-none transition-colors group-focus-within:text-primary">$</span>
                      <Input 
                        value={displayValue} 
                        onChange={e=>{
                          const f = formatInputNumber(e.target.value);
                          setDisplayValue(f);
                          setTotalInvoice(parseFormattedNumber(f));
                        }}
                        className="h-14 pl-8 text-4xl sm:text-5xl font-black border-none focus:ring-0 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-100 tracking-tighter w-full p-0" 
                        placeholder="0.00" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* --- COLUMNA DERECHA: PRODUCTOS (7 cols) --- */}
            <div className="lg:col-span-7 p-8 flex flex-col min-h-[600px]">
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" /> Desglose por Productos
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">Asigna montos específicos a productos del catálogo</p>
                   </div>
                   <ProductCatalogDialog 
                      products={products} 
                      onUpdateProduct={onUpdateProduct} 
                      onDeleteProduct={onDeleteProduct} 
                      onAddProduct={onAddProduct} 
                   />
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-800">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Resto */}
                    <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-200 flex items-center justify-between group transition-all hover:bg-white hover:shadow-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cálculo del Resto</span>
                            <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400">Monto: ${formatNumber(calculations.restAmount)}</p>
                          <span className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
                              {restPercentage}%
                          </span>
                        </div>
                    </div>

                    {/* Comisión Total (Más visual) */}
                    <div className="bg-primary px-6 py-4 rounded-2xl shadow-xl shadow-primary/20 flex flex-col justify-center h-full text-white">
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Comisión Generada</p>
                        <p className="text-3xl font-black tracking-tighter tabular-nums">
                            ${formatCurrency(calculations.totalCommission)}
                        </p>
                    </div>
                </div>
              </div>

              {/* Botones de Acción Finales */}
              <div className="pt-8 mt-auto border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row gap-3">
                  <Button 
                      variant="outline" 
                      onClick={handleReset} 
                      className="flex-none h-14 w-full sm:w-16 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-2xl border-2 border-slate-100 transition-all"
                      title="Reiniciar todo"
                  >
                      <Trash2 className="h-6 w-6" />
                      <span className="sm:hidden ml-2 font-bold">Limpiar Formulario</span>
                  </Button>
                  <Button 
                      disabled={!isFormValid}
                      onClick={()=>setShowPreviewDialog(true)}
                      className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 rounded-2xl font-black text-lg transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                  >
                      <Save className="h-6 w-6 mr-3" />
                      GUARDAR FACTURA
                  </Button>
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
