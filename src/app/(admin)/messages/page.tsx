"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  messagesService,
  Conversation,
  Message,
  User,
} from "@/services/messages.service";

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function MessagesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await messagesService.getConversations();
      setConversations(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des conversations");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setLoadingMessages(true);
      const data = await messagesService.getMessages(conversationId);
      setMessages(data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [toast]);

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await loadMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const message = await messagesService.sendMessage({
        content: newMessage.trim(),
        conversation_id: selectedConversation.id,
      });
      setMessages([...messages, message]);
      setNewMessage("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      loadConversations();
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const users = await messagesService.searchUsers(query);
      setSearchResults(users);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (targetUser: User) => {
    try {
      const conversation = await messagesService.createConversation({
        participant_ids: [targetUser.id],
      });
      setShowNewConversation(false);
      setSearchQuery("");
      setSearchResults([]);
      await loadConversations();
      setSelectedConversation(conversation);
      await loadMessages(conversation.id);
    } catch (error) {
      toast.error("Erreur lors de la création de la conversation");
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.participants && conv.participants.length > 0) {
      return conv.participants.map(p => p.full_name).join(", ");
    }
    return "Conversation";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.participants && conv.participants.length > 0) {
      const participant = conv.participants[0];
      if (participant.profile_photo_url) {
        return (
          <img
            src={participant.profile_photo_url}
            alt={participant.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        );
      }
      return (
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
          {participant.full_name.charAt(0).toUpperCase()}
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Messagerie" />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[calc(100vh-200px)] min-h-[500px]">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white">Messages</h2>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Nouvelle conversation"
                >
                  <PlusIcon />
                </button>
              </div>

              {/* New Conversation Modal */}
              {showNewConversation && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md m-4 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Nouvelle conversation
                      </h3>
                      <button
                        onClick={() => {
                          setShowNewConversation(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchUsers(e.target.value);
                        }}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <SearchIcon />
                    </div>
                    <div className="mt-3 max-h-60 overflow-y-auto">
                      {searching ? (
                        <div className="text-center py-4 text-gray-500">Recherche...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => startConversation(u)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                              {u.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {u.full_name}
                              </div>
                              {u.work_email && (
                                <div className="text-sm text-gray-500">{u.work_email}</div>
                              )}
                            </div>
                          </button>
                        ))
                      ) : searchQuery.length >= 2 ? (
                        <div className="text-center py-4 text-gray-500">Aucun résultat</div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Tapez au moins 2 caractères
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune conversation</p>
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="mt-2 text-primary hover:underline"
                  >
                    Démarrer une conversation
                  </button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${
                      selectedConversation?.id === conv.id
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : ""
                    }`}
                  >
                    {getConversationAvatar(conv)}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {getConversationName(conv)}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  {getConversationAvatar(selectedConversation)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {getConversationName(selectedConversation)}
                    </h3>
                    {selectedConversation.participants && (
                      <p className="text-sm text-gray-500">
                        {selectedConversation.participants.length} participant(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucun message. Commencez la conversation !
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender_user_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                            }`}
                          >
                            {!isOwn && message.user_user_message_sender_user_idTouser && (
                              <div className="text-xs font-medium mb-1 opacity-75">
                                {message.user_user_message_sender_user_idTouser.full_name}
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <div className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-500"}`}>
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
