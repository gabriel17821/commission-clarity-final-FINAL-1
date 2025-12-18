import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Trash2, Save, User, DollarSign, CalendarIcon, Hash } from "lucide-react";
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
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
      <SaveSuccessAnimation 
        show={showSaveAnimation} 
        onComplete={() => { setShowSaveAnimation(false); handleReset(); }} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calculadora de Comisiones</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de facturación y cálculo de comisiones</p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {activeSeller?.name?.charAt(0) || <User size={16} />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vendedor</p>
            <p className="text-sm font-semibold text-foreground">{activeSeller?.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Configuration */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Date & NCF */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Fecha
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left font-medium h-10"
                      >
                        {format(invoiceDate, 'dd MMM, yyyy', { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={invoiceDate} 
                        onSelect={(d) => d && setInvoiceDate(d)} 
                        locale={es} 
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* NCF Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    NCF
                  </Label>
                  <div className="flex items-center h-10 bg-background border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                    <span className="px-3 text-sm font-medium text-muted-foreground bg-muted border-r border-input">
                      B010000
                    </span>
                    <Input 
                      value={ncfSuffix} 
                      onChange={e => setNcfSuffix(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                      className="border-0 focus-visible:ring-0 font-mono font-semibold text-sm h-full rounded-none" 
                      placeholder="0000" 
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ClientSelector 
                clients={clients} 
                selectedClient={selectedClient} 
                onSelectClient={setSelectedClient} 
                onAddClient={onAddClient} 
              />
            </CardContent>
          </Card>

          {/* Invoice Total */}
          <Card className="bg-foreground text-background overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-background/70 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Factura
                </Label>
                <span className="text-xs font-medium text-background/50 bg-background/10 px-2 py-1 rounded">
                  Sin ITBIS
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-background/60">$</span>
                <Input 
                  value={displayValue} 
                  onChange={e => {
                    const f = formatInputNumber(e.target.value);
                    setDisplayValue(f);
                    setTotalInvoice(parseFormattedNumber(f));
                  }}
                  className="h-auto text-4xl font-bold border-none focus-visible:ring-0 bg-transparent text-background placeholder:text-background/30 p-0 w-full" 
                  placeholder="0.00" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Products */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Products Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Desglose por Productos
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Asigna montos a productos del catálogo</p>
                </div>
                <ProductCatalogDialog 
                  products={products} 
                  onUpdateProduct={onUpdateProduct} 
                  onDeleteProduct={onDeleteProduct} 
                  onAddProduct={onAddProduct} 
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border min-h-[180px]">
                <ProductManager 
                  products={products} 
                  activeProductIds={activeProductIds} 
                  productAmounts={productAmounts} 
                  onProductChange={onProductChange} 
                  onAddProductToInvoice={id => setActiveProductIds(v => [...new Set([...v, id])])} 
                  onRemoveProductFromInvoice={id => setActiveProductIds(v => v.filter(x => x !== id))} 
                  onAddProduct={onAddProduct} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Calculations Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rest Calculation */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resto</p>
                    <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                  </div>
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {restPercentage}<span className="text-primary text-lg">%</span>
                  </span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Monto Restante</p>
                  <p className="text-base font-semibold text-foreground">${formatNumber(calculations.restAmount)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Total Commission */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-5 h-full flex flex-col justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
                  Comisión Total
                </p>
                <div className="mt-3">
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    ${formatCurrency(calculations.totalCommission)}
                  </p>
                  <p className="text-xs text-primary-foreground/60 mt-1">Cálculo automático</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="h-12 px-5 gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              title="Reiniciar"
            >
              <Trash2 className="h-5 w-5" />
              <span className="sm:hidden">Limpiar</span>
            </Button>
            <Button 
              disabled={!isFormValid}
              onClick={() => setShowPreviewDialog(true)}
              className="flex-1 h-12 gap-2 text-base font-semibold shadow-lg"
            >
              <Save className="h-5 w-5" />
              Guardar Factura
            </Button>
          </div>
        </div>
      </div>

      <InvoicePreviewDialog 
        open={showPreviewDialog} 
        onOpenChange={setShowPreviewDialog} 
        onConfirm={async () => { 
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
