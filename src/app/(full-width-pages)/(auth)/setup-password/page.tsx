"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function SetupPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            toast.error("Token manquant");
            setVerifying(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await axios.get(`${API_URL}/auth/verify-invitation/${token}`);
                setUser(response.data);
            } catch (err) {
                toast.error("Lien d'invitation invalide ou expiré");
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }

        if (password.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/setup-password`, {
                token,
                password,
            });
            toast.success("Mot de passe configuré avec succès ! Connectez-vous maintenant.");
            router.push("/signin");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-gray-600 dark:text-gray-400">Vérification de l&apos;invitation...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Lien invalide</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Ce lien d&apos;invitation est invalide ou a expiré. Veuillez contacter votre administrateur.
                </p>
                <button
                    onClick={() => router.push("/signin")}
                    className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
                >
                    Retour à la connexion
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Configurez votre compte</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Bonjour <span className="font-semibold">{user.full_name}</span>, veuillez choisir un mot de passe pour sécuriser votre accès.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Nouveau mot de passe
                    </label>
                    <input
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Confirmer le mot de passe
                    </label>
                    <input
                        type="password"
                        placeholder="Confirmez votre mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        required
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                    {loading ? "Configuration..." : "Finaliser mon compte"}
                </button>
            </form>
        </div>
    );
}

export default function SetupPasswordPage() {
    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8 sm:p-12.5 xl:p-17.5 max-w-lg mx-auto">
            <Suspense fallback={<div>Chargement...</div>}>
                <SetupPasswordForm />
            </Suspense>
        </div>
    );
}
