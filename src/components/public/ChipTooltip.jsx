import React, { useState, useRef, useEffect } from 'react';

let tooltipCounter = 0;

export default function ChipTooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltipId] = useState(() => `tooltip-${++tooltipCounter}`);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    const handleClickOutside = (e) => {
      if (isMobile && triggerRef.current && !triggerRef.current.contains(e.target) &&
          tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    if (isMobile) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isMobile) {
        document.removeEventListener('click', handleClickOutside);
      }
    };
  }, [isVisible, isMobile]);

  const handleClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setIsVisible(prev => !prev);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => !isMobile && setIsVisible(true)}
        onMouseLeave={() => !isMobile && setIsVisible(false)}
        onFocus={() => !isMobile && setIsVisible(true)}
        onBlur={() => !isMobile && setIsVisible(false)}
        onClick={handleClick}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          className="absolute z-50 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-md max-w-xs -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>
      )}
    </div>
  );
}