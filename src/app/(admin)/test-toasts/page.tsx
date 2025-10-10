"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useToast } from "@/hooks/useToast";
import React from "react";

export default function TestToasts() {
  const toast = useToast();

  const showSuccessToast = () => {
    toast.success("Opération réussie ! Utilisateur créé avec succès.");
  };

  const showErrorToast = () => {
    toast.error("Erreur ! Impossible de supprimer cet élément.");
  };

  const showInfoToast = () => {
    toast.info("Information : Nouvelle fonctionnalité disponible !");
  };

  const showWarningToast = () => {
    toast.warning("Attention ! Cette action ne peut pas être annulée.");
  };

  const showLoadingToast = () => {
    const loadingId = toast.loading("Chargement en cours...");
    
    setTimeout(() => {
      toast.dismiss(loadingId);
      toast.success("Chargement terminé !");
    }, 3000);
  };

  const showPromiseToast = () => {
    const promiseExample = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve("Données sauvegardées !");
        } else {
          reject(new Error("Erreur de sauvegarde"));
        }
      }, 2000);
    });

    toast.promise(promiseExample, {
      loading: "Sauvegarde en cours...",
      success: "Sauvegarde réussie !",
      error: "Erreur lors de la sauvegarde",
    });
  };

  const showCustomPositionToast = () => {
    toast.success("Toast en bas à gauche !", { position: "bottom-left" });
  };

  const showLongDurationToast = () => {
    toast.info("Ce toast reste affiché 10 secondes", { duration: 10000 });
  };

  const dismissAllToasts = () => {
    toast.dismiss();
    toast.info("Tous les toasts ont été supprimés !");
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Test des Toasts" />
      
      <div className="space-y-6">
        <ComponentCard title="Types de Toasts">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={showSuccessToast}
              className="inline-flex items-center justify-center rounded-md bg-success px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Toast Succès
            </button>

            <button
              onClick={showErrorToast}
              className="inline-flex items-center justify-center rounded-md bg-danger px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Toast Erreur
            </button>

            <button
              onClick={showInfoToast}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Toast Info
            </button>

            <button
              onClick={showWarningToast}
              className="inline-flex items-center justify-center rounded-md bg-warning px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Toast Warning
            </button>

            <button
              onClick={showLoadingToast}
              className="inline-flex items-center justify-center rounded-md bg-secondary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              <svg className="mr-2 h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Toast Loading
            </button>

            <button
              onClick={showPromiseToast}
              className="inline-flex items-center justify-center rounded-md bg-meta-3 px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Toast Promise
            </button>
          </div>
        </ComponentCard>

        <ComponentCard title="Options Avancées">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={showCustomPositionToast}
              className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-white px-6 py-3 text-center font-medium text-primary hover:bg-primary hover:text-white dark:bg-boxdark transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Position Custom
            </button>

            <button
              onClick={showLongDurationToast}
              className="inline-flex items-center justify-center rounded-md border-2 border-warning bg-white px-6 py-3 text-center font-medium text-warning hover:bg-warning hover:text-white dark:bg-boxdark transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Durée Longue
            </button>

            <button
              onClick={dismissAllToasts}
              className="inline-flex items-center justify-center rounded-md border-2 border-danger bg-white px-6 py-3 text-center font-medium text-danger hover:bg-danger hover:text-white dark:bg-boxdark transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer Tous
            </button>
          </div>
        </ComponentCard>

        <ComponentCard title="Guide d'Utilisation">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Comment utiliser les Toasts dans l'application
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-black dark:text-white mb-2">1. Importer le hook</h4>
                <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  import {`{ useToast }`} from "@/hooks/useToast";
                </code>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-black dark:text-white mb-2">2. Utiliser dans le composant</h4>
                <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  const toast = useToast();
                </code>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-black dark:text-white mb-2">3. Afficher des notifications</h4>
                <div className="space-y-2 text-sm">
                  <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">toast.success("Message de succès")</code></div>
                  <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">toast.error("Message d'erreur")</code></div>
                  <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">toast.info("Message d'information")</code></div>
                  <div><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">toast.warning("Message d'avertissement")</code></div>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
