"use client";

import React, { useState, useEffect, useRef } from "react";
import { tagsService, Tag, TAG_COLORS } from "@/services/tags.service";

interface TagSelectProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagSelect({
  selectedTags,
  onChange,
  placeholder = "Ajouter des tags...",
  maxTags = 10,
}: TagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreate(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const tags = await tagsService.getTags();
      setAllTags(tags);
    } catch (error) {
      console.error("Erreur chargement tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  );

  const handleSelect = (tag: Tag) => {
    if (selectedTags.length >= maxTags) return;
    onChange([...selectedTags, tag]);
    setSearch("");
    setIsOpen(false);
  };

  const handleRemove = (tagId: number) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!search.trim()) return;

    try {
      const newTag = await tagsService.createTag({
        name: search.trim(),
        color: newTagColor,
      });
      setAllTags([...allTags, newTag]);
      handleSelect(newTag);
      setShowCreate(false);
      setSearch("");
    } catch (error: any) {
      console.error("Erreur création tag:", error);
    }
  };

  const showCreateOption = search.trim() && !allTags.some(
    (t) => t.name.toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Tags */}
      <div
        className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-text"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tag.id);
              }}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm dark:text-white"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">Chargement...</div>
          ) : showCreate && !showCreateOption ? null : (
            <>
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSelect(tag)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-gray-900 dark:text-white">{tag.name}</span>
                    {tag._count && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {tag._count.project_tags + tag._count.task_tags} utilisations
                      </span>
                    )}
                  </button>
                ))
              ) : !showCreateOption ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  Aucun tag trouvé
                </div>
              ) : null}

              {/* Create new tag option */}
              {showCreateOption && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {!showCreate ? (
                    <button
                      type="button"
                      onClick={() => setShowCreate(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-primary"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Créer "{search.trim()}"
                    </button>
                  ) : (
                    <div className="p-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Créer le tag "{search.trim()}"
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className={`w-6 h-6 rounded-full ${
                              newTagColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreateTag}
                          className="flex-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                        >
                          Créer
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreate(false)}
                          className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Mini version for displaying tags only
export function TagBadges({ tags }: { tags: Tag[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="px-2 py-0.5 rounded-full text-xs text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
