import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container max-w-5xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { setShowSaveAnimation(false); handleReset(); }} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Calculadora</h2>
          <p className="text-muted-foreground">Gestiona las comisiones y desglose de facturas.</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-full border">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {activeSeller?.name?.charAt(0) || <User size={16} />}
          </div>
          <span className="text-sm font-medium">{activeSeller?.name}</span>
        </div>
      </div>

      <Card className="border shadow-sm bg-card">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Columna Izquierda: Entradas (Inputs) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Bloque 1: Fecha y NCF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" /> Fecha Factura
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(
                        "w-full justify-start text-left font-medium h-11 px-4",
                        !invoiceDate && "text-muted-foreground"
                      )}>
                        {format(invoiceDate, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={invoiceDate} onSelect={(d)=>d && setInvoiceDate(d)} locale={es} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Hash className="h-3 w-3" /> NCF (Últimos 4)
                  </Label>
                  <div className="flex h-11 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring">
                    <div className="flex items-center border-r pr-3 mr-3 select-none">
                      <span className="text-xs font-mono font-medium text-muted-foreground">B010000</span>
                    </div>
                    <input
                      className="flex h-full w-full rounded-md bg-transparent px-0 py-2 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="0000"
                      value={ncfSuffix}
                      onChange={e => setNcfSuffix(e.target.value.replace(/\D/g,'').slice(0,4))}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Cliente */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="h-3 w-3" /> Cliente
                </Label>
                <ClientSelector 
                  clients={clients} 
                  selectedClient={selectedClient} 
                  onSelectClient={setSelectedClient} 
                  onAddClient={onAddClient} 
                />
              </div>

              <Separator />

              {/* Bloque 3: Monto Principal (Subtotal) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>Subtotal de la factura</span>
                  <span className="text-xs font-normal text-muted-foreground">(Antes de impuestos)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/60">$</span>
                  <Input 
                    value={displayValue} 
                    onChange={e=>{
                      const f = formatInputNumber(e.target.value);
                      setDisplayValue(f);
                      setTotalInvoice(parseFormattedNumber(f));
                    }}
                    className="h-16 pl-10 text-3xl font-bold border-input bg-background shadow-sm placeholder:text-muted-foreground/30 focus-visible:ring-1" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Desglose y Acciones */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="flex-1 space-y-6">
                
                {/* Panel de Productos */}
                <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" /> Productos Variables
                    </h3>
                    <ProductCatalogDialog 
                      products={products} 
                      onUpdateProduct={onUpdateProduct} 
                      onDeleteProduct={onDeleteProduct} 
                      onAddProduct={onAddProduct} 
                    />
                  </div>
                  
                  {/* Lista de productos sin scroll innecesario */}
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
                </div>

                {/* Panel del Resto - Justificado Horizontalmente */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center h-10 w-12 bg-secondary rounded-md border">
                      <span className="text-sm font-bold">{restPercentage}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Resto</span>
                      <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-foreground tabular-nums tracking-tight">
                      ${formatNumber(calculations.restAmount)}
                    </span>
                  </div>
                </div>

                {/* Resumen Final */}
                <div className="flex items-end justify-between py-2 px-1">
                   <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Comisión Total</p>
                      <p className="text-3xl font-black text-primary tracking-tight tabular-nums">
                        ${formatCurrency(calculations.totalCommission)}
                      </p>
                   </div>
                   <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleReset} 
                      className="text-muted-foreground hover:text-destructive h-auto py-1"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Limpiar
                    </Button>
                </div>
              </div>

              {/* Botón de Guardado */}
              <div className="mt-8 pt-6 border-t">
                <Button 
                  disabled={!isFormValid}
                  onClick={()=>setShowPreviewDialog(true)}
                  className="w-full h-12 text-base font-bold shadow-md transition-all gradient-primary"
                >
                  <Save className="mr-2 h-4 w-4" /> Revisar y Guardar
                </Button>
                {!isFormValid && (
                  <p className="text-center text-[10px] text-muted-foreground font-medium uppercase mt-3">
                    Completa todos los campos requeridos
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
