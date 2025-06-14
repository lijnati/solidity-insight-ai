
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

export type AuditRow = {
  id: string;
  user_id: string;
  source_code: string;
  report: any;
  created_at: string;
};

export function useUserAudits() {
  const { user } = useSupabaseAuth();
  return useQuery({
    queryKey: ["user-audits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AuditRow[];
    },
  });
}

export function useSaveAudit() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, report }: { code: string; report: any }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("audits").insert({
        user_id: user.id,
        source_code: code,
        report,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-audits"] });
    },
  });
}
