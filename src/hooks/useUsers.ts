import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { CreateUserDto, UpdateUserDto, QueryParams, User, PaginatedResponse } from '@/types/api';
import { useToast } from '@/hooks/useToast';

// Clés de requête pour le cache
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: QueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};

// Hook pour récupérer la liste des utilisateurs
export const useUsers = (params?: QueryParams) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Ne pas réessayer si l'API n'est pas disponible (404, 500, etc.)
      if (error?.response?.status >= 400) {
        return false;
      }
      return failureCount < 2;
    },
    // Données par défaut en cas d'erreur
    placeholderData: {
      data: [] as User[],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    } as PaginatedResponse<User>
  });
};

// Hook pour récupérer un utilisateur par ID
export const useUser = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });
};

// Hook pour récupérer les statistiques des utilisateurs
export const useUserStats = () => {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: () => userService.getUserStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Ne pas réessayer si l'API n'est pas disponible
      if (error?.response?.status >= 400) {
        return false;
      }
      return failureCount < 2;
    },
    // Données par défaut en cas d'erreur
    placeholderData: {
      success: true,
      data: {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: {},
        byDepartment: {}
      },
      message: 'Données par défaut'
    }
  });
};

// Hook pour récupérer les options nécessaires à la création d'un utilisateur
export const useUserAdminOptions = () => {
  return useQuery({
    queryKey: [...userKeys.all, 'admin-options'],
    queryFn: () => userService.getAdminOptions(),
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour créer un utilisateur
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => userService.createUser(userData),
    onSuccess: (data) => {
      // Invalider le cache des listes d'utilisateurs
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
      
      toast.success(data.message || 'Utilisateur créé avec succès !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur';
      toast.error(message);
    },
  });
};

// Hook pour mettre à jour un utilisateur
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: UpdateUserDto }) => 
      userService.updateUser(id, userData),
    onSuccess: (data, variables) => {
      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
      
      toast.success(data.message || 'Utilisateur mis à jour avec succès !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });
};

// Hook pour supprimer un utilisateur
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: (data) => {
      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
      
      toast.success(data.message || 'Utilisateur supprimé avec succès !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(message);
    },
  });
};

// Hook pour activer/désactiver un utilisateur
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => userService.toggleUserStatus(id),
    onSuccess: (data, id) => {
      // Mettre à jour le cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
      
      toast.success(data.message || 'Statut utilisateur mis à jour !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors du changement de statut';
      toast.error(message);
    },
  });
};

// Hook pour rechercher des utilisateurs
export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: [...userKeys.all, 'search', query],
    queryFn: () => userService.searchUsers(query),
    enabled: query.length > 2, // Recherche seulement si plus de 2 caractères
    staleTime: 30 * 1000, // 30 secondes
  });
};

// Hook pour exporter des utilisateurs
export const useExportUsers = () => {
  const toast = useToast();

  return useMutation({
    mutationFn: (format: 'csv' | 'xlsx' = 'csv') => userService.exportUsers(format),
    onSuccess: (blob, format) => {
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export terminé avec succès !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'export';
      toast.error(message);
    },
  });
};

// Hook pour importer des utilisateurs
export const useImportUsers = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (file: File) => userService.importUsers(file),
    onSuccess: (data) => {
      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
      
      const message = `Import terminé ! ${data.data.imported} utilisateurs importés.`;
      if (data.data.errors.length > 0) {
        toast.warning(`${message} ${data.data.errors.length} erreurs détectées.`);
      } else {
        toast.success(message);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'import';
      toast.error(message);
    },
  });
};
