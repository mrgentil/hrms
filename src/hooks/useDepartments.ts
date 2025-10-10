import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import {
  CreateDepartmentDto,
  Department,
  PaginatedResponse,
  QueryParams,
  UpdateDepartmentDto,
} from '@/types/api';
import { useToast } from '@/hooks/useToast';

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (params?: QueryParams) => [...departmentKeys.lists(), params] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...departmentKeys.details(), id] as const,
  options: () => [...departmentKeys.all, 'options'] as const,
};

export const useDepartments = (params?: QueryParams) =>
  useQuery<PaginatedResponse<Department>>({
    queryKey: departmentKeys.list(params),
    queryFn: () => departmentService.getDepartments(params),
    placeholderData: {
      data: [],
      total: 0,
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      totalPages: 0,
    },
    staleTime: 60 * 1000,
  });

export const useDepartment = (id: number | null | undefined) =>
  useQuery({
    queryKey: id ? departmentKeys.detail(id) : departmentKeys.details(),
    queryFn: () => departmentService.getDepartmentById(id as number),
    enabled: Boolean(id),
  });

export const useDepartmentOptions = () =>
  useQuery({
    queryKey: departmentKeys.options(),
    queryFn: async () => {
      const [departments, adminOptions] = await Promise.all([
        departmentService.getDepartments({ limit: 100 }),
        userService.getAdminOptions(),
      ]);

      return {
        departments: departments.data,
        managers: adminOptions.data?.managers ?? [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateDepartmentDto) => departmentService.createDepartment(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.options() });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success(response.message || 'Departement cree avec succes !');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Erreur lors de la creation du departement';
      toast.error(message);
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDepartmentDto }) =>
      departmentService.updateDepartment(id, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.options() });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success(response.message || 'Departement mis a jour avec succes !');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Erreur lors de la mise a jour du departement';
      toast.error(message);
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => departmentService.deleteDepartment(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.options() });
      toast.success(response.message || 'Departement supprime avec succes !');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Erreur lors de la suppression du departement';
      toast.error(message);
    },
  });
};

