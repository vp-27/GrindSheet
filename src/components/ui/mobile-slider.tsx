import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import './mobile-slider.css';

interface SliderOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface MobileSliderProps {
  options: SliderOption[];
  activeOption: string;
  onOptionChange: (optionId: string) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export const MobileSlider: React.FC<MobileSliderProps> = ({
  options,
  activeOption,
  onOptionChange,
  variant = 'default',
  className = ''
}) => {
  const [sliderStyle, setSliderStyle] = useState({ left: '0px', width: '0px', opacity: 0 });
  const [disableAnimation, setDisableAnimation] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useLayoutEffect(() => {
    const activeButtonRef = buttonRefs.current[activeOption];
    
    if (activeButtonRef && containerRef.current) {
      const left = activeButtonRef.offsetLeft;
      const width = activeButtonRef.offsetWidth;
      
      setSliderStyle({ left: `${left}px`, width: `${width}px`, opacity: 1 });
    }
  }, [activeOption, options]);

  // Remove animation after first render
  useEffect(() => {
    const timeout = setTimeout(() => setDisableAnimation(false), 50);
    return () => clearTimeout(timeout);
  }, []);

  const isCompact = variant === 'compact';

  return (
    <div 
      ref={containerRef} 
      className={`mobile-slider ${isCompact ? 'mobile-slider-compact' : 'mobile-slider-default'} ${className} ${disableAnimation ? 'no-animate' : ''}`}
    >
      {/* Slider background track */}
      <div 
        className="mobile-slider-track"
        style={{
          left: sliderStyle.left,
          width: sliderStyle.width,
          opacity: sliderStyle.opacity
        }}
      />
      
      {/* Option buttons */}
      {options.map((option) => (
        <button
          key={option.id}
          ref={(el) => (buttonRefs.current[option.id] = el)}
          onClick={() => onOptionChange(option.id)}
          className={`mobile-slider-option ${
            activeOption === option.id ? 'active' : 'inactive'
          }`}
        >
          {option.icon && (
            <span className="mobile-slider-icon">
              {option.icon}
            </span>
          )}
          <span className="mobile-slider-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
};
