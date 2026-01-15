'use client';

import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allOptionLabel?: string;
  showAllOption?: boolean;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  allOptionLabel = 'All',
  showAllOption = false,
}: DropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption 
    ? selectedOption.label 
    : showAllOption && value === 'all'
    ? allOptionLabel
    : placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsExpanded(false);
  };

  return (
    <div className={`provider-filter ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="provider-filter-toggle"
      >
        <span>{displayText}</span>
        <svg
          style={{
            width: '16px',
            height: '16px',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="provider-list">
          {showAllOption && (
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`provider-item ${value === 'all' ? 'active' : ''}`}
            >
              {allOptionLabel}
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`provider-item ${value === option.value ? 'active' : ''}`}
            >
              {option.icon && (
                <img
                  src={option.icon}
                  alt={option.label}
                  style={{ width: '16px', height: '16px', objectFit: 'contain', marginRight: '0.5rem' }}
                />
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

