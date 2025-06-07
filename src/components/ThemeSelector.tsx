import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light theme',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference',
    },
  ];

  return (
    <Card className="shadow-sm border">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg text-foreground">Theme</h3>
            <p className="text-sm text-muted-foreground">
              Choose how the app looks to you
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.value;
              
              return (
                <Button
                  key={themeOption.value}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto flex flex-col gap-2 p-3 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background border-border active:bg-muted text-foreground transition-colors'
                  }`}
                  onClick={() => setTheme(themeOption.value)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{themeOption.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
