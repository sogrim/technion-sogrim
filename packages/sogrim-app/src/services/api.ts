import axios, { AxiosRequestConfig } from "axios";
import {
  UserDetails,
  UserState,
  Catalog,
  Course,
  UserSettings,
} from "../types/data-types";
import { API_URL } from "./api-url";

export const getCatalogs = async (
  authToken: string,
  chosenFaculty?: string
): Promise<Catalog[]> => {
  let params;
  if (chosenFaculty) {
    params = { faculty: chosenFaculty };
  }
  return axiosGet(authToken, `${API_URL}/catalogs`, params);
};

export const getCourseByFilter = async (
  authToken: string,
  filterName: string,
  filter: string
): Promise<Course[]> => {
  try {
    new RegExp(filter);
  } catch {
    // Don't allow invalid regex expressions to be sent to the server
    return [];
  }
  if (!filter) {
    // Don't allow empty filters to be sent to the server
    return [];
  }
  return axiosGet(
    authToken,
    `${API_URL}/students/courses?${filterName}=${filter}`
  );
};

export const putUserCatalog = async (
  authToken: string,
  userCatalogId: string
): Promise<UserState> => {
  return axiosPut(authToken, `${API_URL}/students/catalog`, userCatalogId);
};

export const postUserUgData = async (
  authToken: string,
  ugData: string
): Promise<UserState> => {
  return axiosPost(authToken, `${API_URL}/students/courses`, ugData);
};

export const getUserState = async (authToken: string): Promise<UserState> => {
  return axiosGet(authToken, `${API_URL}/students/login`);
};

export const putUserState = async (
  authToken: string,
  updatedUserState: UserDetails
): Promise<{}> => {
  return axiosPut(authToken, `${API_URL}/students/details`, updatedUserState);
};

export const getComputeEndGame = async (
  authToken: string
): Promise<UserState> => {
  return axiosGet(authToken, `${API_URL}/students/degree-status`);
};

export const putUserSettings = async (
  authToken: string,
  updatedUserSettings: UserSettings
): Promise<{}> => {
  return axiosPut(
    authToken,
    `${API_URL}/students/settings`,
    updatedUserSettings
  );
};

const axiosGet = async (
  authToken: string,
  url: string,
  params?: AxiosRequestConfig["params"]
): Promise<any> => {
  const fallback: any = {};
  let res: any;
  try {
    res =
      (
        await axios.get(url, {
          headers: {
            authorization: `${authToken}`,
          },
          params,
        })
      ).data || fallback;
  } catch (e) {
    res = fallback;
    throw e;
  }
  return res;
};

const axiosPut = async (
  authToken: string,
  url: string,
  data: any
): Promise<any> => {
  const fallback: any = {};
  let res: any;
  try {
    res =
      (
        await axios.put(url, data, {
          headers: {
            authorization: `${authToken}`,
          },
        })
      ).data || fallback;
  } catch (e) {
    res = fallback;
    throw e;
  }
  return res;
};

const axiosPost = async (
  authToken: string,
  url: string,
  data: any
): Promise<any> => {
  const fallback: any = {};
  let res: any;
  try {
    res =
      (
        await axios.post(url, data, {
          headers: {
            authorization: `${authToken}`,
          },
        })
      ).data || fallback;
  } catch (e) {
    res = fallback;
    throw e;
  }
  return res;
};
