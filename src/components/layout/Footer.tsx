import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`footer-container ${className}`}>
      <div className="footer-content-compact">
        <div className="footer-left">
          <span className="footer-brand">Learn English VOC</span>
          <span className="footer-separator">•</span>
          <span className="footer-version">v1.0.0</span>
        </div>
        
        <div className="footer-center">
          <a href="/" className="footer-link-compact">Home</a>
          <span className="footer-separator">•</span>
          <a href="/test" className="footer-link-compact">Test</a>
          <span className="footer-separator">•</span>
          <a href="/stats" className="footer-link-compact">Stats</a>
        </div>
        
        <div className="footer-right">
          <span className="footer-copyright-compact">© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
};

Footer.displayName = 'Footer';