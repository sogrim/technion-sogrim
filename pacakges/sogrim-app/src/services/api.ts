import axios from "axios";
import { Catalog, UserState } from "../types/data-types";
import { API_URL } from "./api-url";

export const getCatalogs = async (authToken: any): Promise<any> => {
    let fallback: any;
    let res: any;
    try {
        res = (await axios.get(`${API_URL}/catalogs`, { 
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res.data;
}

export const putUserCatalog = async (authToken: any, userCatalogId: string): Promise<Catalog> => {
    const fallback: Catalog = {} as Catalog;
    let res: Catalog;
    try {
        res = (await axios.post(`${API_URL}/user/catalog`, userCatalogId, { // TODO: put, with benny
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res;
}

export const putUserUgData = async (authToken: any, ugData: string): Promise<any> => {
    const fallback: any = {} as any;
    let res: any;
    try {
        res = (await axios.post(`${API_URL}/user/ug_data`, ugData, { 
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res;
} 


export const getUserState = async (authToken: any): Promise<UserState> => {
    const fallback: UserState = {} as UserState;
    let res: UserState;
    try {
        res = (await axios.post(`${API_URL}/user/login`, {}, { // TODO: with benny, should be post?
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res;
}

export const putUserState = async (authToken: any, updatedUserState: UserState): Promise<UserState> => {
    const fallback: UserState = {} as UserState;
    let res: UserState;
    try {
        res = (await axios.put(`${API_URL}/user`, {updatedUserState}, { // TODO: put, benny
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res;
} 