import axios from "axios";
import { UserDetails, UserState } from "../types/data-types";
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

export const putUserCatalog = async (authToken: any, userCatalogId: string): Promise<UserState> => {
    const fallback: UserState = {} as UserState;
    let res: UserState;
    try {
        res = (await axios.put(`${API_URL}/user/catalog`, userCatalogId || {} as UserState, {
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;      
    } catch {
        res = fallback;
    }
    return res;
}

export const postUserUgData = async (authToken: any, ugData: string): Promise<UserState> => {
    const fallback: UserState = {} as UserState;
    let res: UserState;
    try {
        res = (await axios.post(`${API_URL}/user/courses`, ugData, { 
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
    let data: UserState;
    try {
        const res = (await axios.get(`${API_URL}/user/login`, {
            headers: {
            'authorization': `${authToken}`,        
        }
        }));
        data = res.data || fallback;

    } catch {
        data = fallback;
    }
    return data;
}

export const putUserState = async (authToken: any, updatedUserState: UserDetails): Promise<UserDetails> => {
    const fallback: UserDetails = {} as UserDetails;
    let res: UserDetails;
    try {
        res = (await axios.put(`${API_URL}/user/details`, updatedUserState, { 
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res;
} 

export const getComputeEndGame = async (authToken: any): Promise<UserState> => {
    const fallback: UserState = {} as UserState;
    let res: UserState;
    try {
        res = (await axios.get(`${API_URL}/user/compute`, {
            headers: {
            'authorization': `${authToken}`,        
        }
        })) || fallback;
    } catch {
        res = fallback;
    }
    return res;
} 