"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import TrainingService from "@/services/training.service";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditCertificationPage({ params }: { params: any }) {
    const router = useRouter();
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [id, setId] = useState<number>(0);

    const [formData, setFormData] = useState({
        name: "",
        issuing_org: "",
        validity_months: 0,
        description: "",
    });

    useEffect(() => {
        Promise.resolve(params).then((p) => {
            if (p?.id) {
                const certId = parseInt(p.id);
                setId(certId);
                loadCertification(certId);
            }
        });
    }, [params]);

    const loadCertification = async (certId: number) => {
        try {
            setLoading(true);
            const certs = await TrainingService.getCertifications();
            const cert = certs.find((c: any) => c.id === certId);
            if (cert) {
                setFormData({
                    name: cert.name,
                    issuing_org: cert.issuing_org,
                    validity_months: cert.validity_months || 0,
                    description: cert.description || "",
                });
            } else {
                toast.error("Certification introuvable");
                router.push("/training/certifications/manage");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur de chargement");
            router.push("/training/certifications/manage");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.issuing_org) {
            return toast.error("Nom et Organisme requis");
        }

        try {
            setSubmitting(true);
            await TrainingService.updateCertification(id, {
                ...formData,
                validity_months: formData.validity_months ? parseInt(String(formData.validity_months)) : undefined
            });
            toast.success("Certification mise à jour");
            router.push("/training/certifications/manage");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Chargement...</div>;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-6">
                <Link href="/training/certifications/manage" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Retour au catalogue
                </Link>
                <PageBreadcrumb pageTitle="Modifier Certification" />
            </div>

            <form onSubmit={handleSubmit}>
                <ComponentCard title="Modifier la certification">
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Nom de la certification <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Organisme <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.issuing_org}
                            onChange={(e) => setFormData({ ...formData, issuing_org: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Validité (Mois) - Laisser 0 si illimité
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.validity_months}
                            onChange={(e) => setFormData({ ...formData, validity_months: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {submitting ? "Enregistrement..." : "Sauvegarder les modifications"}
                    </button>
                </ComponentCard>
            </form>
        </div>
    );
}
