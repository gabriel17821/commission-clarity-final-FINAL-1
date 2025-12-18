import { useState, useRef, useEffect, useMemo } from 'react';
import { formatNumber } from '@/lib/formatters';
import { Trash2, Search, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditProductDialog } from '@/components/EditProductDialog';

interface Product {
  id: string;
  name: string;
  percentage: number;
  color: string;
  is_default: boolean;
}

interface ProductAutocompleteProps {
  products: Product[];
  productAmounts: Record<string, number>;
  productDisplayValues: Record<string, string>;
  onProductChange: (id: string, value: string) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
}

export const ProductAutocomplete = ({
  products,
  productAmounts,
  productDisplayValues,
  onProductChange,
  onDeleteProduct,
  onUpdateProduct,
}: ProductAutocompleteProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Estado para rastrear qué productos ha agregado el usuario manualmente a esta factura
  const [manuallyAddedIds, setManuallyAddedIds] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. PRODUCTOS VISIBLES EN LA FACTURA
  // Son los que ya tienen un monto > 0 (guardados o borrador) O los que el usuario acaba de agregar
  const visibleProducts = useMemo(() => {
    return products.filter(p => {
      const hasAmount = productAmounts[p.id] && productAmounts[p.id] > 0;
      const isManuallyAdded = manuallyAddedIds.includes(p.id);
      return hasAmount || isManuallyAdded;
    });
  }, [products, productAmounts, manuallyAddedIds]);

  // 2. SUGERENCIAS DEL CATÁLOGO (BÚSQUEDA)
  // Filtramos los productos que coinciden con la búsqueda Y que NO están ya en la lista visible
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !visibleProducts.find(vp => vp.id === p.id) // No sugerir lo que ya está agregado
    );
  }, [products, searchTerm, visibleProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Acción: Agregar producto del catálogo a la factura
  const handleAddProductToInvoice = (productId: string) => {
    setManuallyAddedIds(prev => [...prev, productId]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Acción: Quitar producto de la factura (solo visual y resetear monto)
  const handleRemoveFromInvoice = (productId: string) => {
    setManuallyAddedIds(prev => prev.filter(id => id !== productId));
    onProductChange(productId, "0"); // Resetear el monto a 0
  };

  return (
    <div className="space-y-4">
      {/* --- SECCIÓN 1: BUSCADOR DE CATÁLOGO (AGREGAR) --- */}
      <div ref={containerRef} className="relative z-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar en catálogo para agregar..."
            className="w-full h-11 pl-9 pr-4 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
          />
        </div>
        
        {/* Dropdown de Sugerencias */}
        {showSuggestions && searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {searchResults.length > 0 ? (
              searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProductToInvoice(product.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm"
                      style={{ backgroundColor: product.color }}
                    >
                      {product.percentage}%
                    </span>
                    <span className="text-sm font-medium text-foreground">{product.name}</span>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No se encontró "{searchTerm}" en el catálogo.
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- SECCIÓN 2: LISTA DE PRODUCTOS EN FACTURA (EDITAR MONTOS) --- */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {visibleProducts.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground">
              No hay productos variables agregados.
              <br />
              Usa el buscador arriba para añadir uno.
            </p>
          </div>
        ) : (
          visibleProducts.map((product) => {
            const amount = productAmounts[product.id] || 0;
            const commission = amount * (product.percentage / 100);
            
            return (
              <div 
                key={product.id}
                className="group flex items-center gap-3 p-3 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div 
                  className="h-8 w-8 rounded flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 shadow-sm"
                  style={{ backgroundColor: product.color }}
                >
                  {product.percentage}%
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{product.name}</span>
                    
                    {/* Botón Editar Producto (Lápiz pequeño) */}
                    <EditProductDialog 
                      product={product}
                      onUpdate={onUpdateProduct}
                    />
                  </div>
                  
                  {amount > 0 && (
                    <span className="text-xs font-medium animate-in fade-in" style={{ color: product.color }}>
                      +${commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={productDisplayValues[product.id] || (amount > 0 ? formatNumber(amount) : '')}
                      onChange={(e) => onProductChange(product.id, e.target.value)}
                      className="w-full h-9 pl-6 pr-3 text-sm text-right font-semibold rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Botón Eliminar de la lista (Desconectar) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => handleRemoveFromInvoice(product.id)}
                    title="Quitar de esta factura"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};