"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { leavesService, LeaveMessage } from "@/services/leaves.service";
import { useToast } from "@/hooks/useToast";

interface LeaveDiscussionProps {
  leaveId: number;
  currentUserId: number | null;
  canPost?: boolean;
  defaultOpen?: boolean;
  className?: string;
  title?: string;
}

const MAX_MESSAGE_LENGTH = 2000;

export function LeaveDiscussion({
  leaveId,
  currentUserId,
  canPost = true,
  defaultOpen = false,
  className,
  title = "Discussion",
}: LeaveDiscussionProps) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<LeaveMessage[] | null>(null);
  const [draft, setDraft] = useState("");

  const messageCount = messages?.length ?? 0;

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await leavesService.getLeaveMessages(leaveId);
      if (response.success) {
        const payload = Array.isArray(response.data)
          ? (response.data as LeaveMessage[])
          : [];
        setMessages(
          payload.map((item) => ({
            ...item,
            message: item.message ?? "",
          })),
        );
      } else {
        toast.error(
          response.message || "Impossible de recuperer la discussion.",
        );
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load leave messages", error);
      toast.error("Erreur lors du chargement de la discussion.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [leaveId, toast]);

  useEffect(() => {
    if (isOpen && messages === null && !loading) {
      void loadMessages();
    }
  }, [isOpen, loadMessages, loading, messages]);

  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true);
    }
  }, [defaultOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ leaveId?: number }>;
      if (customEvent.detail?.leaveId !== leaveId) {
        return;
      }

      void loadMessages();
    };

    window.addEventListener('hrms:leave-messages-updated', handler as EventListener);
    return () => {
      window.removeEventListener('hrms:leave-messages-updated', handler as EventListener);
    };
  }, [isOpen, leaveId, loadMessages]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = draft.trim();
      if (trimmed.length === 0) {
        toast.warning("Veuillez saisir un message.");
        return;
      }
      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        toast.warning("Votre message est trop long.");
        return;
      }

      try {
        setSending(true);
        const response = await leavesService.createLeaveMessage(
          leaveId,
          trimmed,
        );
        if (response.success) {
          const created = response.data as LeaveMessage;
          setMessages((prev) => [...(prev ?? []), created]);
          setDraft("");

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('hrms:leave-messages-updated', { detail: { leaveId } }));
            window.dispatchEvent(new CustomEvent('hrms:leave-approvals-updated'));
          }
        } else {
          toast.error(
            response.message || "Impossible d envoyer le message.",
          );
        }
      } catch (error) {
        console.error("Failed to send leave message", error);
        toast.error("Erreur lors de l envoi du message.");
      } finally {
        setSending(false);
      }
    },
    [draft, leaveId, toast],
  );

  const formattedMessages = useMemo(
    () =>
      (messages ?? []).map((message) => {
        const authorName =
          message.author?.full_name || `Utilisateur #${message.author_user_id}`;
        const timestamp = message.created_at
          ? new Date(message.created_at).toLocaleString("fr-FR")
          : "";
        const isCurrentUser = currentUserId === message.author_user_id;
        return {
          ...message,
          authorName,
          timestamp,
          isCurrentUser,
        };
      }),
    [currentUserId, messages],
  );

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <span>
          {title}
          {messageCount > 0 ? ` (${messageCount})` : ""}
        </span>
        <svg
          className={`h-4 w-4 transform transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chargement de la discussion...
            </p>
          )}

          {!loading && formattedMessages.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun message pour le moment.
            </p>
          )}

          {!loading && formattedMessages.length > 0 && (
            <ul className="space-y-3">
              {formattedMessages.map((message) => (
                <li
                  key={message.id}
                  className={`flex flex-col gap-1 ${message.isCurrentUser ? "items-end text-right" : "items-start text-left"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.isCurrentUser
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-100"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <p className="font-medium text-xs text-gray-500 dark:text-gray-400">
                      {message.authorName}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm">
                      {message.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {message.timestamp}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {canPost && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ecrire un message"
                maxLength={MAX_MESSAGE_LENGTH}
                className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-200 dark:focus:border-primary"
                rows={3}
              />
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{draft.length}/{MAX_MESSAGE_LENGTH}</span>
                <button
                  type="submit"
                  disabled={sending || draft.trim().length === 0}
                  className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

