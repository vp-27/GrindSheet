import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  formatValue?: (value: number) => string;
  duration?: number;
  className?: string;
  preserveTrailingZeros?: boolean;
  decimalPlaces?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  formatValue,
  duration = 800,
  className = '',
  preserveTrailingZeros = false,
  decimalPlaces = 1
}) => {
  // Ensure value is always a valid number
  const safeValue = React.useMemo(() => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }, [value]);
  
  const [displayValue, setDisplayValue] = useState(safeValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(safeValue);

  useEffect(() => {
    if (safeValue === displayValue) return;

    setIsAnimating(true);
    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    // Check if both start and end values are integers
    const startIsInteger = Number.isInteger(startValueRef.current);
    const endIsInteger = Number.isInteger(safeValue);
    const shouldUseIntegerSteps = startIsInteger && endIsInteger;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);

      // Use easing function for smooth animation (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      let currentValue = startValueRef.current + (safeValue - startValueRef.current) * easeOutQuart;
      
      // If animating between integers, round to nearest integer during animation
      if (shouldUseIntegerSteps && progress < 1) {
        currentValue = Math.round(currentValue);
      }
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(safeValue);
        setIsAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [safeValue, duration, displayValue]);

  const formattedValue = React.useMemo(() => {
    if (formatValue) {
      return formatValue(displayValue);
    }
    
    // Format number with specified decimal places
    let formatted = displayValue.toFixed(decimalPlaces);
    
    // Remove trailing zeros unless preserveTrailingZeros is true
    if (!preserveTrailingZeros) {
      formatted = parseFloat(formatted).toString();
    }
    
    return formatted;
  }, [displayValue, formatValue, preserveTrailingZeros, decimalPlaces]);

  return (
    <span 
      className={`animated-counter tabular-nums ${className} ${isAnimating ? 'animating-counter' : ''}`}
    >
      {formattedValue}
    </span>
  );
};

export default AnimatedCounter;
