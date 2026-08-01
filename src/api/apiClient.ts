import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

const API_URL_PAR_DEFAUT = 'http://192.168.1.100:8000/api/v1';

export async function getApiUrl(): Promise<string> {
  const url = await AsyncStorage.getItem('cnts_api_url');
  return url || API_URL_PAR_DEFAUT;
}

export async function setApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem('cnts_api_url', url);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('cnts_token');
}

export async function setToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem('cnts_token', token);
  } else {
    await AsyncStorage.removeItem('cnts_token');
  }
}

export async function creerClientApi(): Promise<AxiosInstance> {
  const baseURL = await getApiUrl();
  return axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 15000,
  });
}

export async function requete(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown,
): Promise<any> {
  const client = await creerClientApi();
  const token = await getToken();
  const config = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const reponse = method === 'get' || method === 'delete'
    ? await client[method](url, config)
    : await client[method](url, data, config);
  return reponse.data;
}
