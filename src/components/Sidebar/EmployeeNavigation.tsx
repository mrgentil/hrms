'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    title: 'Mon Profil',
    href: '/employees/profile',
    icon: '👤',
    description: 'Mes informations personnelles'
  },
  {
    title: 'Mes Congés',
    href: '/leaves/my-leaves',
    icon: '🏖️',
    description: 'Gérer mes demandes de congés'
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
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{item.title}</div>
              {item.description && (
                <div className={`text-xs ${
                  isActive 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.description}
                </div>
              )}
            </div>
          </Link>
        );
      })}
      
      {/* Séparateur */}
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
