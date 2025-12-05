"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TagSelect, { TagBadges } from "@/components/common/TagSelect";
import { Tag, tagsService } from "@/services/tags.service";
import {
  projectsService,
  Project,
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  CreateProjectPayload,
} from "@/services/projects.service";

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TaskIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

export default function ProjectsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateProjectPayload>({
    name: "",
    description: "",
    status: "PLANNED",
    start_date: "",
    end_date: "",
  });
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [projectTags, setProjectTags] = useState<Record<number, Tag[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsService.getProjects();
      setProjects(data);
      
      // Charger les tags de chaque projet
      const tagsMap: Record<number, Tag[]> = {};
      for (const project of data) {
        try {
          const tags = await tagsService.getProjectTags(project.id);
          tagsMap[project.id] = tags.map(t => t.tag);
        } catch {
          tagsMap[project.id] = [];
        }
      }
      setProjectTags(tagsMap);
    } catch (error) {
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    try {
      setSubmitting(true);
      const result = await projectsService.createProject(formData);
      
      // Assigner les tags au nouveau projet
      if (selectedTags.length > 0 && result.data?.id) {
        await tagsService.setProjectTags(result.data.id, selectedTags.map(t => t.id));
      }
      
      toast.success("Projet créé avec succès");
      setShowForm(false);
      setFormData({ name: "", description: "", status: "PLANNED", start_date: "", end_date: "" });
      setSelectedTags([]);
      loadProjects();
    } catch (error) {
      toast.error("Erreur lors de la création du projet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;

    try {
      await projectsService.deleteProject(id);
      toast.success("Projet supprimé");
      loadProjects();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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
      <PageBreadcrumb pageTitle="Projets" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Mes Projets ({projects.length})
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez vos projets et suivez les tâches de votre équipe
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <PlusIcon />
            Nouveau projet
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Créer un nouveau projet
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Nom du projet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Description du projet..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <TagSelect
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Ajouter des tags..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Création..." : "Créer le projet"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <FolderIcon />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucun projet
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Créez votre premier projet pour commencer à organiser vos tâches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <FolderIcon />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLORS[project.status]}`}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </div>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Tags */}
                {projectTags[project.id] && projectTags[project.id].length > 0 && (
                  <div className="mb-3">
                    <TagBadges tags={projectTags[project.id]} />
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <UsersIcon />
                    {project.memberCount || 0} membres
                  </span>
                  <span className="flex items-center gap-1">
                    <TaskIcon />
                    {project.taskCount || 0} tâches
                  </span>
                </div>

                {/* Members avatars */}
                {project.project_member && project.project_member.length > 0 && (
                  <div className="flex -space-x-2 mb-4 overflow-hidden">
                    {project.project_member.slice(0, 5).map((member, index) => {
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                      const bgColor = colors[index % colors.length];
                      return (
                        <div
                          key={member.id}
                          className={`w-8 h-8 rounded-full ${bgColor} border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-white overflow-hidden flex-shrink-0`}
                          title={member.user?.full_name || 'Membre'}
                        >
                          {member.user?.profile_photo_url ? (
                            <img
                              src={member.user.profile_photo_url}
                              alt={member.user.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            (member.user?.full_name || 'M').charAt(0).toUpperCase()
                          )}
                        </div>
                      );
                    })}
                    {project.project_member.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                        +{project.project_member.length - 5}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Ouvrir
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
