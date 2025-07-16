import React, { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  show: boolean;
  onFadeOut?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, onFadeOut }) => {
  const [visible, setVisible] = useState(show);
  const [fade, setFade] = useState(false);

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

  return (
    <div
      className={`loading-overlay${fade ? ' fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00ddc4',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.5s',
        opacity: fade ? 0 : 1,
      }}
    >
      <img
        src="/grindsheetLogo.png"
        alt="Grindsheet Logo"
        style={{
          width: '180px',
          height: '180px',
          objectFit: 'contain',
          background: '#00ddc4',
          borderRadius: 0,
          display: 'block',
        }}
      />
    </div>
  );
};

export default LoadingOverlay; 