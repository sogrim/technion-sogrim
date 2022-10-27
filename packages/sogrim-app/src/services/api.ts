import axios from "axios";
import {
  UserDetails,
  UserState,
  Catalog,
  Course,
  UserSettings,
} from "../types/data-types";
import { API_URL } from "./api-url";

export const getCatalogs = async (authToken: string): Promise<Catalog[]> => {
  const fallback: Catalog[] = [];
  let res: Catalog[];
  try {
    res =
      (
        await axios.get(`${API_URL}/catalogs`, {
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

export const getCourseByFilter = async (
  authToken: string,
  filterName: string,
  filter: string
): Promise<Course[]> => {
  const fallback: Course[] = [];
  let res: Course[];
  if (!filter) {
    return [];
  }
  try {
    res =
      (
        await axios.get(`${API_URL}/students/courses?${filterName}=${filter}`, {
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

export const putUserCatalog = async (
  authToken: string,
  userCatalogId: string
): Promise<UserState> => {
  let res: UserState;

  res = await axios.put(
    `${API_URL}/students/catalog`,
    userCatalogId || ({} as UserState),
    {
      headers: {
        authorization: `${authToken}`,
      },
    }
  );
  return res;
};

export const postUserUgData = async (
  authToken: string,
  ugData: string
): Promise<UserState> => {
  const fallback: UserState = {} as UserState;
  let res: UserState;
  try {
    res =
      (
        await axios.post(`${API_URL}/students/courses`, ugData, {
          headers: {
            authorization: `${authToken}`,
          },
        })
      ).data || fallback;
  } catch {
    res = fallback;
  }

  return res;
};

export const getUserState = async (authToken: string): Promise<UserState> => {
  const fallback: UserState = {} as UserState;
  let res: UserState;
  try {
    res =
      (
        await axios.get(`${API_URL}/students/login`, {
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

export const putUserState = async (
  authToken: string,
  updatedUserState: UserDetails
): Promise<UserDetails> => {
  const fallback: UserDetails = {} as UserDetails;
  let res: UserDetails;
  try {
    res =
      (
        await axios.put(`${API_URL}/students/details`, updatedUserState, {
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

export const getComputeEndGame = async (
  authToken: string
): Promise<UserState> => {
  const fallback: UserState = {} as UserState;
  let res: UserState;
  try {
    res =
      (
        await axios.get(`${API_URL}/students/degree-status`, {
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

export const putUserSettings = async (
  authToken: string,
  updatedUserSettings: UserSettings
): Promise<UserSettings> => {
  const fallback: UserSettings = {} as UserSettings;
  let res: UserSettings;
  try {
    res =
      (
        await axios.put(`${API_URL}/students/settings`, updatedUserSettings, {
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
