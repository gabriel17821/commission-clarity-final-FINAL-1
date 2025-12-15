import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, X, UserPlus } from 'lucide-react';
import { Client } from '@/hooks/useClients';
import { createPortal } from 'react-dom';

interface ClientSearchSelectProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
}

export const ClientSearchSelect = ({
  clients,
  selectedClientId,
  onSelectClient,
  placeholder = 'Buscar cliente...',
  allowClear = true,
}: ClientSearchSelectProps) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  // Update dropdown position
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showDropdown, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  const handleSelect = (clientId: string | null) => {
    onSelectClient(clientId);
    setSearch('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    const totalItems = filteredClients.length + 1; // +1 for "none" option

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
        if (highlightedIndex === 0) {
          handleSelect(null);
        } else if (highlightedIndex > 0 && highlightedIndex <= filteredClients.length) {
          handleSelect(filteredClients[highlightedIndex - 1].id);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const dropdownContent = showDropdown ? createPortal(
    <div 
      className="fixed bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
      style={{ 
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 99999,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* No client option */}
      <div
        className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 cursor-pointer border-b border-border ${
          highlightedIndex === 0 ? 'bg-primary/10' : 'hover:bg-muted/60'
        }`}
        onClick={() => handleSelect(null)}
      >
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium text-muted-foreground text-sm">Sin cliente asignado</span>
      </div>

      {filteredClients.length > 0 ? (
        <div className="max-h-48 overflow-y-auto">
          {filteredClients.map((client, index) => (
            <div
              key={client.id}
              className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 cursor-pointer ${
                highlightedIndex === index + 1 ? 'bg-primary/10' : 'hover:bg-muted/60'
              } ${selectedClientId === client.id ? 'bg-primary/5' : ''}`}
              onClick={() => handleSelect(client.id)}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                selectedClientId === client.id ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <User className={`h-4 w-4 ${selectedClientId === client.id ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{client.name}</p>
                {client.phone && (
                  <p className="text-xs text-muted-foreground">{client.phone}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : search.trim() ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No se encontraron clientes
        </div>
      ) : null}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      {selectedClient && !showDropdown ? (
        <div 
          className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => {
            setShowDropdown(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{selectedClient.name}</p>
              {selectedClient.phone && (
                <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
              )}
            </div>
          </div>
          {allowClear && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pl-9 h-12"
            />
          </div>
          {dropdownContent}
        </>
      )}
    </div>
  );
};