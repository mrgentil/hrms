"use client";

import Checkbox from "@/components/form/input/Checkbox";
import ControlledInput from "@/components/auth/ControlledInput";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { twoFactorService } from "@/services/security.service";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  const { login, completeLogin2FA } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { settings, getImageUrl } = useAppSettings();

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const loadingToastId = toast.loading("Connexion en cours...");

    try {
      const response = await login(username, password);
      
      if (response && response.requires_2fa) {
        toast.success("Veuillez entrer votre code 2FA");
        setTempToken(response.temp_token);
        setRequires2FA(true);
      } else {
        toast.success("Connexion reussie !");
        window.location.href = "/";
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur de connexion";
      toast.error(message);
    } finally {
      toast.dismiss(loadingToastId);
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (totpCode.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }
    
    setIsLoading(true);
    const loadingToastId = toast.loading("Vérification du code...");

    try {
      const response = await twoFactorService.login2FA(tempToken, totpCode);
      await completeLogin2FA(response);
      toast.success("Connexion reussie !");
      window.location.href = "/";
    } catch (error: any) {
      const message = error.response?.data?.message || "Code 2FA invalide";
      toast.error(message);
    } finally {
      toast.dismiss(loadingToastId);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            {/* Logo mobile */}
            {settings.logo_light && (
              <div className="mb-4 lg:hidden">
                <img
                  className="h-10 w-auto mx-auto dark:hidden"
                  src={getImageUrl(settings.logo_light)}
                  alt={settings.app_name || "Logo"}
                />
                {settings.logo_dark && (
                  <img
                    className="h-10 w-auto mx-auto hidden dark:block"
                    src={getImageUrl(settings.logo_dark)}
                    alt={settings.app_name || "Logo"}
                  />
                )}
              </div>
            )}
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {requires2FA ? "Double Authentification" : `Connexion ${settings.app_name ? `à ${settings.app_name}` : ''}`}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {requires2FA 
                ? "Entrez le code à 6 chiffres généré par votre application d'authentification."
                : "Entrez votre nom d'utilisateur et mot de passe pour vous connecter!"}
            </p>
          </div>

          {!requires2FA ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <ControlledInput
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <ControlledInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Entrez votre mot de passe"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeCloseIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Checkbox
                    id="remember"
                    checked={isChecked}
                    onChange={setIsChecked}
                    label="Se souvenir de moi"
                  />
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Mot de passe oublie?
                  </Link>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="totp">Code d'authentification</Label>
                  <input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-3xl font-mono tracking-widest py-4 px-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:border-brand-500 focus:outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false);
                      setTotpCode("");
                      setTempToken("");
                    }}
                    className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || totpCode.length !== 6}
                    className="flex-1 py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? "Vérification..." : "Vérifier"}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-500 dark:text-gray-400 sm:text-start">
              Contactez votre administrateur pour obtenir un compte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
