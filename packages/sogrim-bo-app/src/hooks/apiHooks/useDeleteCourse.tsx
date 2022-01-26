import { useMutation } from "react-query";
import { deleteCourse } from "../../services/api";

export default function useDeleteCourse(authToken: any, courseId: string) {
  return useMutation(
    ["courses", courseId], // The caching key
    (courseId: any) => deleteCourse(authToken, courseId)
  );
}
