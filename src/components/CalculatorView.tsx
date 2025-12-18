import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Calculator, Check, Package, CalendarIcon, FileText, CheckCircle2, User, Save, RefreshCw, DollarSign } from "lucide-react";
import { EditRestPercentageDialog } from "@/components/EditRestPercentageDialog";
import { BreakdownTable } from "@/components/BreakdownTable";
import { ProductManager } from "@/components/ProductManager";
import { ProductCatalogDialog } from "@/components/ProductCatalogDialog";
import { ClientSelector } from "@/components/ClientSelector";
import { SaveSuccessAnimation } from "@/components/SaveSuccessAnimation";
import { InvoicePreviewDialog } from "@/components/InvoicePreviewDialog";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Invoice } from "@/hooks/useInvoices";
import { Client } from "@/hooks/useClients";
import { Seller } from "@/hooks/useSellers";
import { useDraftPersistence } from "@/hooks/useDraftPersistence";

interface Product {
  id: string;
  name: string;
  percentage: number;
  color: string;
  is_default: boolean;
}

interface Breakdown {
  name: string;
  label: string;
  amount: number;
  percentage: number;
  commission: number;
  color: string;
}

interface Calculations {
  breakdown: Breakdown[];
  restAmount: number;
  restCommission: number;
  totalCommission: number;
}

interface CalculatorViewProps {
  products: Product[];
  productAmounts: Record<string, number>;
  totalInvoice: number;
  setTotalInvoice: (value: number) => void;
  calculations: Calculations;
  restPercentage: number;
  isLoading: boolean;
  onProductChange: (id: string, value: number) => void;
  onReset: () => void;
  onAddProduct: (name: string, percentage: number) => Promise<any>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: string) => void;
  onUpdateRestPercentage: (value: number) => Promise<boolean>;
  onSaveInvoice: (ncf: string, invoiceDate: string, clientId?: string) => Promise<any>;
  suggestedNcf?: number | null;
  lastInvoice?: Invoice;
  clients: Client[];
  onAddClient: (name: string, phone?: string, email?: string) => Promise<Client | null>;
  onDeleteClient?: (id: string) => Promise<boolean>;
  activeSeller?: Seller | null;
}

