import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple class variance authority implementation for Badge component
export function cva(base: string, options?: { variants?: any; defaultVariants?: any }) {
  return function(props?: any) {
    let classes = base;
    
    if (options?.variants && props) {
      Object.keys(options.variants).forEach(key => {
        if (props[key] && options.variants[key][props[key]]) {
          classes += ' ' + options.variants[key][props[key]];
        } else if (options.defaultVariants?.[key] && options.variants[key][options.defaultVariants[key]]) {
          classes += ' ' + options.variants[key][options.defaultVariants[key]];
        }
      });
    }
    
    return classes;
  };
}

export type VariantProps<T> = T extends (...args: any[]) => any ? Parameters<T>[0] : never;
