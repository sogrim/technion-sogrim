import { useQuery } from "@tanstack/react-query";
import { getResource, listResource } from "@/data/provider";
import type { ResourceRecord } from "@/types/bo";

export function useResourceList(key: string, enabled = true) {
  return useQuery<ResourceRecord[]>({
    queryKey: ["bo", "list", key],
    queryFn: () => listResource(key),
    enabled,
  });
}

export function useResourceRecord(key: string, id: string, enabled = true) {
  return useQuery<ResourceRecord>({
    queryKey: ["bo", "record", key, id],
    queryFn: () => getResource(key, id),
    enabled: enabled && !!id,
  });
}
