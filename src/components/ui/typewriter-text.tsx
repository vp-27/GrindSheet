import React, { useState, useEffect } from 'react';
import { animationManager } from '@/utils/animationManager';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  showOnce?: boolean; // If true, only show typewriter effect once per session
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 50, 
  delay = 200,
  className = '',
  onComplete,
  showOnce = true // Default to true for the "once per session" behavior
}) => {
  // Initialize with empty string to prevent flash, unless animation should be skipped
  const [displayedText, setDisplayedText] = useState(() => {
    if (showOnce && animationManager.hasTypewriterBeenShown(text)) {
      return text; // Show immediately if already shown
    }
    return ''; // Start empty for animation
  });
  
  const [isComplete, setIsComplete] = useState(() => {
    return showOnce && animationManager.hasTypewriterBeenShown(text);
  });
  
  const [shouldAnimate, setShouldAnimate] = useState(() => {
    return !(showOnce && animationManager.hasTypewriterBeenShown(text));
  });

  useEffect(() => {
    // Check if we should skip animation for this text
    if (showOnce && animationManager.hasTypewriterBeenShown(text)) {
      // Show immediately without animation
      setDisplayedText(text);
      setIsComplete(true);
      setShouldAnimate(false);
      onComplete?.();
      return;
    }

    // Reset states for new animation
    setDisplayedText('');
    setIsComplete(false);
    setShouldAnimate(true);
    
    const startTimer = setTimeout(() => {
      let currentIndex = 0;
      
      const typeWriter = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          setTimeout(typeWriter, speed);
        } else {
          setIsComplete(true);
          if (showOnce) {
            animationManager.markTypewriterAsShown(text);
          }
          onComplete?.();
        }
      };
      
      typeWriter();
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, speed, delay, onComplete, showOnce]);

  return (
    <span className={className}>
      {displayedText}
      {shouldAnimate && !isComplete && (
        <span className="animate-pulse text-primary">|</span>
      )}
    </span>
  );
};

export default TypewriterText;
