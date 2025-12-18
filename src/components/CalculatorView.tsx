import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, Check, Package, CalendarIcon, FileText, User, RefreshCw, DollarSign, ArrowRight } from "lucide-react";
import { ProductManager } from "@/components/ProductManager";
import { ClientSelector } from "@/components/ClientSelector";
import { SaveSuccessAnimation } from "@/components/SaveSuccessAnimation";
import { InvoicePreviewDialog } from "@/components/InvoicePreviewDialog";
import { formatNumber, formatCurrency, formatInputNumber, parseFormattedNumber } from "@/lib/formatters";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDraftPersistence } from "@/hooks/useDraftPersistence";

export const CalculatorView = ({
  products,
  productAmounts,
  totalInvoice,
  setTotalInvoice,
  restPercentage,
  onProductChange,
  onReset,
  onSaveInvoice,
  suggestedNcf,
  clients,
  onAddClient,
  activeSeller,
}: any) => {
  const [displayValue, setDisplayValue] = useState(totalInvoice > 0 ? formatInputNumber(totalInvoice.toString()) : '');
  const [activeProductIds, setActiveProductIds] = useState<string[]>([]);
  const [ncfSuffix, setNcfSuffix] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  const ncfPrefix = 'B010000';

  // LÓGICA DE CÁLCULO BLINDADA: El Total es la verdad absoluta.
  const calculations = useMemo(() => {
    const breakdown = products
      .filter((p: any) => activeProductIds.includes(p.id))
      .map((p: any) => {
        const amt = productAmounts[p.id] || 0;
        return {
          name: p.name,
          amount: amt,
          percentage: p.percentage,
          commission: amt * (p.percentage / 100),
          color: p.color
        };
      });

    const productsTotal = breakdown.reduce((sum: number, item: any) => sum + item.amount, 0);
    // El resto NUNCA infla el total, se deriva de él.
    const restAmount = Math.max(0, totalInvoice - productsTotal);
    const restCommission = restAmount * (restPercentage / 100);
    const totalCommission = breakdown.reduce((sum: number, item: any) => sum + item.commission, 0) + restCommission;

    return { breakdown, restAmount, restCommission, totalCommission };
  }, [totalInvoice, productAmounts, products, restPercentage, activeProductIds]);

  // Manejo de Borradores Corregido (Solo productos del borrador)
  const { recoveredDraft, showRecoveryPrompt, saveDraft, clearDraft, acceptRecovery } = useDraftPersistence();

  useEffect(() => {
    if (showRecoveryPrompt && recoveredDraft) {
      toast("Borrador encontrado", {
        description: "¿Deseas restaurar los datos de la factura pendiente?",
        action: {
          label: "Restaurar",
          onClick: () => {
            const draft = acceptRecovery();
            if (draft) {
              setTotalInvoice(draft.totalInvoice);
              setDisplayValue(formatInputNumber(draft.totalInvoice.toString()));
              setNcfSuffix(draft.ncfSuffix);
              setInvoiceDate(new Date(draft.invoiceDate));
              // Filtrar solo los productos que tenían monto en el borrador
              const ids = Object.keys(draft.productAmounts).filter(id => draft.productAmounts[id] > 0);
              setActiveProductIds(ids);
              Object.entries(draft.productAmounts).forEach(([id, amt]: any) => onProductChange(id, amt));
            }
          }
        }
      });
    }
  }, [showRecoveryPrompt]);

  const handleTotalChange = (e: any) => {
    const formatted = formatInputNumber(e.target.value);
    setDisplayValue(formatted);
    setTotalInvoice(parseFormattedNumber(formatted));
  };

  const handleSave = async () => {
    const fullNcf = `${ncfPrefix}${ncfSuffix.padStart(4, '0')}`;
    setShowSaveAnimation(true);
    await onSaveInvoice(fullNcf, format(invoiceDate, 'yyyy-MM-dd'), selectedClient?.id);
    clearDraft();
    onReset();
    setDisplayValue('');
    setNcfSuffix('');
    setActiveProductIds([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SaveSuccessAnimation show={showSaveAnimation} onComplete={() => setShowSaveAnimation(false)} />
      
      <Card className="overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-md">
        <div className="gradient-primary p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">Calculadora de Ganancias</h2>
                <p className="opacity-80 text-sm">{activeSeller?.name || 'Vendedor'}</p>
              </div>
            </div>
            {totalInvoice > 0 && (
              <div className="text-right">
                <p className="text-xs opacity-70 uppercase tracking-widest">Comisión Estimada</p>
                <p className="text-3xl font-black">${formatCurrency(calculations.totalCommission)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Datos */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-11 border-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(invoiceDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={invoiceDate} onSelect={(d) => d && setInvoiceDate(d)} locale={es} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">NCF (4 Finales)</Label>
                <div className="flex items-center border-2 rounded-md h-11 bg-muted/20">
                  <span className="px-2 text-xs font-mono text-muted-foreground">{ncfPrefix}</span>
                  <Input 
                    value={ncfSuffix} 
                    onChange={(e) => setNcfSuffix(e.target.value.replace(/\D/g, '').slice(0,4))} 
                    className="border-0 focus-visible:ring-0 font-mono font-bold" 
                    placeholder="0000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Cliente</Label>
              <ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} onAddClient={onAddClient} />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-bold text-primary">Subtotal de la factura (antes del 18%)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                <Input 
                  value={displayValue} 
                  onChange={handleTotalChange} 
                  className="h-16 pl-10 text-3xl font-black border-2 border-primary/20 focus:border-primary transition-all" 
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Productos */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Package className="h-4 w-4" /> Productos Especiales</h3>
            </div>
            <ProductManager
              products={products}
              activeProductIds={activeProductIds}
              productAmounts={productAmounts}
              onProductChange={onProductChange}
              onAddProductToInvoice={(id: string) => setActiveProductIds(prev => [...new Set([...prev, id])])}
              onRemoveProductFromInvoice={(id: string) => setActiveProductIds(prev => prev.filter(p => p !== id))}
            />
            
            <div className="mt-4 p-3 bg-background rounded-lg border flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">Resto al {restPercentage}%:</span>
              <span className="font-bold">${formatNumber(calculations.restAmount)}</span>
            </div>
          </div>
        </div>

        {totalInvoice > 0 && ncfSuffix.length === 4 && selectedClient && (
          <div className="p-6 bg-primary/5 border-t flex gap-4">
            <Button className="flex-1 h-14 text-lg font-bold gradient-primary shadow-lg" onClick={() => setShowPreviewDialog(true)}>
              <FileText className="mr-2 h-5 w-5" /> Revisar y Guardar
            </Button>
            <Button variant="outline" className="h-14 px-6 border-2" onClick={onReset}>Limpiar</Button>
          </div>
        )}
      </Card>

      <InvoicePreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        onConfirm={handleSave}
        data={{
          ncf: `${ncfPrefix}${ncfSuffix}`,
          invoiceDate,
          clientName: selectedClient?.name,
          totalAmount: totalInvoice,
          ...calculations
        }}
      />
    </div>
  );
};
