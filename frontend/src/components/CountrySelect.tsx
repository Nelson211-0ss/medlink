import { Label, Select } from '@/components/ui/input';
import { COUNTRIES } from '@/lib/countries';
import { cn } from '@/lib/utils';

export function CountrySelect({
  value,
  onChange,
  label = 'Country',
  id,
  className,
  full,
  grid,
  inputSize = 'lg',
}: {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  className?: string;
  full?: boolean;
  grid?: boolean;
  inputSize?: 'md' | 'lg';
}) {
  const current = value ?? '';
  const hasCustom = current && !COUNTRIES.includes(current as (typeof COUNTRIES)[number]);

  return (
    <div
      className={cn(
        'profile-field',
        grid && 'profile-field--grid',
        !grid && (inputSize === 'md' ? 'profile-field--md' : 'profile-field--lg'),
        full && 'profile-field--row',
        className,
      )}
    >
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={current} onChange={(e) => onChange(e.target.value)} className="w-full">
        <option value="">Select country...</option>
        {hasCustom && <option value={current}>{current}</option>}
        {COUNTRIES.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </Select>
    </div>
  );
}
