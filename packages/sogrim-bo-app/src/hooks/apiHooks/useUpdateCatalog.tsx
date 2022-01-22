import { useMutation } from "react-query";
import { updateCatalog } from "../../services/api";

export default function useUpdateCatalog(authToken: any, catalogId: string) {
  return useMutation(
    ["catalogs", catalogId], // The caching key
    (updatedCatalog: any) => updateCatalog(authToken, catalogId, updatedCatalog)
  );
}
