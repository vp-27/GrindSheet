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
    }
  }, [show, onFadeOut]);

  if (!visible) return null;

  const bgColor = isDark ? DARK_BG : LIGHT_BG;
  const logoSrc = isDark ? DARK_IMG : LIGHT_IMG;

  return (
    <div
      className={`loading-overlay${fade ? ' fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: bgColor,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start', // align to top
        justifyContent: 'center',
        transition: 'opacity 0.5s',
        opacity: fade ? 0 : 1,
        paddingTop: '15vh', // push image down to top half's center
      }}
    >
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
        }}
      />
    </div>
  );
};

export default LoadingOverlay; 