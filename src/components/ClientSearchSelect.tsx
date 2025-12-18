import * as React from "react";
import { Check, ChevronsUpDown, Search, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Client } from "@/hooks/useClients";

interface ClientSearchSelectProps {
  clients: Client[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ClientSearchSelect({
  clients,
  value,
  onChange,
  className,
  disabled
}: ClientSearchSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Buscar el cliente seleccionado de forma segura
  const selectedClient = React.useMemo(() => 
    clients.find((client) => client.id === value),
  [clients, value]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10 bg-background", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            {value && selectedClient ? (
              <span className="truncate">{selectedClient.name}</span>
            ) : (
              <span className="text-muted-foreground">Buscar cliente...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      {/* CORRECCIÓN CLAVE: z-index alto y portal correcto */}
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999]" align="start" side="bottom">
        <Command className="w-full border rounded-md">
          <CommandInput placeholder="Escribe para buscar..." className="h-9" />
          <CommandList>
            <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground">
              No se encontraron clientes.
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name} // Usamos el nombre para la búsqueda textual
                  onSelect={() => {
                    onChange(client.id === value ? "" : client.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    {client.phone && (
                      <span className="text-xs text-muted-foreground">{client.phone}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}