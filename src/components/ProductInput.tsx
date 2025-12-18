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
    else if (value > 0 && parseFormattedNumber(displayValue) !== value) {
        setDisplayValue(formatInputNumber(value.toString()));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputNumber(e.target.value);
    setDisplayValue(formatted);
    onChange(parseFormattedNumber(formatted));
  };

  const commission = value * (percentage / 100);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md animate-slide-up">
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-bold text-foreground truncate">{label}</Label>
            {canDelete && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{percentage}% COMISIÓN</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="relative w-36">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={displayValue}
              onChange={handleChange}
              className="h-9 pl-7 text-right font-bold text-sm border-2 focus-visible:ring-primary/20"
              placeholder="0.00"
            />
          </div>
          {value > 0 && (
            <span className="text-xs font-bold text-success">
              + ${formatCurrency(commission)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
