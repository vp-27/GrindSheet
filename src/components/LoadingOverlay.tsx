import React, { useEffect, useRef, useState } from 'react';

interface LoadingOverlayProps {
  show: boolean;
  onFadeOut?: () => void;
}

const LIGHT_BG = '#00ddc4';
const DARK_BG = '#0f0f0c';
const LIGHT_IMG = '/grindsheetLogo.png';
const DARK_IMG = '/grindsheetLogoDark.PNG';

const getIsDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, onFadeOut }) => {
  const [isDark, setIsDark] = useState(getIsDark());
  const [imgLoaded, setImgLoaded] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for class changes on <html> to update dark mode
    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Preload logo image for smoother appearance
  useEffect(() => {
    const img = new window.Image();
    img.src = isDark ? DARK_IMG : LIGHT_IMG;
    img.onload = () => setPreloaded(true);
  }, [isDark]);

  // Fade-out effect using CSS, keep overlay mounted
  useEffect(() => {
    if (!show && overlayRef.current) {
      overlayRef.current.classList.add('fade-out');
      const timeout = setTimeout(() => {
        if (onFadeOut) onFadeOut();
      }, 500); // match CSS duration
      return () => clearTimeout(timeout);
    } else if (show && overlayRef.current) {
      overlayRef.current.classList.remove('fade-out');
    }
  }, [show, onFadeOut]);

  // Always render overlay, but hide with opacity/pointer-events
  const shouldShow = show || (overlayRef.current && overlayRef.current.classList.contains('fade-out'));
  if (!shouldShow) return null;

  const bgColor = isDark ? DARK_BG : LIGHT_BG;
  const logoSrc = isDark ? DARK_IMG : LIGHT_IMG;
  const textColor = isDark ? '#ffffff' : '#000000';

  return (
    <div
      ref={overlayRef}
      className="loading-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: bgColor,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        transition: 'opacity 0.5s',
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        paddingTop: '15vh',
        willChange: 'opacity',
      }}
    >
      <div style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img
          src={logoSrc}
          alt="Grindsheet Logo"
          style={{
            width: '180px',
            height: '180px',
            objectFit: 'contain',
            background: bgColor,
            borderRadius: 0,
            display: 'block',
            marginBottom: '16px',
          }}
        />
        {/* Show text as soon as image is preloaded, not after imgLoaded */}
        {preloaded && (
          <h1
            style={{
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '2.25rem',
              fontWeight: 600,
              color: textColor,
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            GrindSheet
          </h1>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay; 