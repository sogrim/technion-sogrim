import { useQuery } from "react-query";
import { getCatalog } from "../../services/api";

export default function useCatalog(
  authToken: any,
  catalogId: string,
  trigger: boolean = false
) {
  return useQuery(["catalog"], () => getCatalog(authToken, catalogId), {
    enabled: !!authToken && trigger,
  });
}
