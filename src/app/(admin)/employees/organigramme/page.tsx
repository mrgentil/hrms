'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Organigramme from '@/components/Organigramme';

export default function OrganigrammePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Organigramme" />
      
      <ComponentCard title="Structure organisationnelle">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visualisez la structure hiérarchique de votre organisation par département. 
            Utilisez les filtres pour rechercher des employés spécifiques ou explorer un département particulier.
          </p>
        </div>
        
        <Organigramme />
      </ComponentCard>
    </div>
  );
}
