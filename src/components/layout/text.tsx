import React from "react";
import { useTranslation } from "@/lib/i18n";

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function Text({ text = "", className = "", children, ...props }: TextProps) {
  const { t } = useTranslation();

  if (text) {
    return (
      <span className={className} {...props}>
        {t(text) || text}
      </span>
    );
  }

  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}
