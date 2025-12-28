"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
    id: number;
    full_name: string;
    role?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    emptyMessage?: string;
    className?: string;
    name?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Rechercher...",
    emptyMessage = "Aucun résultat trouvé",
    className = "",
    name,
    disabled = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Trouver l'option sélectionnée
    const selectedOption = options.find((opt) => opt.id.toString() === value);

    // Filtrer les options basé sur la recherche
    const filteredOptions = options.filter((option) =>
        option.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fermer le dropdown quand on clique dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Gérer la navigation au clavier
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                        prev < filteredOptions.length - 1 ? prev + 1 : prev
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                    break;
                case "Enter":
                    e.preventDefault();
                    if (filteredOptions[highlightedIndex]) {
                        handleSelect(filteredOptions[highlightedIndex]);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    setIsOpen(false);
                    setSearchTerm("");
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filteredOptions, highlightedIndex]);

    // Reset l'index surligné quand les options filtrées changent
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchTerm]);

    const handleSelect = (option: Option) => {
        onChange(option.id.toString());
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSearchTerm("");
    };

    const handleInputClick = () => {
        if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input principal */}
            <div
                onClick={handleInputClick}
                className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
                    }`}
            >
                <div className="flex items-center justify-between">
                    {isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={placeholder}
                            disabled={disabled}
                            className="flex-1 bg-transparent outline-none"
                            autoFocus
                        />
                    ) : (
                        <span className={selectedOption ? "" : "text-gray-400"}>
                            {selectedOption
                                ? `${selectedOption.full_name}${selectedOption.role ? ` (${selectedOption.role})` : ""}`
                                : placeholder}
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        {selectedOption && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                        <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                            {emptyMessage}
                        </div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.id}
                                onClick={() => handleSelect(option)}
                                className={`px-4 py-3 cursor-pointer transition ${index === highlightedIndex
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                    } ${option.id.toString() === value
                                        ? "bg-primary/5 font-medium"
                                        : ""
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{option.full_name}</span>
                                    {option.role && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {option.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Input caché pour la compatibilité avec les formulaires */}
            <input type="hidden" name={name} value={value} />
        </div>
    );
}
