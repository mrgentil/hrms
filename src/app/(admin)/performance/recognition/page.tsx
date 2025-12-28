"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PerformanceService, { Recognition, Badge } from "@/services/performance.service";
import { employeesService } from "@/services/employees.service";

export default function RecognitionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"feed" | "my" | "leaderboard">("feed");
  const [feed, setFeed] = useState<Recognition[]>([]);
  const [myData, setMyData] = useState<{ sent: Recognition[]; received: Recognition[]; stats: any } | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    to_user_id: 0,
    type: "KUDOS" as "KUDOS" | "BADGE",
    badge: "",
    message: "",
    is_public: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feedRes, myRes, leaderRes, badgesRes, empRes] = await Promise.all([
        PerformanceService.getRecognitionFeed(),
        PerformanceService.getMyRecognitions(),
        PerformanceService.getLeaderboard("month"),
        PerformanceService.getBadges(),
        employeesService.getAllEmployees(),
      ]);
      setFeed(feedRes.data || []);
      setMyData(myRes.data);
      setLeaderboard(leaderRes.data || []);
      setBadges(badgesRes.data || []);
      setEmployees(empRes.filter((e: any) => e.id !== user?.id && e.active));
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to_user_id) {
      toast.error("Sélectionnez un destinataire");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Ajoutez un message");
      return;
    }
    if (formData.type === "BADGE" && !formData.badge) {
      toast.error("Sélectionnez un badge");
      return;
    }

    try {
      setSubmitting(true);
      await PerformanceService.sendRecognition(formData);
      toast.success("Reconnaissance envoyée! 🎉");
      setShowForm(false);
      setFormData({ to_user_id: 0, type: "KUDOS", badge: "", message: "", is_public: true });
      loadData();
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString("fr-FR");
  };

  const filteredEmployees = employees.filter((e) =>
    e.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const RecognitionCard = ({ item }: { item: Recognition }) => {
    const badge = badges.find((b) => b.id === item.badge);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
            {item.from_user?.profile_photo_url ? (
              <img src={item.from_user.profile_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              item.from_user?.full_name?.charAt(0) || "?"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white">
                {item.from_user?.full_name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">→</span>
              <span className="font-semibold text-primary">
                {item.to_user?.full_name}
              </span>
              {item.type === "BADGE" && badge && (
                <span className="text-xl" title={badge.name}>{badge.icon}</span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{item.message}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDate(item.created_at)}</span>
              {item.type === "BADGE" && badge && (
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                  {badge.name}
                </span>
              )}
              {item.type === "KUDOS" && (
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
                  Kudos 👏
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
      <PageBreadcrumb pageTitle="Reconnaissance" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === "feed" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
            >
              🌟 Fil public
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === "my" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
            >
              👤 Mes reconnaissances
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${activeTab === "leaderboard" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
            >
              🏆 Classement
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-500 text-white rounded-lg hover:opacity-90"
          >
            <span className="text-lg">🎉</span>
            Envoyer une reconnaissance
          </button>
        </div>

        {/* Send Recognition Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Célébrer un collègue 🎊
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destinataire *
                  </label>
                  <input
                    type="text"
                    placeholder="Rechercher un collègue..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-2"
                  />
                  {searchQuery && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                      {filteredEmployees.slice(0, 5).map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, to_user_id: emp.id });
                            setSearchQuery(emp.full_name);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${formData.to_user_id === emp.id ? "bg-primary/10" : ""
                            }`}
                        >
                          <span className="font-medium">{emp.full_name}</span>
                          <span className="text-sm text-gray-500 ml-2">{emp.position?.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "KUDOS", badge: "" })}
                      className={`flex-1 py-2 rounded-lg border transition-colors ${formData.type === "KUDOS"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      👏 Kudos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "BADGE" })}
                      className={`flex-1 py-2 rounded-lg border transition-colors ${formData.type === "BADGE"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      🏅 Badge
                    </button>
                  </div>
                </div>
              </div>

              {formData.type === "BADGE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Choisir un badge *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {badges.map((badge) => (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, badge: badge.id })}
                        className={`p-3 rounded-lg border text-center transition-all ${formData.badge === badge.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                          : "border-gray-200 dark:border-gray-600 hover:border-primary/50"
                          }`}
                      >
                        <span className="text-2xl block mb-1">{badge.icon}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{badge.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Expliquez pourquoi cette personne mérite cette reconnaissance..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_public" className="text-sm text-gray-600 dark:text-gray-400">
                  Afficher dans le fil public
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Envoi..." : "Envoyer 🎉"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div className="space-y-4">
            {feed.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-5xl mb-4">🌟</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucune reconnaissance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Soyez le premier à célébrer un collègue!
                </p>
              </div>
            ) : (
              feed.map((item) => <RecognitionCard key={item.id} item={item} />)
            )}
          </div>
        )}

        {/* My Recognitions Tab */}
        {activeTab === "my" && myData && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-primary">{myData.stats?.total_received || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Reçues</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-purple-500">{myData.stats?.total_sent || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Envoyées</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-yellow-500">{myData.stats?.kudos_received || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Kudos 👏</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-3xl font-bold text-green-500">{myData.stats?.badges_received || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Badges 🏅</div>
              </div>
            </div>

            {/* Received */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📥 Reçues</h3>
              {myData.received.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune reconnaissance reçue</p>
              ) : (
                <div className="space-y-3">
                  {myData.received.slice(0, 5).map((item) => (
                    <RecognitionCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Sent */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📤 Envoyées</h3>
              {myData.sent.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune reconnaissance envoyée</p>
              ) : (
                <div className="space-y-3">
                  {myData.sent.slice(0, 5).map((item) => (
                    <RecognitionCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">🏆 Top reconnaissances ce mois</h3>
            </div>
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Aucune donnée</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.map((entry, index) => (
                  <div key={entry.user?.id || index} className="flex items-center gap-4 p-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? "bg-yellow-400 text-yellow-900" :
                      index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-orange-400 text-orange-900" :
                          "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {entry.user?.profile_photo_url ? (
                        <img src={entry.user.profile_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        entry.user?.full_name?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{entry.user?.full_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{entry.user?.position?.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{entry.recognition_count}</div>
                      <div className="text-xs text-gray-500">reconnaissances</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
