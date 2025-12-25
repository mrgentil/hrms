'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext';

interface NavigationItem {
  title: string;
  href: string;
  icon: string;
  description?: string;
}

const employeeNavigation: NavigationItem[] = [
  {
    title: 'Mon Espace',
    href: '/employee-dashboard',
    icon: '🏠',
    description: 'Tableau de bord personnel'
  },
  {
    title: 'Pointage',
    href: '/attendance',
    icon: '⏰',
    description: 'Pointer arrivée et départ'
  },
  {
    title: 'Mon Profil',
    href: '/employees/profile',
    icon: '👤',
    description: 'Mes informations personnelles'
  },
  {
    title: 'Mes Documents',
    href: '/employees/documents',
    icon: '📄',
    description: 'Contrats et fichiers partagés'
  },
  {
    title: 'Mes Congés',
    href: '/leaves/my-leaves',
    icon: '🏖️',
    description: 'Gérer mes demandes de congés'
  },
  // === FORMATION & DÉVELOPPEMENT ===
  {
    title: 'Mes Formations',
    href: '/training/my-trainings',
    icon: '📚',
    description: 'Mes formations et certifications'
  },
  {
    title: 'Catalogue de Formations',
    href: '/training/catalog',
    icon: '📖',
    description: 'Parcourir les formations disponibles'
  },
  // === MA PAIE ===
  {
    title: 'Mes Bulletins de Paie',
    href: '/payroll/payslips',
    icon: '💰',
    description: 'Consulter mes bulletins de paie'
  },
  {
    title: 'Demander une Avance',
    href: '/payroll/advances',
    icon: '💵',
    description: 'Soumettre une demande d\'avance'
  },
  {
    title: 'Demandes de Fonds',
    href: '/payroll/fund-requests',
    icon: '💼',
    description: 'Demandes de remboursement'
  },
  // === MA PERFORMANCE ===
  {
    title: 'Mes Évaluations',
    href: '/performance/reviews',
    icon: '📊',
    description: 'Consulter mes évaluations'
  },
  {
    title: 'Mes Objectifs',
    href: '/performance/objectives',
    icon: '🎯',
    description: 'Suivre mes objectifs'
  },
  // === MON MATÉRIEL ===
  {
    title: 'Mon Équipement',
    href: '/assets/it-equipment',
    icon: '💻',
    description: 'Matériel qui m\'est assigné'
  },
  {
    title: 'Demander du Matériel',
    href: '/assets/requests',
    icon: '📦',
    description: 'Faire une demande d\'équipement'
  },
  // === PLANNING & RÉSERVATIONS ===
  {
    title: 'Planning d\'Équipe',
    href: '/planning/team-schedule',
    icon: '📅',
    description: 'Voir le planning de l\'équipe'
  },
  {
    title: 'Réserver une Salle',
    href: '/planning/room-booking',
    icon: '🚪',
    description: 'Réserver une salle de réunion'
  },
  {
    title: 'Mon Télétravail',
    href: '/planning/remote-work',
    icon: '🏠',
    description: 'Déclarer mes jours de télétravail'
  },
  // === PROJETS & TÂCHES ===
  {
    title: 'Mes Projets',
    href: '/employees/projects',
    icon: '📂',
    description: 'Projets auxquels je participe'
  },
  {
    title: 'Mes Tâches',
    href: '/employees/tasks',
    icon: '✅',
    description: 'Tâches qui me sont assignées'
  },
  // === COMMUNICATION & ENGAGEMENT ===
  {
    title: 'Mes Annonces',
    href: '/employees/announcements',
    icon: '📢',
    description: "Communications de l'entreprise"
  },
  {
    title: 'Messagerie',
    href: '/messages',
    icon: '💬',
    description: 'Discussions en temps réel'
  },
  {
    title: 'Bien-être',
    href: '/wellbeing/wellness',
    icon: '🧘',
    description: 'Ressources bien-être'
  },
  // === AUTRES ===
  {
    title: 'Mon Historique',
    href: '/employees/history',
    icon: '🕑',
    description: 'Parcours et changements'
  },
  {
    title: 'Organigramme',
    href: '/employees/organigramme',
    icon: '🏢',
    description: 'Structure de l\'entreprise'
  },
  {
    title: 'Annuaire',
    href: '/employees/search',
    icon: '🔍',
    description: 'Rechercher des collègues'
  },
];

interface EmployeeNavigationProps {
  className?: string;
}


export default function EmployeeNavigation({ className = '' }: EmployeeNavigationProps) {
  const pathname = usePathname();
  const { unreadCount } = useSocket();

  return (
    <nav className={`space-y-2 ${className}`}>
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Espace Employé
        </h3>
      </div>

      {employeeNavigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
              ? 'bg-primary text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <div className="font-medium">{item.title}</div>
                {item.description && (
                  <div className={`text-xs ${isActive
                    ? 'text-white/80'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {item.description}
                  </div>
                )}
              </div>
              {item.href === '/messages' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </Link>
        );
      })}

      {/* Séparateur */}
      {/* ... (rest of component) */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

      {/* Liens d'aide */}
      <div className="px-3 py-2">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Aide & Support
        </h4>
        <div className="space-y-1 text-xs">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">RH:</span> rh@entreprise.com
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Support IT:</span> support@entreprise.com
          </div>
        </div>
      </div>
    </nav>
  );
}
