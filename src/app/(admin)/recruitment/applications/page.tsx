"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { recruitmentService, KanbanStage, JobOffer, Candidate, CandidateApplication } from "@/services/recruitment.service";
import CVUploadModal from "@/components/recruitment/CVUploadModal";
import ApplicationDetailModal from "@/components/recruitment/ApplicationDetailModal";
import ScheduleInterviewModal from "@/components/recruitment/ScheduleInterviewModal";
import RejectApplicationModal from "@/components/recruitment/RejectApplicationModal";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Draggable Application Card
function SortableApplication({ application, onClick, getStageColor }: { application: CandidateApplication; onClick: (app: CandidateApplication) => void; getStageColor?: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: application.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick(application)}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-3"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {application.candidate?.first_name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {application.candidate?.first_name} {application.candidate?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{application.job_offer?.title}</p>
                </div>
                {application.score !== undefined && application.score !== null && (
                    <div
                        className={`px-2 py-1 rounded-full text-xs font-bold ${application.score >= 75
                            ? "bg-green-100 text-green-700"
                            : application.score >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                        title={`Score: ${application.score}/100`}
                    >
                        {application.score}
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                    {new Date(application.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}

// Droppable Column
function KanbanColumn({ stage, applications, onClickApp }: { stage: KanbanStage; applications: CandidateApplication[]; onClickApp: (app: CandidateApplication) => void }) {
    const { setNodeRef } = useSortable({ id: stage.id });

    const getStageColor = (stageId: string) => {
        const colors: Record<string, string> = {
            NEW: "bg-blue-500",
            SCREENING: "bg-yellow-500",
            INTERVIEW: "bg-purple-500",
            OFFER: "bg-orange-500",
            HIRED: "bg-green-500",
            REJECTED: "bg-red-500",
        };
        return colors[stageId] || "bg-gray-500";
    };

    return (
        <div key={stage.id} className="w-72 flex-shrink-0 flex flex-col h-full">
            <div className={`h-1 ${getStageColor(stage.id)} rounded-t-lg`}></div>
            <div ref={setNodeRef} className="bg-gray-100 dark:bg-gray-800 rounded-b-lg p-4 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                        {applications.length}
                    </span>
                </div>

                <div className="space-y-3 min-h-[200px]">
                    <SortableContext
                        id={stage.id}
                        items={applications.map((app) => app.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {applications.map((app) => (
                            <SortableApplication
                                key={app.id}
                                application={app}
                                onClick={onClickApp}
                            />
                        ))}
                    </SortableContext>
                    {applications.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                            Déposez ici
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ApplicationsPage() {
    const [stages, setStages] = useState<KanbanStage[]>([]);
    const [jobs, setJobs] = useState<JobOffer[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Workflow tracking
    const [pendingStageChange, setPendingStageChange] = useState<{ applicationId: number, stage: string } | null>(null);

    const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [saving, setSaving] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);

    const [candidateForm, setCandidateForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        skills: "",
    });

    const [applicationForm, setApplicationForm] = useState({
        jobOfferId: 0,
        candidateId: 0,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [stagesData, jobsResponse, candidatesResponse] = await Promise.all([
                recruitmentService.getApplicationsKanban(),
                recruitmentService.getJobOffers({ limit: 100 }),
                recruitmentService.getCandidates({ limit: 100 }),
            ]);
            setStages(stagesData);
            setJobs(jobsResponse.data);
            setCandidates(candidatesResponse.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const newCandidate = await recruitmentService.createCandidate({
                first_name: candidateForm.first_name,
                last_name: candidateForm.last_name,
                email: candidateForm.email,
                phone: candidateForm.phone,
                skills: candidateForm.skills.split(",").map(s => s.trim()).filter(Boolean),
            });
            setCandidates([...candidates, newCandidate]);
            setShowCandidateModal(false);
            setCandidateForm({ first_name: "", last_name: "", email: "", phone: "", skills: "" });
            setApplicationForm({ ...applicationForm, candidateId: newCandidate.id });
            setShowApplicationModal(true);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création du candidat");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicationForm.jobOfferId || !applicationForm.candidateId) {
            alert("Veuillez sélectionner une offre et un candidat");
            return;
        }
        setSaving(true);
        try {
            await recruitmentService.createApplication(applicationForm.jobOfferId, applicationForm.candidateId);
            setShowApplicationModal(false);
            setApplicationForm({ jobOfferId: 0, candidateId: 0 });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création de la candidature");
        } finally {
            setSaving(false);
        }
    };

    const handleStageChange = async (applicationId: number, newStage: string) => {
        // --- WORKFLOW AUTOMATIONS ---

        // 1. Move to INTERVIEW -> Open Modal
        if (newStage === "INTERVIEW") {
            setPendingStageChange({ applicationId, stage: newStage });
            // Find application to pass to modal
            let app: CandidateApplication | undefined;
            for (const stage of stages) {
                const found = stage.applications.find(a => a.id === applicationId);
                if (found) app = found;
            }
            if (app) setSelectedApplication(app);
            setShowInterviewModal(true);
            return; // Stop here, wait for modal confirmation
        }

        // 2. Move to HIRED -> Trigger Onboarding
        if (newStage === "HIRED") {
            if (confirm("🎉 Félicitations ! Voulez-vous démarrer le processus d'Onboarding pour ce candidat ?")) {
                await proceedWithStageChange(applicationId, newStage);
                // Trigger onboarding logic (mock or real)
                alert("Processus d'Onboarding initié ! Le candidat a été converti en employé.");
                return;
            }
        }

        // 3. Move to REJECTED -> Open Reject Modal
        if (newStage === "REJECTED") {
            setPendingStageChange({ applicationId, stage: newStage });
            let app: CandidateApplication | undefined;
            for (const stage of stages) {
                const found = stage.applications.find(a => a.id === applicationId);
                if (found) app = found;
            }
            if (app) setSelectedApplication(app);
            setShowRejectModal(true);
            return;
        }

        await proceedWithStageChange(applicationId, newStage);
    };

    const proceedWithStageChange = async (applicationId: number, newStage: string) => {
        try {
            // Optimistic update
            const updatedStages = stages.map(stage => {
                // Remove from old stage
                const app = stage.applications.find(a => a.id === applicationId);
                if (app) {
                    return { ...stage, applications: stage.applications.filter(a => a.id !== applicationId) };
                }
                return stage;
            });

            // Find the app separately to add it to new stage
            let movedApp: CandidateApplication | undefined;
            for (const stage of stages) {
                const found = stage.applications.find(a => a.id === applicationId);
                if (found) movedApp = { ...found, stage: newStage };
            }

            if (movedApp) {
                const finalStages = updatedStages.map(stage => {
                    if (stage.id === newStage) {
                        return { ...stage, applications: [...stage.applications, movedApp!] };
                    }
                    return stage;
                });
                setStages(finalStages);
            }

            // API Call
            await recruitmentService.updateApplicationStage(applicationId, newStage);
            // Reload to ensure consistency (optional if optimistic is perfect)
            loadData();
        } catch (error) {
            console.error("Failed to update stage", error);
            loadData(); // Revert on error
        }
    };

    const handleActionStageChange = async (applicationId: number, newStage: string) => {
        try {
            if (newStage === 'REJECTED') {
                await recruitmentService.rejectApplication(applicationId, true);
            } else {
                await recruitmentService.updateApplicationStage(applicationId, newStage);
            }
            loadData();
            setSelectedApplication(null);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Erreur lors de la mise à jour du statut");
        }
    };

    const handleDeleteApplication = async (applicationId: number) => {
        try {
            await recruitmentService.deleteApplication(applicationId);
            loadData();
            setSelectedApplication(null);
        } catch (error) {
            console.error("Failed to delete application", error);
            alert("Erreur lors de la suppression");
        }
    };

    const handleRejectToPool = async (applicationId: number) => {
        try {
            // Rejeter et ajouter au vivier
            await recruitmentService.rejectApplication(applicationId, true, true);
            alert("Candidat rejeté et ajouté au vivier de talents avec succès.");
            loadData();
            setSelectedApplication(null);
        } catch (error) {
            console.error("Failed to reject to pool", error);
            alert("Erreur lors de l'opération");
        }
    };

    const findContainer = (id: number | string) => {
        if (stages.find(s => s.id === id)) {
            return id as string;
        }

        for (const stage of stages) {
            if (stage.applications.find(a => a.id === id)) {
                return stage.id;
            }
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as number);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Implementation for moving visually during drag (optional, complexity reduced for now)
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeId = active.id as number;
        const overId = over?.id;

        if (!overId) {
            setActiveId(null);
            return;
        }

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (activeContainer && overContainer && activeContainer !== overContainer) {
            // Moved to a different column
            handleStageChange(activeId, overContainer as string);
        }

        setActiveId(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Identify active application for overlay
    const activeApplication = activeId
        ? stages.flatMap(s => s.applications).find(a => a.id === activeId)
        : null;

    return (
        <div className="h-full flex flex-col">
            <PageBreadcrumb pageTitle="Candidatures" />

            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Pipeline de recrutement
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gérez vos candidatures et déplacez-les entre les étapes par simple glisser-déposer.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        📁 Importer CVs
                    </button>
                    <button
                        onClick={() => setShowCandidateModal(true)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                        + Nouveau candidat
                    </button>
                    <button
                        onClick={() => setShowApplicationModal(true)}
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                    >
                        <span className="hidden sm:inline">Nouvelle candidature</span>
                    </button>
                </div>
            </div>

            {/* Filtre par offre d'emploi */}
            <div className="mb-6 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filtrer par offre :
                </label>
                <select
                    value={selectedJobId || ""}
                    onChange={(e) => setSelectedJobId(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[250px]"
                >
                    <option value="">Toutes les offres</option>
                    {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                            {job.title} ({job.applications?.length || 0} candidats)
                        </option>
                    ))}
                </select>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max h-full">
                        {stages.map((stage) => {
                            // Filter applications based on selected Job ID
                            const filteredApps = selectedJobId
                                ? stage.applications.filter(app => app.job_offer_id === selectedJobId)
                                : stage.applications;

                            return (
                                <KanbanColumn
                                    key={stage.id}
                                    stage={stage}
                                    applications={filteredApps}
                                    onClickApp={(app) => setSelectedApplication(app)}
                                />
                            );
                        })}
                    </div>
                </div>

                <DragOverlay>
                    {activeApplication ? (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-xl border-2 border-primary rotate-3 cursor-grabbing opacity-90 w-72">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {activeApplication.candidate?.first_name?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                        {activeApplication.candidate?.first_name} {activeApplication.candidate?.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{activeApplication.job_offer?.title}</p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Modal Nouveau Candidat */}
            {showCandidateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Nouveau Candidat
                        </h2>
                        <form onSubmit={handleCreateCandidate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={candidateForm.first_name}
                                        onChange={(e) => setCandidateForm({ ...candidateForm, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nom *</label>
                                    <input
                                        type="text"
                                        required
                                        value={candidateForm.last_name}
                                        onChange={(e) => setCandidateForm({ ...candidateForm, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={candidateForm.email}
                                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={candidateForm.phone}
                                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Compétences (séparées par virgule)</label>
                                <input
                                    type="text"
                                    value={candidateForm.skills}
                                    onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })}
                                    placeholder="React, Node.js, TypeScript"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCandidateModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                                    {saving ? "..." : "Créer & Postuler"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Nouvelle Candidature */}
            {showApplicationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Nouvelle Candidature
                        </h2>
                        <form onSubmit={handleCreateApplication} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Offre d'emploi *</label>
                                <select
                                    required
                                    value={applicationForm.jobOfferId}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, jobOfferId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>-- Sélectionner une offre --</option>
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id}>{job.title} ({job.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Candidat *</label>
                                <select
                                    required
                                    value={applicationForm.candidateId}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, candidateId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>-- Sélectionner un candidat --</option>
                                    {candidates.map((c) => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowApplicationModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                                    {saving ? "..." : "Créer la candidature"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import CVs */}
            <CVUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                jobs={jobs}
                onComplete={loadData}
            />

            {/* Modal Détail Application */}
            {selectedApplication && (
                <ApplicationDetailModal
                    isOpen={!!selectedApplication}
                    onClose={() => setSelectedApplication(null)}
                    application={selectedApplication}
                    onStageChange={handleActionStageChange}
                    onDelete={handleDeleteApplication}
                    onRejectToPool={handleRejectToPool}
                />
            )}

            {/* Modal Planification Entretien */}
            {selectedApplication && (
                <ScheduleInterviewModal
                    isOpen={showInterviewModal}
                    onClose={() => {
                        setShowInterviewModal(false);
                        setPendingStageChange(null);
                    }}
                    application={selectedApplication}
                    onConfirm={() => {
                        if (pendingStageChange) {
                            proceedWithStageChange(pendingStageChange.applicationId, pendingStageChange.stage);
                        }
                    }}
                />
            )}

            {/* Modal Refus */}
            {selectedApplication && (
                <RejectApplicationModal
                    isOpen={showRejectModal}
                    onClose={() => {
                        setShowRejectModal(false);
                        setPendingStageChange(null);
                    }}
                    application={selectedApplication}
                    onConfirm={() => {
                        loadData();
                    }}
                />
            )}
        </div>
    );
}


