"use client";

import React, { useState, useEffect } from "react";
import { recruitmentService, CandidateApplication } from "@/services/recruitment.service";

interface ScheduleInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: CandidateApplication;
    onConfirm: () => void;
}

export default function ScheduleInterviewModal({ isOpen, onClose, application, onConfirm }: ScheduleInterviewModalProps) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState("VISIO");
    const [interviewerId, setInterviewerId] = useState(0);
    const [loading, setLoading] = useState(false);

    // In a real app we would fetch actual users
    // For now we mock users
    const interviewers = [
        { id: 1, name: "Jean Dupont", role: "RH" },
        { id: 2, name: "Alice Martin", role: "Manager" }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await recruitmentService.createInterview({
                applicationId: application.id,
                candidateId: application.candidate_id,
                interviewerId: interviewerId || 1, // Default to first user if not selected
                interviewDate: `${date}T${time}:00`,
                type
            });
            onConfirm();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création de l'entretien");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">📅 Planifier un entretien</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Pour {application.candidate?.first_name} {application.candidate?.last_name}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Heure</label>
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                        >
                            <option value="VISIO">Visio</option>
                            <option value="PHONE">Téléphone</option>
                            <option value="ONSITE">Présentiel</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Interviewer</label>
                        <select
                            value={interviewerId}
                            onChange={e => setInterviewerId(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                        >
                            {interviewers.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Email Preview Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-semibold mb-2">📧 Aperçu de l'email automatique :</p>
                        <div className="text-xs border-l-2 border-purple-300 pl-2 italic space-y-2">
                            <p><strong>Objet :</strong> Confirmation d'entretien - {application.candidate?.first_name} {application.candidate?.last_name}</p>
                            <hr className="my-1 border-gray-200" />
                            <p>Bonjour Mr/Mme <strong>{application.candidate?.first_name} {application.candidate?.last_name}</strong>,</p>
                            <p>Nous espérons que ce mail vous trouvera bien portant.</p>
                            <p>
                                {application.job_offer?.title
                                    ? <span>Suite à votre candidature pour le poste de <strong>{application.job_offer.title}</strong>, nous confirmons votre entretien</span>
                                    : <span>Nous confirmons votre entretien</span>
                                }
                                {type === 'VISIO' ? " en ligne" : ""} <strong>le {date ? new Date(date).toLocaleDateString() : "..."} à partir de {time || "..."}</strong>.
                            </p>
                            <p>
                                {type === 'VISIO' ? "Le lien de connexion vous sera communiqué tout à l’heure." : "L'entretien se déroulera dans nos locaux."}
                            </p>
                            <p>Merci de votre intérêt à rejoindre <strong>notre équipe</strong>.</p>
                            <p>Cordialement,</p>
                            <div className="pl-2 border-l-2 border-primary">
                                <p className="font-bold">{interviewers.find(i => i.id === interviewerId)?.name || "L'équipe RH"}</p>
                                <p className="text-gray-500">{interviewers.find(i => i.id === interviewerId)?.role || "Service Recrutement"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? "..." : "Confirmer"}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
