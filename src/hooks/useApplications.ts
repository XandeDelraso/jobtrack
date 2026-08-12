import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type {
  ApplicationInsert,
  ApplicationRow,
  ApplicationStatus,
  ApplicationUpdate,
} from "@/types/database";

export function applicationsQueryKey(userId: string | undefined) {
  return ["applications", userId] as const;
}

export function useApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: applicationsQueryKey(user?.id),
    enabled: Boolean(user),
    queryFn: async (): Promise<ApplicationRow[]> => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApplicationHistory(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["application_history", applicationId],
    enabled: Boolean(applicationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_history")
        .select("*")
        .eq("application_id", applicationId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Omit<ApplicationInsert, "user_id">) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("applications")
        .insert({ ...values, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as ApplicationRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsQueryKey(user?.id) });
      toast.success("Candidatura adicionada");
    },
    onError: (error: Error) => {
      toast.error("Não foi possível salvar a candidatura", { description: error.message });
    },
  });
}

export function useUpdateApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ApplicationUpdate }) => {
      const { data, error } = await supabase
        .from("applications")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ApplicationRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: applicationsQueryKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: ["application_history", data.id] });
      toast.success("Candidatura atualizada");
    },
    onError: (error: Error) => {
      toast.error("Não foi possível atualizar a candidatura", { description: error.message });
    },
  });
}

export function useUpdateApplicationStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = applicationsQueryKey(user?.id);

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data, error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ApplicationRow;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApplicationRow[]>(key);
      if (previous) {
        queryClient.setQueryData<ApplicationRow[]>(
          key,
          previous.map((app) => (app.id === id ? { ...app, status } : app))
        );
      }
      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error("Não foi possível mover a candidatura", { description: error.message });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["application_history", data.id] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = applicationsQueryKey(user?.id);

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { data, error } = await supabase
        .from("applications")
        .update({ is_favorite: isFavorite })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ApplicationRow;
    },
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApplicationRow[]>(key);
      if (previous) {
        queryClient.setQueryData<ApplicationRow[]>(
          key,
          previous.map((app) => (app.id === id ? { ...app, is_favorite: isFavorite } : app))
        );
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error("Não foi possível atualizar o favorito");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsQueryKey(user?.id) });
      toast.success("Candidatura excluída");
    },
    onError: (error: Error) => {
      toast.error("Não foi possível excluir a candidatura", { description: error.message });
    },
  });
}
