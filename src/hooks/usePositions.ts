import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { positionService } from '@/services/positionService';
import {
  PaginatedResponse,
  Position,
  CreatePositionDto,
  UpdatePositionDto,
  QueryParams,
} from '@/types/api';
import { useToast } from '@/hooks/useToast';

export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (params?: QueryParams) => [...positionKeys.lists(), params] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: number) => [...positionKeys.details(), id] as const,
};

export const usePositions = (params?: QueryParams) => {
  return useQuery({
    queryKey: positionKeys.list(params),
    queryFn: () => positionService.getPositions(params),
    staleTime: 60 * 1000,
    placeholderData: {
      data: [],
      total: 0,
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      totalPages: 0,
    } as PaginatedResponse<Position>,
  });
};

export const usePosition = (id: number) => {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: () => positionService.getPositionById(id),
    enabled: !!id,
  });
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreatePositionDto) => positionService.createPosition(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-options'] });
      toast.success(data.message || 'Poste cree avec succes !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la creation du poste';
      toast.error(message);
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePositionDto }) =>
      positionService.updatePosition(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: positionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-options'] });
      toast.success(data.message || 'Poste mis a jour avec succes !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise a jour du poste';
      toast.error(message);
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: number) => positionService.deletePosition(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['users', 'admin-options'] });
      toast.success(data.message || "Poste supprime avec succes !");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Erreur lors de la suppression du poste";
      toast.error(message);
    },
  });
};
