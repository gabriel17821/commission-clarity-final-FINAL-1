import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, FileText, CalendarIcon, Package, LayoutGrid } from "lucide-react";
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <SaveSuccessAnimation show={showSaveAnimation} onComplete={() => { setShowSaveAnimation(false); onReset(); setDisplayValue(''); setNcfSuffix(''); setActiveProductIds([]); }} />
      <Card className="overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-md">
        <div className="gradient-primary p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3"><Calculator className="h-8 w-8" /><div><h2 className="text-xl font-bold">Calculadora</h2><p className="text-[10px] font-bold uppercase opacity-70 tracking-widest">{activeSeller?.name}</p></div></div>
          <div className="text-right"><p className="text-[10px] font-bold opacity-70 uppercase">Comisión Estimada</p><p className="text-4xl font-black">${formatCurrency(calculations.totalCommission)}</p></div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground">Fecha</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full h-10 border-2 font-bold text-sm"><CalendarIcon className="mr-2 h-4 w-4" />{format(invoiceDate, 'dd/MM/yyyy')}</Button></PopoverTrigger><PopoverContent className="p-0"><Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es}/></PopoverContent></Popover></div>
              <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground">NCF (4 Finales)</Label><div className="flex items-center border-2 rounded-lg h-10 bg-muted/20 px-2"><span className="text-[10px] font-mono text-muted-foreground">B010000</span><Input value={ncfSuffix} onChange={e=>setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))} className="border-0 focus-visible:ring-0 font-mono font-bold text-sm" placeholder="0000" /></div></div>
            </div>
            <div className="space-y-1"><Label className="text-[10px] font-black uppercase text-muted-foreground">Cliente</Label><ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} onAddClient={onAddClient} /></div>
            <div className="space-y-2 pt-2">
              <Label className="text-lg font-bold text-primary">Subtotal de la factura. Antes del 18%</Label>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/50">$</span><Input value={displayValue} onChange={e=>{const f=formatInputNumber(e.target.value); setDisplayValue(f); setTotalInvoice(parseFormattedNumber(f));}} className="h-16 pl-10 text-3xl font-black border-2 border-primary/20 focus:border-primary shadow-sm" placeholder="0.00" /></div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Productos con comisiones variables</h3>
              <ProductCatalogDialog products={products} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} onAddProduct={onAddProduct} />
            </div>
            <ProductManager products={products} activeProductIds={activeProductIds} productAmounts={productAmounts} onProductChange={onProductChange} onAddProductToInvoice={id=>setActiveProductIds(v=>[...new Set([...v, id])])} onRemoveProductFromInvoice={id=>setActiveProductIds(v=>v.filter(x=>x!==id))} onAddProduct={onAddProduct} />
            <div className="mt-4 p-3 bg-background rounded-xl border border-dashed flex justify-between items-center">
              <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold">{restPercentage}%</span><span className="text-[10px] font-bold text-muted-foreground uppercase">RESTO</span></div>
              <div className="flex items-center gap-2 font-bold text-lg">${formatNumber(calculations.restAmount)}<EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} /></div>
            </div>
          </div>
        </div>
        {totalInvoice > 0 && ncfSuffix.length === 4 && selectedClient && (
          <div className="p-6 bg-primary/5 border-t"><Button className="w-full h-14 text-lg font-bold gradient-primary shadow-lg" onClick={()=>setShowPreviewDialog(true)}><FileText className="mr-2 h-5 w-5" /> Revisar y Guardar</Button></div>
        )}
      </Card>
      <InvoicePreviewDialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog} onConfirm={async ()=>{ setShowPreviewDialog(false); setShowSaveAnimation(true); await onSaveInvoice(ncfSuffix, format(invoiceDate, 'yyyy-MM-dd'), selectedClient?.id);}} data={{ ncf: `B010000${ncfSuffix}`, invoiceDate, clientName: selectedClient?.name, totalAmount: totalInvoice, ...calculations, restPercentage }} />
    </div>
  );
};
