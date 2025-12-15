"use client";

import React, { useState, useCallback } from "react";
import { recruitmentService, CVUploadResult, JobOffer } from "@/services/recruitment.service";

interface CVUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobs: JobOffer[];
    onComplete: () => void;
}

export default function CVUploadModal({ isOpen, onClose, jobs, onComplete }: CVUploadModalProps) {
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<CVUploadResult[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            f => f.type === "application/pdf"
        );
        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(
                f => f.type === "application/pdf"
            );
            setFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!selectedJobId || files.length === 0) return;

        setUploading(true);
        setProgress(0);
        setResults([]);

        try {
            const allResults: CVUploadResult[] = [];

            for (let i = 0; i < files.length; i++) {
                try {
                    const result = await recruitmentService.uploadCV(files[i], selectedJobId);
                    setResults(prev => [...prev, result]);
                } catch (error: any) {
                    console.error("Single File Upload Error:", error);
                    const errorMessage = error.response?.data?.message || error.message || "Erreur inconnue";
                    setResults(prev => [...prev, {
                        success: false,
                        filename: files[i].name,
                        error: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
                    }]);
                }
                setProgress(Math.round(((i + 1) / files.length) * 100));
            }

            setFiles([]);
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (results.length > 0) {
            onComplete();
        }
        setFiles([]);
        setResults([]);
        setProgress(0);
        setSelectedJobId(null);
        onClose();
    };

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            📁 Importer des CVs
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Uploadez des CVs PDF pour créer automatiquement des candidatures
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Résultats si terminé */}
                    {results.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{successCount}</div>
                                    <div className="text-sm text-green-600">Réussis</div>
                                </div>
                                <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                                    <div className="text-sm text-red-600">Échecs</div>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {results.map((result, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg flex items-center gap-3 ${result.success
                                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                            }`}
                                    >
                                        <span className="text-xl">{result.success ? "✅" : "❌"}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {result.filename}
                                            </p>
                                            {result.success && result.parsedData && (
                                                <div className="text-sm text-gray-500">
                                                    <p>{result.parsedData.firstName} {result.parsedData.lastName}</p>
                                                    {result.score !== undefined && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.score >= 70 ? 'bg-green-100 text-green-700' :
                                                                result.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                Score: {result.score}
                                                            </span>
                                                            {(result as any).missingSkillsConfig && (
                                                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                                                    ⚠️ Pas de compétences requises définies sur l'offre
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!result.success && (
                                                <p className="text-sm text-red-500">{result.error}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                            >
                                Terminer
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Sélection offre */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Offre d'emploi cible *
                                </label>
                                <select
                                    value={selectedJobId || ""}
                                    onChange={(e) => setSelectedJobId(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    disabled={uploading}
                                >
                                    <option value="">-- Sélectionner une offre --</option>
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.title} ({job.department}) - {job.status === 'PUBLISHED' ? '✅ Publiée' : job.status === 'DRAFT' ? '📝 Brouillon' : '🔒 Fermée'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Zone de drop */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-300 dark:border-gray-600"
                                    } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                <div className="text-4xl mb-3">📄</div>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    Glissez-déposez vos CVs ici
                                </p>
                                <p className="text-sm text-gray-400 mb-4">ou</p>
                                <label className="inline-block px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90">
                                    Parcourir les fichiers
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-3">
                                    Formats acceptés: PDF uniquement (max 10 Mo par fichier)
                                </p>
                            </div>

                            {/* Liste des fichiers */}
                            {files.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {files.length} fichier(s) sélectionné(s)
                                    </p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {files.map((file, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                            >
                                                <span className="text-xl">📄</span>
                                                <span className="flex-1 truncate text-sm">{file.name}</span>
                                                <span className="text-xs text-gray-400">
                                                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                                                </span>
                                                {!uploading && (
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Barre de progression */}
                            {uploading && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Analyse en cours...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {results.length === 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedJobId || files.length === 0 || uploading}
                            className="flex-1 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Analyse IA en cours...
                                </>
                            ) : (
                                <>
                                    🤖 Analyser avec IA
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
