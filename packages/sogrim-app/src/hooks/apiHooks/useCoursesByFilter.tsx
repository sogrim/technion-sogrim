import { useQuery } from "react-query";
import { getCourseByFilter } from "../../services/api";

export default function useCoursesByFilter(
  authToken: any,
  trigger: boolean,
  filterName: string,
  filter: string
) {
  return useQuery(
    ["coursesByFilter", filter],
    () => getCourseByFilter(authToken, filterName, filter),
    {
      retry: false,
      enabled: !!authToken && trigger,
      useErrorBoundary: true,
    }
  );
}
