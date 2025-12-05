"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  projectsService,
  Project,
  ProjectMember,
  PROJECT_STATUS_LABELS,
} from "@/services/projects.service";
import { employeesService, Employee } from "@/services/employees.service";

export default function ProjectMembersPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, employeesData] = await Promise.all([
        projectsService.getProjects(),
        employeesService.getEmployees({ limit: 100 }).then(r => r.data || []),
      ]);
      setProjects(projectsData);
      setEmployees(employeesData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedProject || !selectedEmployeeId) return;

    try {
      setAdding(true);
      await projectsService.addProjectMember(selectedProject.id, selectedEmployeeId);
      toast.success("Membre ajouté avec succès");
      setShowAddModal(false);
      setSelectedEmployeeId(null);
      // Recharger le projet
      const updatedProject = await projectsService.getProject(selectedProject.id);
      setSelectedProject(updatedProject);
      // Mettre à jour la liste des projets
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedProject) return;
    if (!confirm("Retirer ce membre du projet ?")) return;

    try {
      await projectsService.removeProjectMember(selectedProject.id, memberId);
      toast.success("Membre retiré");
      const updatedProject = await projectsService.getProject(selectedProject.id);
      setSelectedProject(updatedProject);
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getMemberIds = () => {
    if (!selectedProject?.project_member) return [];
    return selectedProject.project_member.map(m => m.user?.id).filter(Boolean) as number[];
  };

  const availableEmployees = employees.filter(e => !getMemberIds().includes(e.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Membres des Projets" />

      <div className="space-y-6">
        {/* Project Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sélectionner un projet
              </label>
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => {
                  const project = projects.find(p => p.id === Number(e.target.value));
                  setSelectedProject(project || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {selectedProject && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                + Ajouter un membre
              </button>
            )}
          </div>
        </div>

        {/* Project Info */}
        {selectedProject && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedProject.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedProject.project_member?.length || 0} membre(s)
                </p>
              </div>
              <Link
                href={`/projects/${selectedProject.id}`}
                className="text-primary hover:underline text-sm"
              >
                Voir le projet →
              </Link>
            </div>

            {/* Members Grid */}
            {selectedProject.project_member && selectedProject.project_member.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProject.project_member.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold overflow-hidden">
                        {member.user?.profile_photo_url ? (
                          <img
                            src={member.user.profile_photo_url}
                            alt={member.user.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          member.user?.full_name?.charAt(0).toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.user?.full_name || "Utilisateur"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.role || "Membre"}
                        </div>
                      </div>
                    </div>
                    {member.role !== "Owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Retirer du projet"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun membre dans ce projet
              </div>
            )}
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500">Aucun projet disponible</p>
            <Link href="/projects" className="mt-2 text-primary hover:underline inline-block">
              Créer un projet
            </Link>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ajouter un membre
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sélectionner un employé
              </label>
              <select
                value={selectedEmployeeId || ""}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Choisir un employé...</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddMember}
                disabled={!selectedEmployeeId || adding}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {adding ? "Ajout..." : "Ajouter"}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
