import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, UserPlus, X, Check, User, Phone, Mail, Trash2, Sparkles } from 'lucide-react';
import { Client } from '@/hooks/useClients';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onAddClient: (name: string, phone?: string, email?: string) => Promise<Client | null>;
  onDeleteClient?: (id: string) => Promise<boolean>;
}

export const ClientSelector = ({
  clients,
  selectedClient,
  onSelectClient,
  onAddClient,
  onDeleteClient,
}: ClientSelectorProps) => {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  const shouldShowDropdown = showSuggestions;

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setSearch('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown) {
      if (e.key === 'Enter' && search.trim()) {
        e.preventDefault();
        handleQuickAdd();
      }
      return;
    }

    const totalItems = filteredClients.length + 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredClients.length) {
          handleSelectClient(filteredClients[highlightedIndex]);
        } else if (highlightedIndex === filteredClients.length || (filteredClients.length === 0 && search.trim())) {
          handleQuickAdd();
        } else if (search.trim()) {
          handleQuickAdd();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleQuickAdd = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const client = await onAddClient(search.trim());
    setLoading(false);
    if (client) {
      onSelectClient(client);
      setSearch('');
      setShowSuggestions(false);
    }
  };

  const handleAddNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setLoading(true);
    const client = await onAddClient(newName.trim(), newPhone.trim() || undefined, newEmail.trim() || undefined);
    setLoading(false);
    
    if (client) {
      onSelectClient(client);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setDialogOpen(false);
    }
  };

  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (onDeleteClient) {
      await onDeleteClient(clientId);
    }
  };

  return (
    <div className="space-y-3 relative" ref={containerRef}>
      {selectedClient ? (
        // CLIENTE SELECCIONADO: Tarjeta compacta pero elegante
        <div 
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-white to-white dark:from-primary/20 dark:to-slate-900 border border-primary/20 shadow-sm transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          
          <div className="flex items-center gap-3 p-3 pl-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-0.5">Cliente</p>
              <p className="font-bold text-sm text-foreground truncate">{selectedClient.name}</p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onSelectClient(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // BUSCADOR DIRECTO: Input visible siempre
        <div className="relative animate-in fade-in duration-300">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                 <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar o crear cliente..."
                className="pl-9 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all font-medium"
              />
            </div>

            {/* Sugerencias: Absolute puro, sin portales, pegado al input */}
            {shouldShowDropdown && (
              <div 
                className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-1 z-50"
              >
                {filteredClients.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto scrollbar-thin">
                    {filteredClients.map((client, index) => (
                      <div
                        key={client.id}
                        className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 cursor-pointer group ${
                          highlightedIndex === index ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate">{client.name}</p>
                          {client.phone && (
                            <p className="text-[11px] text-muted-foreground">{client.phone}</p>
                          )}
                        </div>
                        {onDeleteClient && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="z-[9999]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Eliminar a "{client.name}" es permanente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={(e) => handleDeleteClient(e, client.id)}
                                  className="bg-destructive"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  search.trim() && (
                    <div className="p-3 text-center text-muted-foreground text-xs">
                      No se encontraron resultados
                    </div>
                  )
                )}

                <button 
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-primary ${
                    highlightedIndex === filteredClients.length ? 'bg-primary/5' : 'hover:bg-primary/5'
                  }`}
                  onClick={() => {
                    setNewName(search.trim());
                    setDialogOpen(true);
                    setShowSuggestions(false);
                  }}
                >
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm">
                       Crear "{search.trim() || 'Nuevo'}"
                    </span>
                    <span className="text-[10px] text-muted-foreground">Agregar a la base de datos</span>
                  </div>
                </button>
              </div>
            )}
        </div>
      )}

      {/* Dialog creation remains the same but with higher z-index if needed */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNewClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nombre *</Label>
              <Input
                id="client-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del cliente"
                className="h-11"
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="client-phone">Teléfono</Label>
                <Input
                    id="client-phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Teléfono"
                    className="h-11"
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                    id="client-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email"
                    className="h-11"
                />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !newName.trim()} className="gap-2 bg-primary hover:bg-primary/90">
                <Check className="h-4 w-4" />
                Crear Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
