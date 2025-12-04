import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SettingValue {
  key: string;
  value: string | null;
  type: string;
  category: string;
  label: string;
  description?: string;
}

// Paramètres par défaut de l'application
const DEFAULT_SETTINGS: Omit<SettingValue, 'value'>[] = [
  // Général
  { key: 'app_name', type: 'string', category: 'general', label: 'Nom de l\'application', description: 'Le nom affiché dans l\'application' },
  { key: 'app_description', type: 'string', category: 'general', label: 'Description', description: 'Description courte de l\'application' },
  { key: 'app_version', type: 'string', category: 'general', label: 'Version', description: 'Version actuelle de l\'application' },
  
  // Branding
  { key: 'logo_light', type: 'image', category: 'branding', label: 'Logo (mode clair)', description: 'Logo affiché en mode clair (URL ou base64)' },
  { key: 'logo_dark', type: 'image', category: 'branding', label: 'Logo (mode sombre)', description: 'Logo affiché en mode sombre (URL ou base64)' },
  { key: 'favicon', type: 'image', category: 'branding', label: 'Favicon', description: 'Icône du navigateur (URL ou base64)' },
  { key: 'primary_color', type: 'string', category: 'branding', label: 'Couleur principale', description: 'Couleur principale de l\'application (hex)' },
  
  // SEO
  { key: 'meta_title', type: 'string', category: 'seo', label: 'Titre SEO', description: 'Titre pour le référencement (balise title)' },
  { key: 'meta_description', type: 'string', category: 'seo', label: 'Description SEO', description: 'Description pour le référencement (meta description)' },
  { key: 'meta_keywords', type: 'string', category: 'seo', label: 'Mots-clés SEO', description: 'Mots-clés séparés par des virgules' },
  { key: 'og_image', type: 'image', category: 'seo', label: 'Image Open Graph', description: 'Image pour les partages sociaux' },
  
  // Entreprise
  { key: 'company_name', type: 'string', category: 'company', label: 'Nom de l\'entreprise', description: 'Raison sociale' },
  { key: 'company_address', type: 'string', category: 'company', label: 'Adresse', description: 'Adresse postale' },
  { key: 'company_phone', type: 'string', category: 'company', label: 'Téléphone', description: 'Numéro de téléphone principal' },
  { key: 'company_email', type: 'string', category: 'company', label: 'Email', description: 'Email de contact principal' },
  { key: 'company_website', type: 'string', category: 'company', label: 'Site web', description: 'URL du site web' },
  
  // Congés
  { key: 'leave_default_days', type: 'number', category: 'leaves', label: 'Jours de congés par défaut', description: 'Nombre de jours de congés annuels par défaut' },
  { key: 'leave_require_approval', type: 'boolean', category: 'leaves', label: 'Approbation requise', description: 'Les congés nécessitent une approbation' },
  { key: 'leave_min_notice_days', type: 'number', category: 'leaves', label: 'Délai minimum (jours)', description: 'Nombre de jours minimum avant une demande de congé' },
  
  // Email
  { key: 'smtp_from_name', type: 'string', category: 'email', label: 'Nom expéditeur', description: 'Nom affiché dans les emails' },
  { key: 'smtp_from_email', type: 'string', category: 'email', label: 'Email expéditeur', description: 'Adresse email d\'envoi' },
];

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Initialiser les paramètres par défaut
  async initializeDefaults() {
    const results: { key: string; action: string }[] = [];

    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.prisma.app_settings.findUnique({
        where: { key: setting.key },
      });

      if (!existing) {
        await this.prisma.app_settings.create({
          data: {
            key: setting.key,
            value: null,
            type: setting.type,
            category: setting.category,
            label: setting.label,
            description: setting.description,
            is_public: ['branding', 'seo', 'general'].includes(setting.category),
          },
        });
        results.push({ key: setting.key, action: 'created' });
      } else {
        results.push({ key: setting.key, action: 'exists' });
      }
    }

    return results;
  }

  // Obtenir tous les paramètres
  async findAll(category?: string) {
    const where = category ? { category } : {};
    
    return this.prisma.app_settings.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
      include: {
        updater: {
          select: { id: true, full_name: true },
        },
      },
    });
  }

  // Obtenir les paramètres publics (pour le frontend sans auth)
  async findPublic() {
    const settings = await this.prisma.app_settings.findMany({
      where: { is_public: true },
      select: {
        key: true,
        value: true,
        type: true,
        category: true,
      },
    });

    // Transformer en objet clé-valeur
    return settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      // Parser selon le type
      if (setting.type === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.type === 'number') {
        value = setting.value ? parseFloat(setting.value) : null;
      } else if (setting.type === 'json' && setting.value) {
        try {
          value = JSON.parse(setting.value);
        } catch {
          value = setting.value;
        }
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);
  }

  // Obtenir un paramètre par clé
  async findByKey(key: string) {
    const setting = await this.prisma.app_settings.findUnique({
      where: { key },
      include: {
        updater: {
          select: { id: true, full_name: true },
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Paramètre '${key}' non trouvé`);
    }

    return setting;
  }

  // Mettre à jour un paramètre
  async update(key: string, value: string | null, updatedBy: number) {
    const existing = await this.prisma.app_settings.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundException(`Paramètre '${key}' non trouvé`);
    }

    return this.prisma.app_settings.update({
      where: { key },
      data: {
        value,
        updated_by: updatedBy,
      },
    });
  }

  // Mettre à jour plusieurs paramètres
  async updateMany(settings: { key: string; value: string | null }[], updatedBy: number) {
    const results: { key: string; success: boolean; error?: string }[] = [];

    for (const setting of settings) {
      try {
        await this.update(setting.key, setting.value, updatedBy);
        results.push({ key: setting.key, success: true });
      } catch (error: any) {
        results.push({ key: setting.key, success: false, error: error.message });
      }
    }

    return results;
  }

  // Obtenir les catégories
  async getCategories() {
    const categories = await this.prisma.app_settings.groupBy({
      by: ['category'],
      _count: true,
    });

    const categoryLabels: Record<string, string> = {
      general: 'Général',
      branding: 'Apparence & Logo',
      seo: 'SEO & Référencement',
      company: 'Entreprise',
      leaves: 'Congés',
      email: 'Email',
    };

    return categories.map((c) => ({
      key: c.category,
      label: categoryLabels[c.category] || c.category,
      count: c._count,
    }));
  }

  // Créer un nouveau paramètre personnalisé
  async create(data: {
    key: string;
    value?: string;
    type?: string;
    category?: string;
    label: string;
    description?: string;
    is_public?: boolean;
  }, createdBy: number) {
    return this.prisma.app_settings.create({
      data: {
        key: data.key,
        value: data.value || null,
        type: data.type || 'string',
        category: data.category || 'custom',
        label: data.label,
        description: data.description,
        is_public: data.is_public || false,
        updated_by: createdBy,
      },
    });
  }

  // Supprimer un paramètre personnalisé
  async delete(key: string) {
    const setting = await this.prisma.app_settings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Paramètre '${key}' non trouvé`);
    }

    // Empêcher la suppression des paramètres système
    if (DEFAULT_SETTINGS.some((s) => s.key === key)) {
      throw new Error('Impossible de supprimer un paramètre système');
    }

    return this.prisma.app_settings.delete({
      where: { key },
    });
  }
}
