import clsx from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-navy-900 text-white hover:bg-navy-800",
        variant === "secondary" && "border border-[var(--color-border)] bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--color-surface-muted)]",
        variant === "ghost" && "text-[var(--muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--text)]",
        variant === "danger" && "bg-[var(--color-danger)] text-white hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-[var(--color-border)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-accent-500",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-md border border-[var(--color-border)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-accent-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-md border border-[var(--color-border)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-accent-500",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{children}</label>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-900 dark:text-navy-100">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warn" | "ok" | "danger" }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-[var(--color-surface-muted)] text-[var(--muted)]",
        tone === "accent" && "bg-accent-100 text-accent-600",
        tone === "warn" && "bg-amber-100 text-amber-800",
        tone === "ok" && "bg-emerald-100 text-emerald-800",
        tone === "danger" && "bg-red-100 text-red-800",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--panel)] px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function Alert({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "danger" }) {
  return (
    <div
      className={clsx(
        "rounded-md border px-3 py-2 text-sm",
        tone === "info" && "border-accent-100 bg-accent-100/40 text-navy-800",
        tone === "warn" && "border-amber-200 bg-amber-50 text-amber-900",
        tone === "danger" && "border-red-200 bg-red-50 text-red-900",
      )}
    >
      {children}
    </div>
  );
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--panel)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--muted)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
