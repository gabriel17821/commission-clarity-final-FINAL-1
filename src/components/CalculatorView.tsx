import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Trash2, Save, User, DollarSign, CalendarIcon, ChevronRight, Hash } from "lucide-react";
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
    <div className="container max-w-[1400px] mx-auto py-6 space-y-6 animate-in fade-in duration-700">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { setShowSaveAnimation(false); handleReset(); }} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Calculadora <ChevronRight className="text-primary/40 h-8 w-8" />
          </h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Facturación y Comisiones</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 pr-6 rounded-2xl shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            {activeSeller?.name?.charAt(0) || <User size={18} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Vendedor Activo</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">{activeSeller?.name}</span>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* --- COLUMNA IZQUIERDA: CONFIGURACIÓN (5 cols) --- */}
            <div className="lg:col-span-5 p-10 border-r border-slate-100 dark:border-slate-900 space-y-10 bg-slate-50/40">
              
              {/* 1. FECHA Y NCF - Grid más espaciado y refinado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2 ml-1">
                    <CalendarIcon className="h-3 w-3" /> Fecha de Emisión
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-bold h-14 rounded-2xl border-2 border-slate-200 shadow-none bg-white hover:bg-white hover:border-primary transition-all">
                        {format(invoiceDate, 'dd MMM, yyyy', { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl shadow-2xl border-none" align="start">
                      <Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2 ml-1">
                    <Hash className="h-3 w-3" /> NCF Finales
                  </Label>
                  <div className="flex items-center bg-white rounded-2xl border-2 border-slate-200 h-14 px-4 focus-within:border-primary transition-all group">
                    <span className="text-sm font-black text-primary/50 mr-3 border-r border-slate-100 pr-3 py-1">B01</span>
                    <Input 
                      value={ncfSuffix} 
                      onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} 
                      className="border-0 focus-visible:ring-0 font-mono font-bold text-lg h-full bg-transparent p-0 tracking-[0.25em] w-full" 
                      placeholder="0000" 
                    />
                  </div>
                </div>
              </div>

              {/* 2. CLIENTE - Caja con más aire y mejor radio */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                   Información del Cliente
                </Label>
                <div className="bg-white p-4 rounded-[2rem] border-2 border-slate-100 shadow-sm min-h-[120px] flex flex-col justify-center transition-all hover:border-primary/20">
                    <ClientSelector 
                      clients={clients} 
                      selectedClient={selectedClient} 
                      onSelectClient={setSelectedClient} 
                      onAddClient={onAddClient} 
                    />
                </div>
              </div>

              {/* 3. TOTAL FACTURA - Diseño de impacto premium */}
              <div className="relative pt-2">
                <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] rotate-1 scale-[1.04] -z-10 blur-sm opacity-50" />
                <Card className="border-none shadow-xl rounded-[2.2rem] bg-slate-900 dark:bg-slate-900 overflow-hidden">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Importe Factura
                      </Label>
                      <span className="text-[9px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full">SIN ITBIS</span>
                    </div>
                    <div className="relative group flex items-baseline">
                      <span className="text-3xl font-bold text-slate-500 mr-2">$</span>
                      <Input 
                        value={displayValue} 
                        onChange={e=>{
                          const f = formatInputNumber(e.target.value);
                          setDisplayValue(f);
                          setTotalInvoice(parseFormattedNumber(f));
                        }}
                        className="h-auto text-5xl sm:text-6xl font-black border-none focus:ring-0 bg-transparent text-white placeholder:text-slate-800 tracking-tighter w-full p-0" 
                        placeholder="0.00" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* --- COLUMNA DERECHA: PRODUCTOS (7 cols) --- */}
            <div className="lg:col-span-7 p-10 flex flex-col min-h-[700px]">
              <div className="flex-1 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" /> Desglose por Productos
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">Asigna montos específicos a productos del catálogo</p>
                   </div>
                   <ProductCatalogDialog 
                      products={products} 
                      onUpdateProduct={onUpdateProduct} 
                      onDeleteProduct={onDeleteProduct} 
                      onAddProduct={onAddProduct} 
                   />
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] p-6 border-2 border-dashed border-slate-200 dark:border-slate-800">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
                    {/* Cálculo del Resto - Rediseñado y Margenizado */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between group transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cálculo del Resto</span>
                                <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                            </div>
                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                                {restPercentage}<span className="text-primary text-xl">%</span>
                            </span>
                        </div>
                        <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Monto Restante</p>
                          <p className="text-lg font-black text-slate-700 dark:text-slate-300">${formatNumber(calculations.restAmount)}</p>
                        </div>
                    </div>

                    {/* Comisión Total - Más visual y potente */}
                    <div className="bg-primary p-6 rounded-3xl shadow-2xl shadow-primary/30 flex flex-col justify-between h-full text-white relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest relative z-10">Comisión Total Generada</p>
                        <div className="mt-4 relative z-10">
                          <p className="text-4xl font-black tracking-tighter tabular-nums">
                              ${formatCurrency(calculations.totalCommission)}
                          </p>
                          <p className="text-[10px] font-bold text-white/50 mt-1">Calculado automáticamente</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Botones de Acción - Grandes y Táctiles */}
              <div className="pt-10 mt-10 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row gap-4">
                  <Button 
                      variant="outline" 
                      onClick={handleReset} 
                      className="flex-none h-16 w-full sm:w-20 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-2xl border-2 border-slate-100 transition-all"
                      title="Reiniciar todo"
                  >
                      <Trash2 className="h-7 w-7" />
                      <span className="sm:hidden ml-3 font-black">LIMPIAR TODO</span>
                  </Button>
                  <Button 
                      disabled={!isFormValid}
                      onClick={()=>setShowPreviewDialog(true)}
                      className="flex-1 h-16 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 rounded-2xl font-black text-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
