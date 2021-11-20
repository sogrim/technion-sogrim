import axios from "axios";
import { Catalog, UserState } from "../types/data-types";
import { API_URL } from "./api-url";

export const getCatalogs = async (authToken: any): Promise<Catalog[]> => {
    const fallback: Catalog[] = [];
    let res: Catalog[];
    try {
        res = (await axios.get(`${API_URL}/catalogs`, { // TODO: with benny,
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
    const fallback = {}
    let res;
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

export const postUserState = async (authToken: any): Promise<UserState> => {
    const fallback = {}
    let res;
    try {
        res = (await axios.put(`${API_URL}/user`, {}, { // TODO: put, benny
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res;
} 