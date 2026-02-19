"use client";

import * as React from "react";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  dark?: boolean;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within Select");
  return ctx;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  dark?: boolean;
  children: React.ReactNode;
}

export function Select({ value = "", onValueChange, dark, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(value);
  const [open, setOpen] = React.useState(false);
  const current = value !== undefined ? value : internalValue;
  const handleChange = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternalValue(v);
      onValueChange?.(v);
      setOpen(false);
    },
    [value, onValueChange]
  );
  return (
    <SelectContext.Provider
      value={{
        value: current,
        onValueChange: handleChange,
        open,
        setOpen,
        dark,
      }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id?: string;
  children?: React.ReactNode;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ id, className = "", children, ...props }, ref) => {
    const { setOpen, open } = useSelect();
    return (
      <button
        ref={ref}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
        {...props}
      >
        {children}
        <svg
          className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelect();
  return <span>{value || placeholder}</span>;
}

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = "" }: SelectContentProps) {
  const { open, value, onValueChange, dark } = useSelect();

  if (!open) return null;

  const optionClass = dark
    ? `cursor-pointer px-3 py-2 text-sm text-white hover:bg-white/10 ${value === "" ? "" : ""}`
    : `cursor-pointer px-3 py-2 text-sm hover:bg-gray-100`;
  const optionSelectedClass = dark ? "bg-white/10" : "bg-gray-50";

  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto rounded-md border py-1 shadow-lg ${dark ? "border-white/10 bg-[#111827]" : "border-gray-200 bg-white"} ${className}`}
      style={{ top: "100%" }}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          const itemValue = (child.props as { value: string }).value;
          const isSelected = value === itemValue;
          return (
            <div
              role="option"
              aria-selected={isSelected}
              className={`${optionClass} ${isSelected ? optionSelectedClass : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onValueChange(itemValue);
              }}
            >
              {(child.props as { children?: React.ReactNode }).children}
            </div>
          );
        }
        return child;
      })}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  children?: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <>{children}</>;
}
