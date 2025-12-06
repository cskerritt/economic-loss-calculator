import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-card rounded-xl shadow-sm border border-border overflow-hidden ${className}`}>
    {children}
  </div>
);

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border/50">
    <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-bold text-foreground text-lg leading-tight">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
    </div>
  </div>
);

interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  prefix?: string | null;
  suffix?: string | null;
  disabled?: boolean;
  placeholder?: string;
  step?: string;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  value,
  onChange,
  type = "number",
  prefix = null,
  suffix = null,
  disabled = false,
  placeholder = "",
  step = "any",
  className = ""
}) => (
  <div className={`mb-3 ${className}`}>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
    <div className={`relative rounded-lg shadow-sm ${disabled ? 'opacity-60' : ''}`}>
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-muted-foreground sm:text-sm font-medium">{prefix}</span>
        </div>
      )}
      <input
        type={type}
        step={step}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full rounded-lg border-border py-2 focus:ring-primary focus:border-primary text-sm border px-3 transition-all bg-background text-foreground ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${disabled ? 'bg-muted cursor-not-allowed' : ''}`}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-muted-foreground sm:text-sm font-medium">{suffix}</span>
        </div>
      )}
    </div>
  </div>
);

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, value, onChange, placeholder = "", rows = 3 }) => (
  <div className="mb-3">
    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full rounded-lg border-border py-2 focus:ring-primary focus:border-primary text-sm border px-3 transition-all resize-none bg-background text-foreground"
    />
  </div>
);
