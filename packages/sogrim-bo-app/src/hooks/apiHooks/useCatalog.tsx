import { useQuery } from "react-query";
import { getCatalog } from "../../services/api";

export default function useCatalog(authToken: any, catalogId: string) {
  return useQuery(
    ["catalogs", catalogId],
    () => getCatalog(authToken, catalogId),
    {
      enabled: !!authToken,
    }
  );
}
