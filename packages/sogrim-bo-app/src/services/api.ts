import axios from "axios";
import { Catalog, Course, ThinCatalog } from "../types/data-types";
import { API_URL } from "./api-url";

/////////////////////////////////////////////////////////////////////////////
// Courses API
/////////////////////////////////////////////////////////////////////////////

export const getCourses = async (authToken: any): Promise<Course[]> => {
  let fallback: Course[] = [];
  let data: Course[];
  try {
    const res =
      (await axios.get(`${API_URL}/courses`, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
    data = res.data || fallback;
  } catch {
    data = fallback;
  }
  return data;
};

export const getCourse = async (
  authToken: any,
  courseId: string
): Promise<any> => {
  let fallback: any;
  let res: any;
  try {
    res =
      (await axios.get(`${API_URL}/courses/${courseId}`, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
  } catch {
    res = fallback;
  }
  return res;
};

export const updateCourse = async (
  authToken: any,
  courseId: string,
  course: Course
): Promise<any> => {
  let fallback: any;
  let res: any;
  try {
    res =
      (await axios.put(`${API_URL}/courses/${courseId}`, course, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
  } catch {
    res = fallback;
  }
  return res;
};

export const deleteCourse = async (
  authToken: any,
  courseId: string
): Promise<any> => {
  let fallback: any;
  let res: any;
  try {
    res =
      (await axios.delete(`${API_URL}/courses/${courseId}`, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
  } catch {
    res = fallback;
  }
  return res;
};

/////////////////////////////////////////////////////////////////////////////
// Catalogs API
/////////////////////////////////////////////////////////////////////////////

export const getCatalogs = async (authToken: any): Promise<ThinCatalog[]> => {
  let fallback: any;
  let data: ThinCatalog[];
  try {
    const res =
      (await axios.get(`${API_URL}/catalogs`, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
    data = res.data || fallback;
  } catch {
    data = fallback;
  }
  return data;
};

export const getCatalog = async (
  authToken: any,
  catalogId: string
): Promise<Catalog> => {
  let fallback: any;
  let data: Catalog;
  try {
    const res =
      (await axios.get(`${API_URL}/catalogs/${catalogId}`, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
    data = res.data || fallback;
  } catch {
    data = fallback;
  }
  return data;
};

export const updateCatalog = async (
  authToken: any,
  catalogId: string,
  catalog: any
): Promise<any> => {
  let fallback: any;
  let res: any;
  try {
    res =
      (await axios.put(`${API_URL}/catalogs/${catalogId}`, catalog, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
  } catch {
    res = fallback;
  }
  return res;
};
