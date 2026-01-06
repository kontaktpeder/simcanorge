import * as React from "react";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormFieldWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  error?: string;
  className?: string;
}

export function FormFieldWithTooltip({
  label,
  tooltip,
  required = false,
  children,
  htmlFor,
  error,
  className = "",
}: FormFieldWithTooltipProps) {
  return (
    <div className={`space-y-1.5 sm:space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-base sm:text-lg font-display">
          {label} {required && "*"}
        </Label>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger type="button" className="cursor-help">
              <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-[250px] text-sm bg-popover text-popover-foreground border shadow-md z-50"
            >
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
