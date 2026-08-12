import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileRow } from "@/types/database";

export function profileQueryKey(userId: string | undefined) {
  return ["profile", userId] as const;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileQueryKey(user?.id),
    enabled: Boolean(user),
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Partial<Pick<ProfileRow, "full_name" | "theme_preference">>) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey(user?.id) });
      toast.success("Perfil atualizado");
    },
    onError: (error: Error) => {
      toast.error("Não foi possível atualizar o perfil", { description: error.message });
    },
  });
}
