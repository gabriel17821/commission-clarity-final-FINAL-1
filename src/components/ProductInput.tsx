import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatInputNumber, parseFormattedNumber } from "@/lib/formatters";
import { useState, useEffect } from "react";

interface ProductInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  percentage: number;
  color: string;
  onDelete?: () => void;
  canDelete?: boolean;
}

export const ProductInput = ({ label, value, onChange, percentage, color, onDelete, canDelete = false }: ProductInputProps) => {
  const [displayValue, setDisplayValue] = useState(value > 0 ? formatInputNumber(value.toString()) : "");

  useEffect(() => {
    if (value === 0 && displayValue !== "") setDisplayValue("");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputNumber(e.target.value);
    setDisplayValue(formatted);
    onChange(parseFormattedNumber(formatted));
  };

  const commission = value * (percentage / 100);

  return (
    <div className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-primary/30 animate-slide-up">
      <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="text-base font-bold text-foreground truncate">{label}</Label>
            {canDelete && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs font-black text-muted-foreground uppercase mt-1 tracking-widest">{percentage}% COMISIÓN</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={displayValue}
              onChange={handleChange}
              className="h-11 pl-8 text-right font-black text-lg border-2 focus-visible:ring-primary/20"
              placeholder="0.00"
            />
          </div>
          {value > 0 && (
            <span className="text-sm font-black text-success flex items-center gap-1">
              + ${formatCurrency(commission)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
