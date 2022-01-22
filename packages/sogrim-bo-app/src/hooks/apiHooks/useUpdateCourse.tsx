import { useMutation } from "react-query";
import { updateCourse } from "../../services/api";

export default function useUpdateCourse(authToken: any, courseId: string) {
  return useMutation(
    ["courses", courseId], // The caching key
    (updatedCourse: any) => updateCourse(authToken, courseId, updatedCourse)
  );
}
