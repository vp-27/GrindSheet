
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, placeholder }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded border border-border/60 flex-shrink-0" 
          style={{ backgroundColor: value || '#8E8E93' }}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0"
        />
      </div>
    </div>
  );
};

export default ColorPicker;
