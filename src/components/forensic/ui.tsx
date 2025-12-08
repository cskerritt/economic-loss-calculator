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
  required?: boolean;
  error?: string;
  onBlur?: () => void;
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
  className = "",
  required = false,
  error,
  onBlur
}) => {
  const hasError = !!error;
  const isEmpty = value === '' || value === undefined || value === null;
  const showRequiredIndicator = required && isEmpty;

  const formatDateInput = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        formatted += '/';
      }
      formatted += digits[i];
    }
    return formatted;
  };

  const formatNumberInput = (input: string): string => {
    if (input === '' || input === '-') return input;
    const cleaned = input.replace(/[^\d.-]/g, '');
    // Preserve trailing decimal point and zeros during input
    if (cleaned.endsWith('.') || /\.\d*0$/.test(cleaned)) {
      return cleaned;
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? '' : num.toString();
  };

  const formatCurrencyDisplay = (input: string): string => {
    if (input === '' || input === '-') return input;
    const cleaned = input.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    // Format with thousand separators, preserve decimals
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const isCurrencyField = prefix === '$';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'date') {
      const formatted = formatDateInput(e.target.value);
      onChange(formatted);
    } else if (type === 'number') {
      // Strip commas and invalid chars for raw value
      const val = e.target.value.replace(/[^\d.-]/g, '');
      onChange(val);
    } else {
      onChange(e.target.value);
    }
  };

  const handleBlur = () => {
    if (type === 'number') {
      const formatted = formatNumberInput(String(value));
      if (formatted !== String(value)) {
        onChange(formatted);
      }
    }
    onBlur?.();
  };

  // Display value with formatting for currency fields
  const displayValue = type === 'number' && isCurrencyField 
    ? formatCurrencyDisplay(String(value)) 
    : value;
  
  return (
    <div className={`mb-3 ${className}`}>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className={`relative rounded-lg shadow-sm ${disabled ? 'opacity-60' : ''}`}>
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-muted-foreground sm:text-sm font-medium">{prefix}</span>
          </div>
        )}
        <input
          type={type === 'number' ? 'text' : (type === 'date' ? 'text' : type)}
          inputMode={type === 'number' ? 'decimal' : undefined}
          step={step}
          value={displayValue}
          disabled={disabled}
          placeholder={type === 'date' ? 'MM/DD/YYYY' : placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={type === 'date' ? 10 : undefined}
          className={`block w-full rounded-lg py-2 focus:ring-2 text-sm border px-3 transition-all bg-background text-foreground ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${disabled ? 'bg-muted cursor-not-allowed' : ''} ${hasError || showRequiredIndicator ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : 'border-border focus:ring-primary/30 focus:border-primary'}`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-muted-foreground sm:text-sm font-medium">{suffix}</span>
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-[10px] text-destructive mt-1 font-medium">{error}</p>
      )}
    </div>
  );
};

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
