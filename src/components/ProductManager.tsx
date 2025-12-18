import { useState, useRef, useEffect } from 'react';
import { formatNumber } from '@/lib/formatters';
import { Trash2, Plus, Search, X, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductInput } from '@/components/ProductInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  percentage: number;
  color: string;
  is_default: boolean;
}

interface ProductManagerProps {
  products: Product[];
  activeProductIds: string[];
  productAmounts: Record<string, number>;
  onProductChange: (id: string, value: number) => void;
  onAddProductToInvoice: (id: string) => void;
  onRemoveProductFromInvoice: (id: string) => void;
  onAddProduct: (name: string, percentage: number) => Promise<any>;
}

export const ProductManager = ({
  products,
  activeProductIds,
  productAmounts,
  onProductChange,
  onAddProductToInvoice,
  onRemoveProductFromInvoice,
  onAddProduct,
}: ProductManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPercentage, setNewProductPercentage] = useState(15);
  const [addLoading, setAddLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCatalog = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !activeProductIds.includes(p.id)
  );

  const activeProductsList = activeProductIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => !!p);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (productId: string) => {
    onAddProductToInvoice(productId);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newProductName.trim()) return;
    
    setAddLoading(true);
    const newProduct = await onAddProduct(newProductName.trim(), newProductPercentage);
    setAddLoading(false);
    
    if (newProduct) {
      onAddProductToInvoice(newProduct.id);
      setNewProductName('');
      setNewProductPercentage(15);
      setShowAddDialog(false);
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setNewProductName(searchTerm);
    setShowAddDialog(true);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar en catálogo o crear..."
            className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {showSuggestions && searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95">
            {filteredCatalog.length > 0 ? (
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Catálogo
                </div>
                {filteredCatalog.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span 
                      className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0"
                      style={{ backgroundColor: product.color }}
                    >
                      {product.percentage}%
                    </span>
                    <span className="text-sm font-medium text-foreground flex-1">{product.name}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No encontrado en catálogo</p>
              </div>
            )}
            
            <div className="border-t border-border p-1">
              <button
                onClick={handleOpenCreateDialog}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/10 rounded-lg transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-primary block">Crear "{searchTerm}"</span>
                  <span className="text-xs text-muted-foreground">Guardar en catálogo y agregar a factura</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {activeProductsList.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No has agregado productos a esta factura</p>
            <p className="text-xs text-muted-foreground mt-1">Busca arriba para añadir líneas</p>
          </div>
        ) : (
          <div className="grid gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
            {activeProductsList.map((product) => (
              <ProductInput
                key={product.id}
                label={product.name}
                percentage={product.percentage}
                color={product.color}
                value={productAmounts[product.id] || 0}
                onChange={(val) => onProductChange(product.id, val)}
                canDelete={true}
                onDelete={() => onRemoveProductFromInvoice(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre del Producto</Label>
              <Input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Ej: Vitamina C"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Porcentaje de Comisión (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newProductPercentage}
                onChange={(e) => setNewProductPercentage(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateAndAdd} 
                disabled={addLoading || !newProductName.trim()}
                className="gradient-primary"
              >
                {addLoading ? 'Guardando...' : 'Guardar y Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};