"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  taskFeaturesService,
  TaskComment,
  TaskAttachment,
  TaskChecklist,
  TaskActivity,
  TaskWithDetails,
} from "@/services/taskFeatures.service";
import { employeesService, Employee } from "@/services/employees.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const PaperclipIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const ChecklistIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SubtaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

interface TaskDetailModalProps {
  taskId: number;
  taskTitle: string;
  taskDescription?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

type Tab = "comments" | "checklists" | "attachments" | "subtasks" | "activity";

export default function TaskDetailModal({
  taskId,
  taskTitle,
  taskDescription,
  isOpen,
  onClose,
  onUpdate,
}: TaskDetailModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [loading, setLoading] = useState(false);

  // Data states
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [subtasks, setSubtasks] = useState<TaskWithDetails[]>([]);

  // Mentions states
  const [users, setUsers] = useState<Employee[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Form states
  const [newComment, setNewComment] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemTitles, setNewItemTitles] = useState<Record<number, string>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssignees, setNewSubtaskAssignees] = useState<number[]>([]);
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [showNewSubtask, setShowNewSubtask] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<any>(null);
  const [editSubtaskAssignees, setEditSubtaskAssignees] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && taskId) {
      loadData();
    }
  }, [isOpen, taskId, activeTab]);

  // Charger les utilisateurs pour les mentions
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await employeesService.getEmployees({ limit: 100 });
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "comments":
          const commentsData = await taskFeaturesService.getComments(taskId);
          setComments(commentsData);
          break;
        case "attachments":
          const attachmentsData = await taskFeaturesService.getAttachments(taskId);
          setAttachments(attachmentsData);
          break;
        case "checklists":
          const checklistsData = await taskFeaturesService.getChecklists(taskId);
          setChecklists(checklistsData);
          break;
        case "activity":
          const activitiesData = await taskFeaturesService.getActivities(taskId);
          setActivities(activitiesData);
          break;
        case "subtasks":
          const subtasksData = await taskFeaturesService.getSubtasks(taskId);
          setSubtasks(subtasksData);
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // COMMENTAIRES
  // ============================================

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await taskFeaturesService.addComment(taskId, newComment);
      setComments([comment, ...comments]);
      setNewComment("");
      toast.success("Commentaire ajouté");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      await taskFeaturesService.deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success("Commentaire supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // ============================================
  // MENTIONS (@utilisateur)
  // ============================================

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setNewComment(value);
    setCursorPosition(position);

    // Détecter si on tape @ pour afficher les suggestions
    const textBeforeCursor = value.substring(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Vérifier qu'il n'y a pas d'espace après le @
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddComment();
      }
      return;
    }

    const filteredUsers = users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(mentionSearch)
    );

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setMentionIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setMentionIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (filteredUsers[mentionIndex]) {
          insertMention(filteredUsers[mentionIndex]);
        }
        break;
      case "Escape":
        setShowMentions(false);
        break;
    }
  };

  const insertMention = (employee: Employee) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = newComment.substring(cursorPosition);
    
    // Utiliser full_name sans espaces pour la mention
    const mentionName = (employee.full_name || "user").replace(/\s+/g, "_");
    const newText = 
      textBeforeCursor.substring(0, lastAtIndex) + 
      `@${mentionName} ` + 
      textAfterCursor;
    
    setNewComment(newText);
    setShowMentions(false);
    
    // Remettre le focus sur le textarea
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        const newPosition = lastAtIndex + mentionName.length + 2;
        commentInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const filteredMentionUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(mentionSearch)
  ).slice(0, 5);

  // Fonction pour afficher le contenu avec les mentions stylées
  const renderCommentContent = (content: string) => {
    // Capture @Nom_Prenom ou @nom
    const parts = content.split(/(@[\w_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        // Remplacer les underscores par des espaces pour l'affichage
        const displayName = part.substring(1).replace(/_/g, " ");
        return (
          <span key={index} className="text-primary font-medium bg-primary/10 px-1 rounded cursor-pointer hover:bg-primary/20">
            @{displayName}
          </span>
        );
      }
      return part;
    });
  };

  // ============================================
  // PIÈCES JOINTES
  // ============================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const attachment = await taskFeaturesService.uploadAttachment(taskId, file);
      setAttachments([attachment, ...attachments]);
      toast.success("Fichier uploadé");
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Supprimer cette pièce jointe ?")) return;
    try {
      await taskFeaturesService.deleteAttachment(attachmentId);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      toast.success("Fichier supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // ============================================
  // CHECKLISTS
  // ============================================

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      const checklist = await taskFeaturesService.createChecklist(taskId, newChecklistTitle);
      setChecklists([...checklists, checklist]);
      setNewChecklistTitle("");
      setShowNewChecklist(false);
      toast.success("Checklist créée");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    if (!confirm("Supprimer cette checklist ?")) return;
    try {
      await taskFeaturesService.deleteChecklist(checklistId);
      setChecklists(checklists.filter((c) => c.id !== checklistId));
      toast.success("Checklist supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleAddChecklistItem = async (checklistId: number) => {
    const title = newItemTitles[checklistId];
    if (!title?.trim()) return;
    try {
      const item = await taskFeaturesService.addChecklistItem(checklistId, title);
      setChecklists(
        checklists.map((c) =>
          c.id === checklistId ? { ...c, items: [...c.items, item] } : c
        )
      );
      setNewItemTitles({ ...newItemTitles, [checklistId]: "" });
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleToggleItem = async (checklistId: number, itemId: number) => {
    try {
      const updatedItem = await taskFeaturesService.toggleChecklistItem(itemId);
      setChecklists(
        checklists.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) => (i.id === itemId ? updatedItem : i)),
              }
            : c
        )
      );
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteItem = async (checklistId: number, itemId: number) => {
    try {
      await taskFeaturesService.deleteChecklistItem(itemId);
      setChecklists(
        checklists.map((c) =>
          c.id === checklistId
            ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
            : c
        )
      );
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // ============================================
  // SOUS-TÂCHES
  // ============================================

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      const subtask = await taskFeaturesService.createSubtask(taskId, {
        title: newSubtaskTitle,
        assignee_ids: newSubtaskAssignees.length > 0 ? newSubtaskAssignees : undefined,
      });
      setSubtasks([...subtasks, subtask]);
      setNewSubtaskTitle("");
      setNewSubtaskAssignees([]);
      setShowNewSubtask(false);
      toast.success("Sous-tâche créée");
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const toggleSubtaskAssignee = (userId: number) => {
    if (newSubtaskAssignees.includes(userId)) {
      setNewSubtaskAssignees(newSubtaskAssignees.filter(id => id !== userId));
    } else {
      setNewSubtaskAssignees([...newSubtaskAssignees, userId]);
    }
  };

  const toggleEditSubtaskAssignee = (userId: number) => {
    if (editSubtaskAssignees.includes(userId)) {
      setEditSubtaskAssignees(editSubtaskAssignees.filter(id => id !== userId));
    } else {
      setEditSubtaskAssignees([...editSubtaskAssignees, userId]);
    }
  };

  const handleEditSubtask = (subtask: any) => {
    setEditingSubtask({ ...subtask });
    const currentAssignees = subtask.task_assignment?.map((a: any) => a.user?.id) || [];
    setEditSubtaskAssignees(currentAssignees);
  };

  const handleUpdateSubtask = async () => {
    if (!editingSubtask) return;
    try {
      const updated = await taskFeaturesService.updateSubtask(editingSubtask.id, {
        title: editingSubtask.title,
        status: editingSubtask.status,
        priority: editingSubtask.priority,
        assignee_ids: editSubtaskAssignees,
      });
      setSubtasks(subtasks.map(s => s.id === updated.id ? updated : s));
      setEditingSubtask(null);
      setEditSubtaskAssignees([]);
      toast.success("Sous-tâche mise à jour");
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!confirm("Supprimer cette sous-tâche ?")) return;
    try {
      await taskFeaturesService.deleteSubtask(subtaskId);
      setSubtasks(subtasks.filter(s => s.id !== subtaskId));
      toast.success("Sous-tâche supprimée");
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleSubtaskStatus = async (subtask: any) => {
    const newStatus = subtask.status === "DONE" ? "TODO" : "DONE";
    try {
      const updated = await taskFeaturesService.updateSubtask(subtask.id, {
        status: newStatus,
      });
      setSubtasks(subtasks.map(s => s.id === updated.id ? updated : s));
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType?.startsWith("image/")) return "🖼️";
    if (fileType?.includes("pdf")) return "📄";
    if (fileType?.includes("word") || fileType?.includes("document")) return "📝";
    if (fileType?.includes("excel") || fileType?.includes("spreadsheet")) return "📊";
    return "📎";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATED": return "🆕";
      case "UPDATED": return "✏️";
      case "MOVED": return "➡️";
      case "COMMENTED": return "💬";
      case "ASSIGNED": return "👤";
      case "ATTACHMENT_ADDED": return "📎";
      case "ATTACHMENT_REMOVED": return "🗑️";
      case "CHECKLIST_ADDED": return "☑️";
      case "CHECKLIST_REMOVED": return "❌";
      case "SUBTASK_ADDED": return "📋";
      default: return "📝";
    }
  };

  const getActivityText = (activity: TaskActivity) => {
    switch (activity.action) {
      case "CREATED": return "a créé cette tâche";
      case "UPDATED": return `a modifié ${activity.field || "la tâche"}`;
      case "MOVED": return `a déplacé vers ${activity.new_value}`;
      case "COMMENTED": return "a ajouté un commentaire";
      case "ASSIGNED": return `a assigné ${activity.new_value}`;
      case "ATTACHMENT_ADDED": return `a ajouté ${activity.new_value}`;
      case "ATTACHMENT_REMOVED": return `a supprimé ${activity.old_value}`;
      case "CHECKLIST_ADDED": return `a créé la checklist "${activity.new_value}"`;
      case "CHECKLIST_REMOVED": return `a supprimé la checklist "${activity.old_value}"`;
      case "SUBTASK_ADDED": return `a créé la sous-tâche "${activity.new_value}"`;
      default: return activity.action;
    }
  };

  const tabs = [
    { id: "comments" as Tab, label: "Commentaires", icon: <ChatIcon />, count: comments.length },
    { id: "checklists" as Tab, label: "Checklists", icon: <ChecklistIcon />, count: checklists.length },
    { id: "attachments" as Tab, label: "Fichiers", icon: <PaperclipIcon />, count: attachments.length },
    { id: "subtasks" as Tab, label: "Sous-tâches", icon: <SubtaskIcon />, count: subtasks.length },
    { id: "activity" as Tab, label: "Activité", icon: <ClockIcon /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{taskTitle}</h2>
              {taskDescription && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">{taskDescription}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XIcon />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* COMMENTAIRES */}
                {activeTab === "comments" && (
                  <div className="space-y-4">
                    {/* Nouveau commentaire */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                        {user?.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 relative">
                        <textarea
                          ref={commentInputRef}
                          value={newComment}
                          onChange={handleCommentChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Ajouter un commentaire... (tapez @ pour mentionner)"
                          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary/50"
                          rows={3}
                        />
                        
                        {/* Dropdown des mentions */}
                        {showMentions && filteredMentionUsers.length > 0 && (
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                            {filteredMentionUsers.map((emp, index) => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => insertMention(emp)}
                                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                  index === mentionIndex ? "bg-primary/10" : ""
                                }`}
                              >
                                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-medium">
                                  {emp.full_name?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {emp.full_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {emp.position?.title || "Employé"}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            💡 Tapez @ pour mentionner quelqu'un
                          </span>
                          <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                          >
                            <SendIcon />
                            Envoyer
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Liste des commentaires */}
                    <div className="space-y-4 mt-6">
                      {comments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Aucun commentaire</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                              {comment.user?.full_name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {comment.user?.full_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                              <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {renderCommentContent(comment.content)}
                              </p>
                              {comment.user_id === user?.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* CHECKLISTS */}
                {activeTab === "checklists" && (
                  <div className="space-y-6">
                    {checklists.map((checklist) => {
                      const completedCount = checklist.items.filter((i) => i.is_completed).length;
                      const progress = checklist.items.length > 0
                        ? Math.round((completedCount / checklist.items.length) * 100)
                        : 0;

                      return (
                        <div key={checklist.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <ChecklistIcon />
                              {checklist.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {completedCount}/{checklist.items.length}
                              </span>
                              <button
                                onClick={() => handleDeleteChecklist(checklist.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full mb-3">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
                            {checklist.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 group"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.is_completed}
                                  onChange={() => handleToggleItem(checklist.id, item.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span
                                  className={`flex-1 ${
                                    item.is_completed
                                      ? "line-through text-gray-400"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {item.title}
                                </span>
                                <button
                                  onClick={() => handleDeleteItem(checklist.id, item.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add item */}
                          <div className="flex gap-2 mt-3">
                            <input
                              type="text"
                              value={newItemTitles[checklist.id] || ""}
                              onChange={(e) =>
                                setNewItemTitles({
                                  ...newItemTitles,
                                  [checklist.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddChecklistItem(checklist.id);
                              }}
                              placeholder="Ajouter un élément..."
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                            <button
                              onClick={() => handleAddChecklistItem(checklist.id)}
                              className="px-3 py-2 bg-primary text-white rounded-lg text-sm"
                            >
                              <PlusIcon />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Nouvelle checklist */}
                    {showNewChecklist ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newChecklistTitle}
                          onChange={(e) => setNewChecklistTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateChecklist();
                            if (e.key === "Escape") setShowNewChecklist(false);
                          }}
                          placeholder="Nom de la checklist..."
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          autoFocus
                        />
                        <button
                          onClick={handleCreateChecklist}
                          className="px-4 py-2 bg-primary text-white rounded-lg"
                        >
                          Créer
                        </button>
                        <button
                          onClick={() => setShowNewChecklist(false)}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewChecklist(true)}
                        className="flex items-center gap-2 text-primary hover:text-primary/80"
                      >
                        <PlusIcon />
                        Ajouter une checklist
                      </button>
                    )}
                  </div>
                )}

                {/* PIÈCES JOINTES */}
                {activeTab === "attachments" && (
                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary w-full justify-center"
                    >
                      <PlusIcon />
                      Ajouter un fichier
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {attachments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 col-span-2">
                          Aucune pièce jointe
                        </p>
                      ) : (
                        attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
                          >
                            <span className="text-2xl">
                              {getFileIcon(attachment.file_type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {attachment.file_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(attachment.file_size)} • {formatDate(attachment.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SOUS-TÂCHES */}
                {activeTab === "subtasks" && (
                  <div className="space-y-4">
                    {subtasks.map((subtask: any) => (
                      <div
                        key={subtask.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
                      >
                        {editingSubtask?.id === subtask.id ? (
                          // Mode édition
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingSubtask.title}
                              onChange={(e) => setEditingSubtask({ ...editingSubtask, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                            <div className="flex gap-2">
                              <select
                                value={editingSubtask.status}
                                onChange={(e) => setEditingSubtask({ ...editingSubtask, status: e.target.value })}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                              >
                                <option value="TODO">À faire</option>
                                <option value="IN_PROGRESS">En cours</option>
                                <option value="DONE">Terminé</option>
                              </select>
                              <select
                                value={editingSubtask.priority}
                                onChange={(e) => setEditingSubtask({ ...editingSubtask, priority: e.target.value })}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                              >
                                <option value="LOW">Basse</option>
                                <option value="MEDIUM">Moyenne</option>
                                <option value="HIGH">Haute</option>
                                <option value="CRITICAL">Critique</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Réassigner à :
                              </label>
                              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {users.map((emp) => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => toggleEditSubtaskAssignee(emp.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                      editSubtaskAssignees.includes(emp.id)
                                        ? "bg-primary text-white"
                                        : "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {emp.full_name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdateSubtask}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm"
                              >
                                Sauvegarder
                              </button>
                              <button
                                onClick={() => { setEditingSubtask(null); setEditSubtaskAssignees([]); }}
                                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Mode affichage
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={subtask.status === "DONE"}
                              onChange={() => handleToggleSubtaskStatus(subtask)}
                              className="w-4 h-4 rounded border-gray-300 mt-1 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span
                                className={
                                  subtask.status === "DONE"
                                    ? "line-through text-gray-400"
                                    : "text-gray-900 dark:text-white"
                                }
                              >
                                {subtask.title}
                              </span>
                              {subtask.task_assignment?.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-gray-500">Assigné à :</span>
                                  <div className="flex -space-x-2">
                                    {subtask.task_assignment.map((assignment: any) => (
                                      <div
                                        key={assignment.user?.id}
                                        className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium border-2 border-white dark:border-gray-700"
                                        title={assignment.user?.full_name}
                                      >
                                        {assignment.user?.full_name?.charAt(0) || "?"}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                                    {subtask.task_assignment.map((a: any) => a.user?.full_name).join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  subtask.priority === "HIGH" || subtask.priority === "CRITICAL"
                                    ? "bg-red-100 text-red-700"
                                    : subtask.priority === "LOW"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {subtask.priority}
                              </span>
                              <button
                                onClick={() => handleEditSubtask(subtask)}
                                className="p-1 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Modifier"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteSubtask(subtask.id)}
                                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Supprimer"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {showNewSubtask ? (
                      <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="Titre de la sous-tâche..."
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          autoFocus
                        />
                        
                        {/* Sélection des assignés */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assigner à :
                          </label>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {users.map((emp) => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => toggleSubtaskAssignee(emp.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  newSubtaskAssignees.includes(emp.id)
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                  {emp.full_name?.charAt(0) || "?"}
                                </span>
                                {emp.full_name}
                              </button>
                            ))}
                          </div>
                          {newSubtaskAssignees.length > 0 && (
                            <p className="text-xs text-primary mt-2">
                              {newSubtaskAssignees.length} personne(s) sélectionnée(s)
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleCreateSubtask}
                            disabled={!newSubtaskTitle.trim()}
                            className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                          >
                            Créer la sous-tâche
                          </button>
                          <button
                            onClick={() => {
                              setShowNewSubtask(false);
                              setNewSubtaskTitle("");
                              setNewSubtaskAssignees([]);
                            }}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewSubtask(true)}
                        className="flex items-center gap-2 text-primary hover:text-primary/80"
                      >
                        <PlusIcon />
                        Ajouter une sous-tâche
                      </button>
                    )}
                  </div>
                )}

                {/* ACTIVITÉ */}
                {activeTab === "activity" && (
                  <div className="space-y-4">
                    {activities.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Aucune activité</p>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <span className="text-lg">{getActivityIcon(activity.action)}</span>
                          <div className="flex-1">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {activity.user?.full_name}
                              </span>{" "}
                              {getActivityText(activity)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
