import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Sun, Moon, Monitor, Play } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import '@/components/ui/theme-selector.css';
import '@/components/ui/settings-animations.css';

const AnimationDemo: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [demoCards, setDemoCards] = useState([
    { id: 1, title: 'Demo Card 1', content: 'This is a demo card with smooth animations' },
    { id: 2, title: 'Demo Card 2', content: 'Watch how cards animate in sequence' },
    { id: 3, title: 'Demo Card 3', content: 'Each card has a slight delay for visual appeal' },
    { id: 4, title: 'Demo Card 4', content: 'The animations are optimized for performance' },
    { id: 5, title: 'Demo Card 5', content: 'Reduced motion preferences are respected' },
    { id: 6, title: 'Demo Card 6', content: 'All animations use CSS for hardware acceleration' }
  ]);

  const resetAnimation = () => {
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100);
  };

  return (
    <Layout title="Animation Demo">
      <div className="space-y-8 pb-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Animation Demo</h1>
          <p className="text-muted-foreground">
            Experience our smooth UI animations and theme selector
          </p>
        </div>

        {/* Theme Selector Demo */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Animated Theme Selector
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Click different theme options to see the smooth sliding indicator animation
          </p>
          
          {/* Animated Theme Selector */}
          <div 
            className="theme-selector-container"
            data-active={theme}
          >
            {/* Sliding Background Indicator */}
            <div className="theme-selector-slider" />
            
            {[
              { value: 'light' as const, label: 'Light', icon: Sun },
              { value: 'dark' as const, label: 'Dark', icon: Moon },
              { value: 'system' as const, label: 'System', icon: Monitor }
            ].map((themeOption) => {
              const isSelected = theme === themeOption.value;
              const IconComponent = themeOption.icon;
              
              return (
                <button
                  key={themeOption.value}
                  className={`theme-selector-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => setTheme(themeOption.value)}
                >
                  <IconComponent className="theme-selector-icon" />
                  <span className="theme-selector-label">{themeOption.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Animation Demo */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 shadow-sm">
            <CollapsibleTrigger className="w-full p-6 cursor-pointer active:bg-muted/20 transition-colors rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Play className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-lg font-semibold text-foreground">Staggered Card Animations</h3>
                    <p className="text-sm text-muted-foreground">
                      Cards animate in sequence with smooth transitions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetAnimation();
                    }}
                    className="h-8 px-3 rounded-lg text-xs"
                  >
                    Replay
                  </Button>
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {demoCards.map((card) => (
                    <div 
                      key={card.id} 
                      className="settings-card-item bg-background rounded-xl border border-border/60 p-4 shadow-sm"
                    >
                      <h4 className="font-medium text-foreground mb-2">
                        {card.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {card.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Performance Notes */}
        <div className="bg-muted/10 rounded-xl border border-border/30 p-6">
          <h3 className="font-semibold text-foreground mb-3">Performance Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• CSS-only animations with hardware acceleration</li>
            <li>• Respects user's reduced motion preferences</li>
            <li>• Optimized cubic-bezier easing functions</li>
            <li>• Staggered timing for visual appeal</li>
            <li>• Mobile-optimized touch interactions</li>
            <li>• Dark mode compatible shadow adjustments</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default AnimationDemo;
