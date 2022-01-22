import { useMutation } from "react-query";
import { updateCourse } from "../../services/api";

export default function useUpdateUserState(authToken: any, courseId: string) {
  return useMutation(
    ["courses", courseId], // The caching key
    (updatedCourse: any) => updateCourse(authToken, courseId, updatedCourse)
  );
}
