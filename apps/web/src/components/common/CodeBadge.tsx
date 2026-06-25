"use client";

import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type CodeBadgePreset = "openYn" | "activeYn";

const OUTLINE_BY_N: Record<string, BadgeVariant> = {
  N: "outline",
};

const CODE_BADGE_PRESETS: Record<CodeBadgePreset, {
  classNameByValue: Record<string, string>;
  variantByValue: Record<string, BadgeVariant>;
  fallbackVariant: BadgeVariant;
}> = {
  openYn: {
    classNameByValue: {
      Y: "bg-green-100 text-green-800 hover:bg-green-100",
      N: "text-gray-400",
    },
    variantByValue: OUTLINE_BY_N,
    fallbackVariant: "default",
  },
  activeYn: {
    classNameByValue: {
      Y: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      N: "text-gray-400",
    },
    variantByValue: OUTLINE_BY_N,
    fallbackVariant: "default",
  },
};

interface CodeBadgeProps {
  value?: string | null;
  labels?: Record<string, string>;
  preset?: CodeBadgePreset;
  classNameByValue?: Record<string, string>;
  variantByValue?: Record<string, BadgeVariant>;
  fallbackVariant?: BadgeVariant;
  fallbackClassName?: string;
}

export function CodeBadge({
  value,
  labels,
  preset,
  classNameByValue,
  variantByValue,
  fallbackVariant,
  fallbackClassName,
}: CodeBadgeProps) {
  const code = value ?? "";
  const presetConfig = preset ? CODE_BADGE_PRESETS[preset] : undefined;
  const classes = classNameByValue ?? presetConfig?.classNameByValue;
  const variants = variantByValue ?? presetConfig?.variantByValue;
  const variant = fallbackVariant ?? presetConfig?.fallbackVariant ?? "outline";

  return (
    <Badge
      variant={variants?.[code] ?? variant}
      className={classes?.[code] ?? fallbackClassName}
    >
      {labels?.[code] ?? (code || "-")}
    </Badge>
  );
}
