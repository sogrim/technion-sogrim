import { useMutation } from "react-query";
import { postParseCoursesAndComputeDegreeStatus } from "../../services/api";
import { ComputeDegreeStatusPayload } from "../../types/data-types";

export function useParseCompute(authToken: any) {
  return useMutation(
    "userState",
    (parseComputePayload: ComputeDegreeStatusPayload) =>
      postParseCoursesAndComputeDegreeStatus(authToken, parseComputePayload),
    { useErrorBoundary: true }
  );
}
