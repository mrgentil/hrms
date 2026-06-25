import React, { useState, useRef, useEffect } from "react";

export interface Option {
  value: string | number;
  label: string;
}

interface SmartSelectProps {
  options: Option[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

const SmartSelect: React.FC<SmartSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Sélectionner une option",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || null;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Control Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-h-[44px] w-full cursor-text items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-theme-xs transition-colors bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90 ${
          isOpen
            ? "border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800"
            : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <div className="flex-1 truncate">
          {isOpen ? (
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Taper pour chercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking input
            />
          ) : selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </div>
        
        {/* Dropdown Arrow */}
        <div className="ml-2 text-gray-400">
          <svg className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Menu Portal */}
      {isOpen && (
        <div className="absolute z-[9999] mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 p-1">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucun résultat trouvé
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  value === option.value
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSelect;
