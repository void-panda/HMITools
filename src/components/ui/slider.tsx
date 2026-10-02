import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
    const currentValue = value ? value[0] : defaultValue ? defaultValue[0] : min;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value);
      onValueChange?.([num]);
    };

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary transition-all disabled:opacity-50"
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