export const CalculatorView = ({
  products,
  productAmounts,
  totalInvoice,
  setTotalInvoice,
  // calculations, // Ignoramos la prop calculations externa para recalcularla aquí con la lógica correcta
  restPercentage,
  isLoading,
  onProductChange,
  onReset,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateRestPercentage,
  onSaveInvoice,
  suggestedNcf,
  lastInvoice,
  clients,
  onAddClient,
  onDeleteClient,
  activeSeller,
}: CalculatorViewProps) => {
  const [displayValue, setDisplayValue] = useState(totalInvoice > 0 ? formatNumber(totalInvoice) : '');
  const [activeProductIds, setActiveProductIds] = useState<string[]>([]);
  
  const [ncfSuffix, setNcfSuffix] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [step1Complete, setStep1Complete] = useState(false);
  const [step2Complete, setStep2Complete] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toastShownRef = useRef(false);
  const draftRecoveryShownRef = useRef(false);

  const ncfPrefix = 'B010000';

  // --- LÓGICA DE CÁLCULO CORREGIDA (INCLUSIVE) ---
  const calculations = useMemo(() => {
    // 1. Calcular desglose de productos activos
    const breakdown = products
      .filter(p => activeProductIds.includes(p.id)) // Solo productos activos
      .map((product) => ({
        name: product.name,
        label: product.name,
        amount: productAmounts[product.id] || 0,
        percentage: product.percentage,
        commission: (productAmounts[product.id] || 0) * (product.percentage / 100),
        color: product.color,
      }));

    // 2. Sumar total de productos especiales
    const specialProductsTotal = breakdown.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // 3. Calcular Resto: Total Factura - Productos
    // Si los productos superan el total, el resto es 0
    const restAmount = Math.max(0, totalInvoice - specialProductsTotal);
    
    // 4. Calcular comisión del resto
    const restCommission = restAmount * (restPercentage / 100);

    // 5. Total Comisiones
    const totalCommission =
      breakdown.reduce((sum, item) => sum + item.commission, 0) + restCommission;

    return { breakdown, restAmount, restCommission, totalCommission };
  }, [totalInvoice, productAmounts, products, restPercentage, activeProductIds]);
  
  // Draft persistence
  const { 
    recoveredDraft, 
    showRecoveryPrompt, 
    saveDraft, 
    clearDraft, 
    acceptRecovery 
  } = useDraftPersistence();

  const hasDraft = step1Complete || step2Complete || totalInvoice > 0;

  // Recovery effect
  useEffect(() => {
    if (showRecoveryPrompt && recoveredDraft && !draftRecoveryShownRef.current) {
      draftRecoveryShownRef.current = true;
      toast.custom((t) => (
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/80 dark:border-violet-700 rounded-2xl shadow-2xl p-5 w-[440px] max-w-[calc(100vw-2rem)] border-2 border-violet-300">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-violet-500 flex items-center justify-center text-white shrink-0">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-violet-900 dark:text-violet-100">Borrador Encontrado</p>
              <p className="text-sm text-violet-700 dark:text-violet-300">¿Deseas restaurar la factura pendiente?</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button size="sm" variant="outline" onClick={() => { clearDraft(); toast.dismiss(t); }} className="flex-1">Descartar</Button>
            <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => {
              const draft = acceptRecovery();
              if (draft) {
                setNcfSuffix(draft.ncfSuffix);
                setInvoiceDate(new Date(draft.invoiceDate));
                setTotalInvoice(draft.totalInvoice);
                setDisplayValue(draft.totalInvoice > 0 ? formatNumber(draft.totalInvoice) : '');
                setStep1Complete(draft.step1Complete);
                setStep2Complete(draft.step2Complete);
                
                const activeIds = Object.keys(draft.productAmounts).filter(id => draft.productAmounts[id] >= 0);
                setActiveProductIds(activeIds);
                
                Object.entries(draft.productAmounts).forEach(([id, amount]) => {
                  onProductChange(id, amount);
                });
                
                if (draft.selectedClientId) {
                  const client = clients.find(c => c.id === draft.selectedClientId);
                  if (client) setSelectedClient(client);
                }
              }
              toast.dismiss(t);
            }}>Recuperar</Button>
          </div>
        </div>
      ), { duration: Infinity, id: 'draft-recovery' });
    }
  }, [showRecoveryPrompt, recoveredDraft, acceptRecovery, clearDraft, clients, onProductChange, setTotalInvoice]);

  useEffect(() => {
    if (hasDraft) {
      saveDraft({
        ncfSuffix,
        invoiceDate: invoiceDate.toISOString(),
        selectedClientId: selectedClient?.id || null,
        totalInvoice,
        productAmounts,
        step1Complete,
        step2Complete,
      });
    }
  }, [ncfSuffix, invoiceDate, selectedClient, totalInvoice, productAmounts, step1Complete, step2Complete, hasDraft, saveDraft, activeProductIds]);

  useEffect(() => {
    if (suggestedNcf !== null && suggestedNcf !== undefined) {
      setNcfSuffix(String(suggestedNcf).padStart(4, '0'));
    }
  }, [suggestedNcf]);

  // Manejo de productos en la factura
  const handleAddProductToInvoice = (id: string) => {
    if (!activeProductIds.includes(id)) {
      setActiveProductIds(prev => [...prev, id]);
      onProductChange(id, 0);
      toast.success("Producto agregado a la factura");
    }
  };

  const handleRemoveProductFromInvoice = (id: string) => {
    setActiveProductIds(prev => prev.filter(pid => pid !== id));
    onProductChange(id, 0);
  };

  // --- CORRECCIÓN SOPORTE DECIMAL ---
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir dígitos y un solo punto decimal
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    
    // Evitar múltiples puntos
    if ((raw.match(/\./g) || []).length > 1) return;

    // Actualizar valor visual inmediatamente para permitir escritura fluida (ej. "100.")
    setDisplayValue(raw);

    // Actualizar valor numérico solo si es válido
    if (raw === '' || raw === '.') {
      setTotalInvoice(0);
    } else {
      setTotalInvoice(parseFloat(raw));
    }
  };

  const handleReset = useCallback(() => {
    setDisplayValue('');
    setNcfSuffix('');
    setInvoiceDate(new Date());
    setSelectedClient(null);
    setStep1Complete(false);
    setStep2Complete(false);
    setActiveProductIds([]);
    onReset();
    clearDraft();
    toastShownRef.current = false;
  }, [onReset, clearDraft]);

  const handleNcfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setNcfSuffix(value);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setShowPreviewDialog(false);
    setShowSaveAnimation(true);
    const fullNcf = `${ncfPrefix}${ncfSuffix.padStart(4, '0')}`;
    await onSaveInvoice(fullNcf, format(invoiceDate, 'yyyy-MM-dd'), selectedClient?.id);
    clearDraft();
    setIsSaving(false);
  };

  const handleAnimationComplete = useCallback(() => {
    setShowSaveAnimation(false);
    handleReset();
  }, [handleReset]);

  const fullNcf = `${ncfPrefix}${ncfSuffix.padStart(4, '0')}`;
  const hasResult = totalInvoice > 0;
  const showBreakdown = step1Complete && step2Complete && hasResult;

  return (
    <div className="animate-fade-in">
      <SaveSuccessAnimation show={showSaveAnimation} onComplete={handleAnimationComplete} />
      
      <div className={`grid gap-6 ${showBreakdown ? 'lg:grid-cols-2' : 'max-w-xl mx-auto'}`}>
        <Card className="overflow-hidden card-shadow hover-lift">
          <div className="gradient-primary px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-primary-foreground">Calculadora</h1>
                  <p className="text-primary-foreground/70 text-sm">
                    {activeSeller ? `Comisiones de ${activeSeller.name}` : 'Calcula tu ganancia'}
                  </p>
                </div>
              </div>
              {hasDraft && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/20 animate-pulse">
                  <Save className="h-3.5 w-3.5 text-primary-foreground" />
                  <span className="text-xs font-medium text-primary-foreground">Borrador</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 1: Datos */}
          <div className="border-b border-border">
            <div className="p-5">
              <div className={`flex items-center gap-2 mb-4 ${step1Complete ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => step1Complete && setStep1Complete(false)}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step1Complete ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {step1Complete ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <h3 className="font-semibold text-foreground">Datos de la Factura</h3>
                {step1Complete && (
                  <span className="ml-auto text-xs text-success flex items-center gap-1 font-medium bg-success/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {fullNcf}
                  </span>
                )}
              </div>
              {!step1Complete && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !invoiceDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceDate ? format(invoiceDate, "d 'de' MMMM, yyyy", { locale: es }) : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={invoiceDate} onSelect={(date) => date && setInvoiceDate(date)} initialFocus locale={es} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>NCF (últimos 4)</Label>
                    <div className="flex items-center rounded-lg border border-border bg-muted/30 overflow-hidden">
                      <span className="px-3 py-2.5 text-base font-mono font-medium text-muted-foreground bg-muted border-r border-border">{ncfPrefix}</span>
                      <Input value={ncfSuffix} onChange={handleNcfChange} placeholder="0000" className="border-0 text-base font-mono font-bold text-center focus-visible:ring-0 h-11" maxLength={4} inputMode="numeric" />
                    </div>
                  </div>
                  <Button onClick={() => setStep1Complete(true)} disabled={ncfSuffix.length !== 4} className="w-full h-11 gradient-primary">Continuar</Button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Cliente */}
          {step1Complete && (
            <div className="border-b border-border animate-in slide-in-from-bottom-2">
              <div className="p-5">
                <div className={`flex items-center gap-2 mb-4 ${step2Complete ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => step2Complete && setStep2Complete(false)}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step2Complete ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'}`}>
                    {step2Complete ? <Check className="h-4 w-4" /> : '2'}
                  </div>
                  <h3 className="font-semibold text-foreground">Cliente</h3>
                  {step2Complete && selectedClient && (
                    <span className="ml-auto text-xs text-success flex items-center gap-1 font-medium bg-success/10 px-2 py-1 rounded-full">
                      <User className="h-3.5 w-3.5" /> {selectedClient.name}
                    </span>
                  )}
                </div>
                {!step2Complete && (
                  <div className="space-y-4">
                    <ClientSelector clients={clients} selectedClient={selectedClient} onSelectClient={setSelectedClient} onAddClient={onAddClient} onDeleteClient={onDeleteClient} />
                    <Button onClick={() => setStep2Complete(true)} disabled={!selectedClient} className="w-full h-11 gradient-primary">Continuar</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Montos */}
          {step1Complete && step2Complete && (
            <>
              <div className="p-5 border-b border-border animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${hasResult ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'}`}>
                    {hasResult ? <Check className="h-4 w-4" /> : '3'}
                  </div>
                  <h3 className="font-semibold text-foreground">Total de la Factura</h3>
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">$</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    value={displayValue} 
                    onChange={handleTotalChange} 
                    className="w-full h-14 pl-9 pr-4 text-2xl font-bold rounded-lg border bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              {hasResult && (
                <div className="border-b border-border">
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center">
                          <Package className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Productos Variables</h3>
                      </div>
                      <ProductCatalogDialog 
                        products={products}
                        onUpdateProduct={onUpdateProduct}
                        onDeleteProduct={onDeleteProduct}
                        onAddProduct={onAddProduct}
                      />
                    </div>
                    
                    {isLoading ? (
                      <div className="h-12 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <ProductManager
                        products={products}
                        activeProductIds={activeProductIds}
                        productAmounts={productAmounts}
                        onProductChange={onProductChange}
                        onAddProductToInvoice={handleAddProductToInvoice}
                        onRemoveProductFromInvoice={handleRemoveProductFromInvoice}
                        onAddProduct={onAddProduct}
                      />
                    )}
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {restPercentage}%
                        </span>
                        <span className="text-muted-foreground">Resto (Total - Productos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">${formatNumber(calculations.restAmount)}</span>
                        <EditRestPercentageDialog currentValue={restPercentage} onUpdate={onUpdateRestPercentage} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasResult && (
                <div className="p-5 gradient-success lg:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-success-foreground/80 mb-0.5">Comisión total</p>
                      <p className="text-3xl font-bold text-success-foreground">${formatCurrency(calculations.totalCommission)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-success-foreground/20 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-success-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {showBreakdown && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
            <BreakdownTable 
              totalInvoice={totalInvoice} 
              breakdown={calculations.breakdown} 
              restAmount={calculations.restAmount} 
              restPercentage={restPercentage} 
              restCommission={calculations.restCommission} 
              totalCommission={calculations.totalCommission} 
            />
            <div className="flex gap-3 animate-slide-up">
              <Button className="flex-1 gap-2 h-12 text-base gradient-primary" disabled={totalInvoice === 0} onClick={() => setShowPreviewDialog(true)}>
                <FileText className="h-5 w-5" /> Guardar Factura
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2 h-11 flex-1">
                <RotateCcw className="h-4 w-4" /> Limpiar
              </Button>
            </div>
            
            <InvoicePreviewDialog
              open={showPreviewDialog}
              onOpenChange={setShowPreviewDialog}
              onConfirm={handleConfirmSave}
              loading={isSaving}
              data={{
                ncf: fullNcf,
                invoiceDate: invoiceDate,
                clientName: selectedClient?.name || null,
                totalAmount: totalInvoice,
                breakdown: calculations.breakdown,
                restAmount: calculations.restAmount,
                restPercentage: restPercentage,
                restCommission: calculations.restCommission,
                totalCommission: calculations.totalCommission,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};