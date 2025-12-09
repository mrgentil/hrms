"use client";

import React, { useState, useRef, useEffect } from "react";

interface RichCommentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (content: string, attachments: File[]) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isReply?: boolean;
  replyToName?: string;
  mentionUsers?: { id: number; name: string; avatar?: string }[];
  onMentionSelect?: (userId: number) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

// Emojis populaires par catégorie
const EMOJI_CATEGORIES = {
  "😀 Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😎", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲"],
  "👍 Gestes": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐", "🖖", "👋", "🤝", "🙏", "✍️", "💪", "👏", "🙌", "👐", "🤲", "🤜", "🤛", "✊", "👊"],
  "❤️ Coeurs": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  "🎉 Objets": ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⭐", "🌟", "✨", "💫", "🔥", "💥", "💯", "✅", "❌", "⚠️", "📌", "📍", "🔗", "💡", "📝", "📎", "📊", "📈", "📉", "🗂️", "📁", "📂"],
  "⏰ Temps": ["⏰", "⏱️", "⏲️", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "📅", "📆", "🗓️", "⌛", "⏳", "🔔", "🔕"],
};

const QUICK_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "✅", "👏", "💪", "🙏", "😂"];

export default function RichCommentEditor({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Écrivez votre commentaire...",
  submitLabel = "Envoyer",
  isReply = false,
  replyToName,
  mentionUsers = [],
  onMentionSelect,
  disabled = false,
  autoFocus = false,
}: RichCommentEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Fermer l'emoji picker en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gérer les mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    // Détecter @mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && textAfterAt.length < 20) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    
    onChange(newValue);
    
    // Repositionner le curseur après l'emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const insertMention = (user: { id: number; name: string }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    const newValue = value.substring(0, lastAtIndex) + `@${user.name} ` + value.substring(cursorPos);
    onChange(newValue);
    setShowMentions(false);
    
    if (onMentionSelect) {
      onMentionSelect(user.id);
    }

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    // Limiter à 5 fichiers max et 10MB par fichier
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024).slice(0, 5 - attachments.length);
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleSubmit = async () => {
    if (!value.trim() && attachments.length === 0) return;
    if (isSending) return;
    
    setIsSending(true);
    try {
      await onSubmit(value.trim(), attachments);
      onChange("");
      setAttachments([]);
      
      // Afficher l'indicateur de succès
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter pour envoyer
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    // Escape pour annuler
    if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  const filteredMentionUsers = mentionUsers.filter(u => 
    u.name.toLowerCase().includes(mentionSearch)
  ).slice(0, 5);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    return "📎";
  };

  return (
    <div className="relative">
      {/* Reply indicator */}
      {isReply && replyToName && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="text-blue-700 dark:text-blue-300">
            Réponse à <strong>{replyToName}</strong>
          </span>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="ml-auto text-blue-500 hover:text-blue-700"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Main editor container */}
      <div 
        className={`relative border-2 rounded-xl transition-all ${
          isDragging 
            ? "border-primary border-dashed bg-primary/5" 
            : "border-gray-200 dark:border-gray-700 focus-within:border-primary"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full px-4 pt-3 pb-2 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none"
        />

        {/* Mentions dropdown */}
        {showMentions && filteredMentionUsers.length > 0 && (
          <div className="absolute left-4 bottom-full mb-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
              Mentionner quelqu'un
            </div>
            {filteredMentionUsers.map(user => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm text-gray-900 dark:text-white">{user.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg group"
                >
                  <span className="text-lg">{getFileIcon(file)}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-1">
            {/* Quick emojis */}
            <div className="hidden sm:flex items-center gap-0.5 mr-2">
              {QUICK_EMOJIS.slice(0, 6).map(emoji => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="p-1.5 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Emoji picker button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-lg transition-colors ${
                  showEmojiPicker 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title="Ajouter un emoji"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Emoji picker dropdown */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  {/* Category tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {Object.keys(EMOJI_CATEGORIES).map(category => (
                      <button
                        key={category}
                        onClick={() => setActiveEmojiCategory(category)}
                        className={`flex-shrink-0 px-3 py-2 text-sm font-medium transition-colors ${
                          activeEmojiCategory === category
                            ? "text-primary border-b-2 border-primary bg-primary/5"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        {category.split(" ")[0]}
                      </button>
                    ))}
                  </div>

                  {/* Emoji grid */}
                  <div className="p-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJI_CATEGORIES[activeEmojiCategory as keyof typeof EMOJI_CATEGORIES].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            insertEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Joindre un fichier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            />

            {/* Mention button */}
            <button
              onClick={() => {
                const textarea = textareaRef.current;
                if (textarea) {
                  const pos = textarea.selectionStart;
                  const newValue = value.substring(0, pos) + "@" + value.substring(pos);
                  onChange(newValue);
                  setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(pos + 1, pos + 1);
                  }, 0);
                }
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Mentionner quelqu'un"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </button>
          </div>

          {/* Submit button */}
          <div className="flex items-center gap-2">
            {/* Indicateur de succès */}
            {showSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Envoyé !
              </div>
            )}
            
            {onCancel && !isSending && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={disabled || isSending || (!value.trim() && attachments.length === 0)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isSending 
                  ? "bg-primary/70 text-white cursor-wait"
                  : "bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {isSending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Envoi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {submitLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl border-2 border-dashed border-primary pointer-events-none">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-primary font-medium">Déposez vos fichiers ici</p>
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> pour envoyer • Glissez-déposez des fichiers
      </p>
    </div>
  );
}
