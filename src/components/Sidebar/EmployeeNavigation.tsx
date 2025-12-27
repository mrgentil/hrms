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

const moiNavigation: NavigationItem[] = [
  {
    title: 'Mon Espace',
    href: '/employee-dashboard',
    icon: '🏠',
    description: 'Tableau de bord personnel'
  },
  {
    title: 'Mon Pointage',
    href: '/attendance',
    icon: '⏰',
    description: 'Pointer arrivée et départ'
  },
  {
    title: 'Mes Congés',
    href: '/leaves/my-leaves',
    icon: '🏖️',
    description: 'Gérer mes demandes de congés'
  },
  {
    title: 'Ma Paie',
    href: '/payroll/payslips', // Main entry for payroll
    icon: '💰',
    description: 'Bulletins, avances et simulateur'
  },
  {
    title: 'Mes Notes de Frais',
    href: '/expenses',
    icon: '💵',
    description: 'Mes demandes de remboursement'
  },
  {
    title: 'Mes Projets & Tâches',
    href: '/employees/projects',
    icon: '📂',
    description: 'Suivi de mes activités'
  },
  {
    title: 'Mes Formations',
    href: '/training/my-trainings',
    icon: '📚',
    description: 'Mon développement personnel'
  },
  {
    title: 'Mon Profil & Documents',
    href: '/employees/profile',
    icon: '👤',
    description: 'Infos, contrats et historique'
  },
];

const communauteNavigation: NavigationItem[] = [
  {
    title: 'Vision Équipe',
    href: '/employees/search',
    icon: '🔍',
    description: 'Annuaire et Organigramme'
  },
  {
    title: 'Planning d\'Équipe',
    href: '/planning/team-schedule',
    icon: '📅',
    description: 'Absences et télétravail'
  },
  {
    title: 'Messagerie',
    href: '/messages',
    icon: '💬',
    description: 'Discussions en temps réel'
  },
  {
    title: 'Annonces',
    href: '/employees/announcements',
    icon: '📢',
    description: "Communications de l'entreprise"
  },
  {
    title: 'Bien-être & Outils',
    href: '/wellbeing/wellness',
    icon: '🧘',
    description: 'Équipements et ressources'
  },
];

interface EmployeeNavigationProps {
  className?: string;
}

export default function EmployeeNavigation({ className = '' }: EmployeeNavigationProps) {
  const pathname = usePathname();
  const { unreadCount } = useSocket();

  const renderSection = (title: string, items: NavigationItem[]) => (
    <div className="mb-6">
      <div className="px-3 py-2 mb-1">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
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
              <div className="flex-1 flex justify-between items-center overflow-hidden">
                <div className="truncate">
                  <div className="font-medium truncate">{item.title}</div>
                  {item.description && (
                    <div className={`text-[10px] truncate ${isActive
                      ? 'text-white/80'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}>
                      {item.description}
                    </div>
                  )}
                </div>
                {item.href === '/messages' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-900 overflow-visible">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <nav className={`space-y-2 ${className}`}>
      {renderSection('Moi / Mon / Mes', moiNavigation)}
      {renderSection('Ma Communauté', communauteNavigation)}

      <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

      <div className="px-3 py-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Aide & Support
        </h4>
        <div className="space-y-1 text-[10px]">
          <div className="text-gray-600 dark:text-gray-400 flex justify-between">
            <span className="font-medium">RH:</span>
            <span>rh@entreprise.com</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400 flex justify-between">
            <span className="font-medium">Support IT:</span>
            <span>support@entreprise.com</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
