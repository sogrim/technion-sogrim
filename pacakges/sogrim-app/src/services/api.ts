import axios from "axios";
import { Catalog, UserState } from "../types/data-types";

const api = axios.create({
    baseURL: '',
})

export const getCatalogs = async (): Promise<Catalog> => {
    const res = await api.get('/catalogs');
    return res;
} 

export const getUserState = async (): Promise<UserState> => {
    const res = await api.get('/user')
    return res;
} 

export const postUserCoursesRaw = async (coursesRaw: string): Promise<UserState> => {
    const res = await api.post('', coursesRaw);
    return res;
} 