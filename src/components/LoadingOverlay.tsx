import React, { useEffect, useState } from 'react';

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
  const [visible, setVisible] = useState(show);
  const [fade, setFade] = useState(false);
  const [isDark, setIsDark] = useState(getIsDark());
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    // Listen for class changes on <html> to update dark mode
    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!show) {
      setFade(true);
      // Wait for fade-out transition, then hide
      const timeout = setTimeout(() => {
        setVisible(false);
        setFade(false);
        if (onFadeOut) onFadeOut();
      }, 500); // match CSS duration
      return () => clearTimeout(timeout);
    } else {
      setVisible(true);
      setFade(false);
      setImgLoaded(false); // reset image loaded state when showing
    }
  }, [show, onFadeOut]);

  if (!visible) return null;

  const bgColor = isDark ? DARK_BG : LIGHT_BG;
  const logoSrc = isDark ? DARK_IMG : LIGHT_IMG;
  const textColor = isDark ? '#ffffff' : '#000000';

  return (
    <div
      className={`loading-overlay${fade ? ' fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: bgColor,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        transition: 'opacity 0.5s',
        opacity: fade ? 0 : 1,
        paddingTop: '15vh',
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
          onLoad={() => setImgLoaded(true)}
        />
        {imgLoaded && (
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