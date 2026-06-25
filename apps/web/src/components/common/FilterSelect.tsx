"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { FilterCondition } from "@anduck/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterMode = "single" | "multi";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition<TField extends string = string> {
  label: string;
  field: TField;
  options: FilterOption[];
  mode?: FilterMode;
}

export type FilterValues<TField extends string = string> = Partial<Record<TField, string | string[]>>;

interface FilterSelectProps<TField extends string> {
  value: FilterValues<TField>;
  onChange: (next: FilterValues<TField>) => void;
  filters: FilterDefinition<TField>[];
}

export function buildFilterConditions<TField extends string>(
  values: FilterValues<TField>,
): FilterCondition[] | undefined {
  const result = Object.entries(values).flatMap(([field, value]) => {
    if (Array.isArray(value)) {
      return value.length ? [{ field, op: "in" as const, value }] : [];
    }
    return value ? [{ field, op: "in" as const, value: [value] }] : [];
  });

  return result.length ? result : undefined;
}

export function FilterSelect<TField extends string>({
  value,
  onChange,
  filters,
}: FilterSelectProps<TField>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedCount = (Object.values(value) as Array<string | string[] | undefined>).reduce<number>((sum, item) => {
    if (Array.isArray(item)) return sum + item.length;
    return item ? sum + 1 : sum;
  }, 0);

  function toggle(definition: FilterDefinition<TField>, optionValue: string) {
    const mode = definition.mode ?? "multi";
    const field = definition.field;
    const current = value[field];

    if (mode === "multi") {
      const currentValues = Array.isArray(current) ? current : current ? [current] : [];
      const nextValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange({ ...value, [field]: nextValues.length ? nextValues : undefined });
      return;
    }

    onChange({ ...value, [field]: current === optionValue ? undefined : optionValue });
  }

  function isChecked(definition: FilterDefinition<TField>, optionValue: string) {
    const current = value[definition.field];
    return Array.isArray(current) ? current.includes(optionValue) : current === optionValue;
  }

  function reset() {
    onChange({});
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="gap-1.5"
      >
        <SlidersHorizontal className="size-3.5" />
        필터
        {selectedCount > 0 && (
          <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
            {selectedCount}
          </span>
        )}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-md border bg-white shadow-md">
          <div className="space-y-3 p-3">
            {filters.map((definition) => (
              <div key={definition.field}>
                <p className="mb-1.5 text-xs font-semibold text-gray-500">{definition.label}</p>
                <ul className="space-y-1">
                  {definition.options.map((option) => (
                    <li key={option.value}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-50">
                        <input
                          type={(definition.mode ?? "multi") === "multi" ? "checkbox" : "radio"}
                          name={definition.field}
                          checked={isChecked(definition, option.value)}
                          onChange={() => toggle(definition, option.value)}
                          className="size-3.5 accent-primary"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {selectedCount > 0 && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                onClick={reset}
                className="w-full text-xs text-gray-400 hover:text-gray-700"
              >
                초기화
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
