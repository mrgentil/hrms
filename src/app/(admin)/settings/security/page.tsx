'use client';

import { useState, useEffect } from 'react';
import { twoFactorService, type TwoFAStatus } from '@/services/security.service';
import { Shield, ShieldCheck, ShieldOff, Key, AlertTriangle, CheckCircle, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

// ── Step types ────────────────────────────────────────────────
type SetupStep = 'idle' | 'qrcode' | 'verify' | 'backup-codes' | 'disable';

export default function SecuritySettingsPage() {
    const [status, setStatus] = useState<TwoFAStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<SetupStep>('idle');
    const [qrCode, setQrCode] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [showManualKey, setShowManualKey] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const data = await twoFactorService.getStatus();
            setStatus(data);
        } catch (err) {
            toast.error('Impossible de récupérer le statut 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async () => {
        try {
            setSubmitting(true);
            const res = await twoFactorService.setup();
            setQrCode(res.data.qrCodeDataUrl);
            setManualKey(res.data.manualKey);
            setStep('qrcode');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erreur lors de la configuration');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifySetup = async () => {
        if (totpCode.length !== 6) {
            toast.error('Le code doit contenir 6 chiffres');
            return;
        }
        try {
            setSubmitting(true);
            const res = await twoFactorService.verifySetup(totpCode);
            setBackupCodes(res.data.backupCodes);
            setStep('backup-codes');
            await fetchStatus();
            toast.success('Double authentification activée !');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Code invalide');
        } finally {
            setSubmitting(false);
            setTotpCode('');
        }
    };

    const handleDisable = async () => {
        if (totpCode.length !== 6) {
            toast.error('Entrez votre code 2FA actuel');
            return;
        }
        try {
            setSubmitting(true);
            await twoFactorService.disable(totpCode);
            setStep('idle');
            setTotpCode('');
            await fetchStatus();
            toast.success('Double authentification désactivée');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Code invalide');
        } finally {
            setSubmitting(false);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
        setCodeCopied(true);
        toast.success('Codes copiés dans le presse-papiers');
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const copyManualKey = () => {
        navigator.clipboard.writeText(manualKey);
        toast.success('Clé copiée');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield size={28} className="text-blue-600" />
                    Sécurité du compte
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    Gérez la double authentification pour protéger votre compte
                </p>
            </div>

            {/* 2FA Status Card */}
            <div className={`rounded-2xl border-2 p-6 transition-all ${status?.enabled
                ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
                : 'border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700'
                }`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`rounded-xl p-3 ${status?.enabled ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            {status?.enabled
                                ? <ShieldCheck size={24} className="text-green-600 dark:text-green-400" />
                                : <ShieldOff size={24} className="text-gray-400" />
                            }
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Double Authentification (2FA)
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Sécurisez votre connexion avec un code supplémentaire (Google Authenticator, Authy…)
                            </p>
                            {status?.enabled && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                                    <CheckCircle size={12} />
                                    Activé — {status.backupCodesCount} code(s) de récupération restants
                                </span>
                            )}
                            {!status?.enabled && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                    Non activé
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {step === 'idle' && (
                        <div>
                            {status?.enabled ? (
                                <button
                                    onClick={() => { setStep('disable'); setTotpCode(''); }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                >
                                    Désactiver
                                </button>
                            ) : (
                                <button
                                    onClick={handleSetup}
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                                    Activer
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── STEP: QR Code ── */}
            {step === 'qrcode' && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                        Étape 1 — Scannez le QR code
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ouvrez votre application d'authentification (Google Authenticator, Authy…) et scannez ce code.
                    </p>

                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrCode} alt="QR Code 2FA" width={200} height={200} className="rounded" />
                        </div>
                    </div>

                    {/* Manual Key */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Clé manuelle (si QR non lisible) :</p>
                        <div className="flex items-center gap-2">
                            <code className={`flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 break-all ${!showManualKey ? 'blur-sm select-none' : ''}`}>
                                {manualKey}
                            </code>
                            <button onClick={() => setShowManualKey(!showManualKey)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                {showManualKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button onClick={copyManualKey} className="text-gray-400 hover:text-blue-600">
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep('verify')}
                        className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        J'ai scanné le code →
                    </button>
                </div>
            )}

            {/* ── STEP: Verify ── */}
            {step === 'verify' && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                        Étape 2 — Vérifiez le code
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Entrez le code à 6 chiffres généré par votre application pour confirmer l'activation.
                    </p>

                    {/* OTP Input */}
                    <div className="flex justify-center">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="text-center text-3xl font-mono tracking-widest w-48 py-4 px-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('qrcode')}
                            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            ← Retour
                        </button>
                        <button
                            onClick={handleVerifySetup}
                            disabled={submitting || totpCode.length !== 6}
                            className="flex-1 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Confirmer l'activation
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: Backup Codes ── */}
            {step === 'backup-codes' && (
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <Key size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Codes de récupération — Sauvegardez-les maintenant !
                            </h3>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                Ces codes ne seront affichés qu'une seule fois. Chaque code ne peut être utilisé qu'une fois.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-amber-100/60 dark:bg-amber-900/30 rounded-lg">
                        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Stockez-les dans un endroit sûr (gestionnaire de mots de passe, coffre-fort…).
                            En cas de perte de votre appareil, ces codes sont votre seule solution de secours.
                        </p>
                    </div>

                    {/* Backup codes grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, i) => (
                            <div key={i} className="font-mono text-sm text-center py-2 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg tracking-widest text-gray-800 dark:text-gray-200">
                                {code}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={copyBackupCodes}
                            className={`flex-1 py-3 border rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${codeCopied
                                ? 'border-green-400 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {codeCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                            {codeCopied ? 'Copié !' : 'Copier les codes'}
                        </button>
                        <button
                            onClick={() => setStep('idle')}
                            className="flex-1 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
                        >
                            Terminé ✓
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: Disable ── */}
            {step === 'disable' && (
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <ShieldOff size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Désactiver la double authentification
                        </h3>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-red-100/60 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-300">
                            Cette action réduira la sécurité de votre compte. Entrez votre code actuel pour confirmer.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="text-center text-3xl font-mono tracking-widest w-48 py-4 px-3 border-2 border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setStep('idle'); setTotpCode(''); }}
                            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleDisable}
                            disabled={submitting || totpCode.length !== 6}
                            className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
                            Désactiver
                        </button>
                    </div>
                </div>
            )}

            {/* Info card at the bottom */}
            {step === 'idle' && (
                <div className="rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-5">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 text-sm mb-2 flex items-center gap-2">
                        <Key size={16} />
                        Applications compatibles
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs text-blue-700 dark:text-blue-400">
                        {['Google Authenticator', 'Microsoft Authenticator', 'Authy', '1Password', 'Bitwarden', 'Duo Mobile'].map(app => (
                            <span key={app} className="bg-blue-100 dark:bg-blue-900/40 rounded-lg px-2 py-1 text-center">
                                {app}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
