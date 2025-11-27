import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

let tooltipIdCounter = 0;

export default function Tooltip({ children, content }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipId] = useState(() => `tooltip-${++tooltipIdCounter}`);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;

    let top = triggerRect.bottom + window.scrollY + 8;
    let left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);

    // Adjust if it overflows the top
    if (triggerRect.top - tooltipRect.height - 8 < 0) {
      top = triggerRect.bottom + window.scrollY + 8; // Fallback to bottom
    } else {
      top = triggerRect.top + window.scrollY - tooltipRect.height - 8;
    }
    
    // Adjust if it overflows left/right
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }, [isOpen]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        aria-describedby={isOpen ? tooltipId : undefined}
        className="cursor-pointer"
        tabIndex="0"
      >
        {children}
      </span>
      {isOpen && content && createPortal(
        <div
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] max-w-xs rounded-lg bg-gray-800 text-white px-3 py-2 text-sm shadow-lg pointer-events-none"
          style={{ willChange: 'transform' }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}