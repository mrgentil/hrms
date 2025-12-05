"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

interface PersonalEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  event_type: string;
  reminder_days?: number;
}

const EVENT_TYPES = [
  { value: "BIRTHDAY", label: "Anniversaire", icon: "🎂", color: "bg-pink-100 text-pink-700" },
  { value: "ANNIVERSARY", label: "Anniversaire travail", icon: "🎉", color: "bg-purple-100 text-purple-700" },
  { value: "MEETING", label: "Réunion", icon: "📅", color: "bg-blue-100 text-blue-700" },
  { value: "REMINDER", label: "Rappel", icon: "⏰", color: "bg-amber-100 text-amber-700" },
  { value: "OTHER", label: "Autre", icon: "📌", color: "bg-gray-100 text-gray-700" },
];

export default function PersonalEventsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState<PersonalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_type: "REMINDER",
    reminder_days: 1,
  });

  // Données de démonstration
  const demoEvents: PersonalEvent[] = [
    {
      id: 1,
      title: "Anniversaire de Jean",
      description: "Ne pas oublier le gâteau !",
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: "BIRTHDAY",
      reminder_days: 3,
    },
    {
      id: 2,
      title: "Réunion d'équipe",
      description: "Préparation du sprint planning",
      event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: "MEETING",
      reminder_days: 1,
    },
    {
      id: 3,
      title: "3 ans dans l'entreprise",
      description: "Anniversaire de travail",
      event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: "ANNIVERSARY",
      reminder_days: 7,
    },
  ];

  useEffect(() => {
    // Charger les événements de démo
    setEvents(demoEvents);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    const newEvent: PersonalEvent = {
      id: Date.now(),
      ...formData,
    };

    setEvents([...events, newEvent]);
    toast.success("Événement créé avec succès");
    setShowForm(false);
    setFormData({
      title: "",
      description: "",
      event_date: "",
      event_type: "REMINDER",
      reminder_days: 1,
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer cet événement ?")) return;
    setEvents(events.filter(e => e.id !== id));
    toast.success("Événement supprimé");
  };

  const getEventType = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[4];
  };

  const getDaysUntil = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Événements Personnels" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Mes Événements
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez vos rappels et événements personnels
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {showForm ? "Annuler" : "+ Nouvel événement"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Créer un événement
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Titre de l'événement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rappel (jours avant)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reminder_days}
                    onChange={(e) => setFormData({ ...formData, reminder_days: Number(e.target.value) })}
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
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Description (optionnel)"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Créer
              </button>
            </form>
          </div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-4xl">📅</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucun événement
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Créez votre premier événement personnel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events
              .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
              .map((event) => {
                const eventType = getEventType(event.event_type);
                const daysUntil = getDaysUntil(event.event_date);
                const isUpcoming = daysUntil <= (event.reminder_days || 0) && daysUntil >= 0;

                return (
                  <div
                    key={event.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border ${
                      isUpcoming
                        ? "border-amber-300 dark:border-amber-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{eventType.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${eventType.color}`}>
                            {eventType.label}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {event.description && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        {event.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        📅 {new Date(event.event_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className={`font-medium ${
                          daysUntil < 0
                            ? "text-gray-400"
                            : daysUntil === 0
                            ? "text-green-600"
                            : isUpcoming
                            ? "text-amber-600"
                            : "text-gray-600"
                        }`}
                      >
                        {daysUntil < 0
                          ? "Passé"
                          : daysUntil === 0
                          ? "Aujourd'hui !"
                          : `Dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
