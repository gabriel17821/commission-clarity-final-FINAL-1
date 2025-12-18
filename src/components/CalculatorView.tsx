import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, FileText, CalendarIcon, Package, DollarSign, Settings2, LayoutGrid } from "lucide-react";
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

export const CalculatorView = ({
  products, productAmounts, totalInvoice, setTotalInvoice, restPercentage,
  isLoading, onProductChange, onReset, onAddProduct, onUpdateProduct,
  onDeleteProduct, onUpdateRestPercentage, onSaveInvoice, suggestedNcf,
  clients, onAddClient, activeSeller,
}: any) => {
  const [displayValue, setDisplayValue] = useState(totalInvoice > 0 ? formatInputNumber(totalInvoice.toString()) : '');
  const [activeProductIds, setActiveProductIds] = useState<string[]>([]);
  const [ncfSuffix, setNcfSuffix] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);

  useEffect(() => {
    if (suggestedNcf) setNcfSuffix(String(suggestedNcf).padStart(4, '0'));
  }, [suggestedNcf]);

  const calculations = useMemo(() => {
    const breakdown = products.filter((p: any) => activeProductIds.includes(p.id)).map((p: any) => {
      const amt = productAmounts[p.id] || 0;
      return { name: p.name, amount: amt, percentage: p.percentage, commission: amt * (p.percentage / 100), color: p.color };
    });
    const productsTotal = breakdown.reduce((sum: number, item: any) => sum + item.amount, 0);
    const restAmount = Math.max(0, totalInvoice - productsTotal);
    const restCommission = restAmount * (restPercentage / 100);
    const totalCommission = breakdown.reduce((sum: number, item: any) => sum + item.commission, 0) + restCommission;
    return { breakdown, restAmount, restCommission, totalCommission };
  }, [totalInvoice, productAmounts, products, restPercentage, activeProductIds]);

  const handleTotalChange = (e: any) => {
    const formatted = formatInputNumber(e.target.value);
    setDisplayValue(formatted);
    setTotalInvoice(parseFormattedNumber(formatted));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <SaveSuccessAnimation show={showSaveAnimation} onComplete={() => { setShowSaveAnimation(false); onReset(); setDisplayValue(''); setNcfSuffix(''); setActiveProductIds([]); }} />
      
      <Card className="overflow-hidden border-none shadow-2xl bg-background/80 backdrop-blur-xl">
        <div className="gradient-primary p-8 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Calculator className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Calculadora</h2>
                <p className="opacity-80 font-bold uppercase text-[10px] tracking-widest">{activeSeller?.name || 'Vendedor Activo'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">Comisión Estimada</p>
              <p className="text-5xl font-black tracking-tighter">${formatCurrency(calculations.totalCommission)}</p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-12 border-2 font-bold"><CalendarIcon className="mr-2 h-4 w-4" /> {format(invoiceDate, "dd/MM/yyyy")}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={invoiceDate} onSelect={(d) => d && setInvoiceDate(d)} locale={es} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">NCF (4 Finales)</Label>
                <div className="flex items-center border-2 rounded-lg h-12 bg-muted/30 overflow-hidden">
                  <span className="px-3 font-mono font-black text-muted-foreground text-xs">B010000</span>
                  <Input value={ncfSuffix} onChange={(e) => setNcfSuffix(e.target.value.replace(/\D/g, '').slice(0,4))} className="border-0 focus-visible:ring-0 font-mono font-black text-lg" placeholder="0000" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cliente</Label>
              <ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} onAddClient={onAddClient} />
            </div>

            <div className="space-y-3 pt-4">
              <Label className="text-lg font-black text-primary tracking-tight">Subtotal de la factura. Antes del 18%</Label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-4xl font-black text-muted-foreground opacity-40">$</span>
                <Input value={displayValue} onChange={handleTotalChange} className="h-20 pl-12 text-5xl font-black border-4 border-primary/10 focus:border-primary transition-all shadow-inner rounded-2xl" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="bg-muted/40 rounded-3xl p-6 border-2 border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Productos con comisiones variables</h3>
              <ProductCatalogDialog products={products} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} onAddProduct={onAddProduct} />
            </div>
            
            <ProductManager
              products={products} activeProductIds={activeProductIds} productAmounts={productAmounts} onProductChange={onProductChange}
              onAddProductToInvoice={(id: string) => setActiveProductIds(prev => [...new Set([...prev, id])])}
              onRemoveProductFromInvoice={(id: string) => setActiveProductIds(prev => prev.filter(p => p !== id))}
              onAddProduct={onAddProduct}
            />
            
            <div className="mt-6 p-4 bg-background rounded-2xl border-2 border-dashed flex justify-between items-center group">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center font-black text-xs text-secondary-foreground">{restPercentage}%</span>
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">RESTO DE FACTURA</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-xl">${formatNumber(calculations.restAmount)}</span>
                <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
              </div>
            </div>
          </div>
        </div>

        {totalInvoice > 0 && ncfSuffix.length === 4 && selectedClient && (
          <div className="p-8 bg-primary/5 border-t-2 border-primary/10 flex gap-4">
            <Button className="flex-1 h-16 text-xl font-black uppercase tracking-widest gradient-primary shadow-2xl" onClick={() => setShowPreviewDialog(true)}>
              <FileText className="mr-3 h-6 w-6" /> Guardar Factura
            </Button>
          </div>
        )}
      </Card>

      <InvoicePreviewDialog
        open={showPreviewDialog} onOpenChange={setShowPreviewDialog}
        onConfirm={async () => { setShowPreviewDialog(false); setShowSaveAnimation(true); await onSaveInvoice(`${ncfSuffix}`, format(invoiceDate, 'yyyy-MM-dd'), selectedClient?.id); }}
        loading={false} data={{ ncf: `B010000${ncfSuffix}`, invoiceDate, clientName: selectedClient?.name, totalAmount: totalInvoice, ...calculations, restPercentage }}
      />
    </div>
  );
};
