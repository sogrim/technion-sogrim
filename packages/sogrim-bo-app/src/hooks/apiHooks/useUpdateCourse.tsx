import { useMutation } from "react-query";
import { updateCourse } from "../../services/api";
import { Course } from "../../types/data-types";

export default function useUpdateCourse(authToken: any) {
  return useMutation(
    ["course"], // The caching key
    (updatedCourse: Course) =>
      updateCourse(authToken, updatedCourse._id, updatedCourse)
  );
}
