import type { ChangeEvent } from "react";

interface Props {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email";
  multiline?: boolean;
  maxLength: number;
  autoComplete?: string;
  disabled?: boolean;
  showCount?: boolean;
}

export default function FormField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  type = "text",
  multiline = false,
  maxLength,
  autoComplete,
  disabled,
  showCount = false,
}: Props) {
  const errorId = `${id}-error`;
  const countId = `${id}-count`;
  const describedBy = [error ? errorId : null, showCount ? countId : null].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    value,
    required: true,
    disabled,
    maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: `steam-input ${error ? "border-[#c02942]!" : ""}`,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs text-steam-muted uppercase">
          {label}
        </label>
        {showCount && (
          <span id={countId} className="text-[11px] text-steam-muted">
            {[...value].length}/{maxLength}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea {...common} rows={4} className={`${common.className} resize-y`} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} />
      )}
      {error && (
        <p id={errorId} className="text-xs text-[#ff7b7b]">
          {error}
        </p>
      )}
    </div>
  );
}

export function Honeypot({ value, onChange, idPrefix }: { value: string; onChange: (v: string) => void; idPrefix: string }) {
  return (
    <div className="hp-field" aria-hidden="true">
      <label htmlFor={`${idPrefix}-website`}>Website</label>
      <input
        id={`${idPrefix}-website`}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
