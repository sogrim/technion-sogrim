import axios from "axios";
import { UserDetails, UserState, Catalog } from "../types/data-types";
import { API_URL } from "./api-url";

export const getCatalogs = async (authToken: any): Promise<Catalog[]> => {
  let fallback: any;
  let res: any;
  try {
    res =
      (await axios.get(`${API_URL}/catalogs`, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
  } catch (e) {
    res = fallback;
    throw e;
  }
  return res.data;
};

export const putUserCatalog = async (
  authToken: any,
  userCatalogId: string
): Promise<UserState> => {
  const fallback: UserState = {} as UserState;
  let res: UserState;
  try {
    res =
      (await axios.put(
        `${API_URL}/students/catalog`,
        userCatalogId || ({} as UserState),
        {
          headers: {
            authorization: `${authToken}`,
          },
        }
      )) || fallback;
  } catch {
    res = fallback;
  }
  return res;
};

export const postUserUgData = async (
  authToken: any,
  ugData: string
): Promise<UserState> => {
  // const fallback: UserState = {} as UserState;
  let res: UserState;

  res = await axios.post(`${API_URL}/students/courses`, ugData, {
    headers: {
      authorization: `${authToken}`,
    },
  });

  return res;
};

export const getUserState = async (authToken: any): Promise<UserState> => {
  const fallback: UserState = {} as UserState;
  let data: UserState;
  try {
    const res = await axios.get(`${API_URL}/students/login`, {
      headers: {
        authorization: `${authToken}`,
      },
    });
    data = res.data || fallback;
  } catch (e) {
    data = fallback;
    throw e;
  }
  return data;
};

export const putUserState = async (
  authToken: any,
  updatedUserState: UserDetails
): Promise<UserDetails> => {
  const fallback: UserDetails = {} as UserDetails;
  let res: UserDetails;
  try {
    res =
      (await axios.put(`${API_URL}/students/details`, updatedUserState, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
  } catch (e) {
    res = fallback;
    throw e;
  }
  return res;
};

export const getComputeEndGame = async (authToken: any): Promise<UserState> => {
  const fallback: UserState = {} as UserState;
  let res: UserState;
  try {
    res =
      (await axios.get(`${API_URL}/students/degree-status`, {
        headers: {
          authorization: `${authToken}`,
        },
      })) || fallback;
  } catch (e) {
    res = fallback;
    throw e;
  }
  return res;
};
