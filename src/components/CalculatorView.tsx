import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, FileText, CalendarIcon, Package, Trash2, Save, User, Hash, DollarSign } from "lucide-react";
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
    <div className="container max-w-6xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { setShowSaveAnimation(false); handleReset(); }} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Calculadora</h2>
          <p className="text-muted-foreground font-medium">Gestiona las comisiones y desglose de facturas.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-full border shadow-sm">
          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shadow-md">
            {activeSeller?.name?.charAt(0) || <User size={14} />}
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{activeSeller?.name}</span>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2rem]">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* --- COLUMNA IZQUIERDA: INPUTS --- */}
            <div className="lg:col-span-7 space-y-8">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3 text-primary" /> Fecha Factura
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(
                        "w-full justify-start text-left font-bold h-12 rounded-xl border-slate-200 hover:bg-slate-50 transition-all",
                        !invoiceDate && "text-muted-foreground"
                      )}>
                        {format(invoiceDate, 'PPP', { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-none" align="start">
                      <Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Hash className="h-3 w-3 text-primary" /> NCF (4 Finales)
                  </Label>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 h-12 px-4 focus-within:ring-2 ring-primary/20 transition-all">
                    <span className="text-xs font-mono font-black text-slate-400 mr-2 border-r pr-3 py-1">B010000</span>
                    <Input 
                      value={ncfSuffix} 
                      onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} 
                      className="border-0 focus-visible:ring-0 font-mono font-bold text-lg h-full bg-transparent p-0 tracking-widest" 
                      placeholder="0000" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3 text-primary" /> Cliente
                </Label>
                <ClientSelector 
                  clients={clients} 
                  selectedClient={selectedClient} 
                  onSelectClient={setSelectedClient} 
                  onAddClient={onAddClient} 
                />
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary"/> Subtotal de la factura</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">Antes de ITBIS</span>
                </Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300 group-focus-within:text-primary transition-colors">$</span>
                  <Input 
                    value={displayValue} 
                    onChange={e=>{
                      const f = formatInputNumber(e.target.value);
                      setDisplayValue(f);
                      setTotalInvoice(parseFormattedNumber(f));
                    }}
                    className="h-20 pl-12 text-5xl font-black border-2 border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl bg-slate-50/50 tracking-tight" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
            </div>

            {/* --- COLUMNA DERECHA --- */}
            <div className="lg:col-span-5 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-[2rem] border border-slate-100 p-6">
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" /> Productos
                   </h3>
                   <ProductCatalogDialog 
                      products={products} 
                      onUpdateProduct={onUpdateProduct} 
                      onDeleteProduct={onDeleteProduct} 
                      onAddProduct={onAddProduct} 
                   />
                </div>

                <div className="space-y-3">
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

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Resto ({restPercentage}%)</span>
                      <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                      ${formatNumber(calculations.restAmount)}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 shadow-sm mt-4">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comisión Total</p>
                         <p className="text-3xl font-black text-primary tracking-tight tabular-nums">
                           ${formatCurrency(calculations.totalCommission)}
                         </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={handleReset} 
                        className="text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8"
                      >
                        <Trash2 size={16} />
                      </Button>
                   </div>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  disabled={!isFormValid}
                  onClick={()=>setShowPreviewDialog(true)}
                  className="w-full h-14 text-lg font-black shadow-lg shadow-primary/20 transition-all gradient-primary rounded-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="mr-2 h-5 w-5" /> Revisar y Guardar
                </Button>
                {!isFormValid && (
                  <p className="text-center text-[10px] text-muted-foreground font-bold uppercase mt-3 animate-pulse">
                    Faltan datos requeridos
                  </p>
                )}
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
