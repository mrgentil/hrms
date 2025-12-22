import { useState, useEffect } from 'react';
import { permissionsService, MenuItem } from '@/services/permissions.service';

export function useDynamicMenus() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const data = await permissionsService.getMenuItemsForUser();
        setMenus(data);
      } catch (err: any) {
        console.error('Error fetching menus:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // Grouper les menus par section
  const menusBySection = menus.reduce((acc, menu) => {
    const section = menu.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(menu);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return { menus, menusBySection, loading, error };
}
