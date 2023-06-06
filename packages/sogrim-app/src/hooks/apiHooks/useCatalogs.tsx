import { useQuery } from "react-query";
import { getCatalogs } from "../../services/api";

export default function useCatalogs(authToken: any, chosenFaculty?: string) {
  return useQuery("catalogs", () => getCatalogs(authToken, chosenFaculty), {
    enabled: !!authToken,
    useErrorBoundary: true,
  });
}
