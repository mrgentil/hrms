"use client";

import React, { useState } from "react";
import { recruitmentService, CandidateApplication } from "@/services/recruitment.service";

interface RejectApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: CandidateApplication;
    onConfirm: () => void;
}

export default function RejectApplicationModal({ isOpen, onClose, application, onConfirm }: RejectApplicationModalProps) {
    const [sendEmail, setSendEmail] = useState(true);
    const [loading, setLoading] = useState(false);

    const emailPreview = `
Bonjour ${application.candidate?.first_name},

Nous vous remercions de l'intérêt que vous portez à notre entreprise et au poste de ${application.job_offer?.title}.

Malheureusement, après une étude attentive de votre dossier, nous avons le regret de vous informer que nous ne donnerons pas suite à votre candidature pour le moment.

Nous nous permettons toutefois de conserver votre CV dans notre vivier de talents pour d'éventuelles futures opportunités correspondant à votre profil.

Nous vous souhaitons une excellente continuation dans vos recherches.

Groupe Gentil - Service Recrutement
    `;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await recruitmentService.rejectApplication(application.id, sendEmail);
            onConfirm();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Erreur lors du refus de la candidature");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>

                <h3 className="text-xl font-bold mb-2 text-center text-gray-900 dark:text-white">Refuser la candidature</h3>
                <p className="text-sm text-gray-500 mb-6 text-center">
                    Êtes-vous sûr de vouloir refuser <strong>{application.candidate?.first_name} {application.candidate?.last_name}</strong> ?
                </p>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="sendEmail"
                            checked={sendEmail}
                            onChange={e => setSendEmail(e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label htmlFor="sendEmail" className="font-medium">Envoyer un email de refus</label>
                    </div>

                    {sendEmail && (
                        <div className="mt-2 text-xs border-l-2 border-gray-300 pl-2 italic overflow-y-auto max-h-40 whitespace-pre-line">
                            <strong>Aperçu :</strong>
                            {emailPreview}
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? "..." : "Confirmer le refus"}
                    </button>
                </div>
            </div>
        </div>
    );
}
