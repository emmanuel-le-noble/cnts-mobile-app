import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import axios, { AxiosInstance } from 'axios';

const API_URL_PAR_DEFAUT = __DEV__
  ? 'http://192.168.1.100:8000/api/v1'
  : (process.env.EXPO_PUBLIC_API_URL || '');

async function lireJeton(cle: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(cle);

  const securise = await SecureStore.getItemAsync(cle);
  if (securise !== null) return securise;

  // Migration transparente des sessions enregistrées avant SecureStore.
  const ancien = await AsyncStorage.getItem(cle);
  if (ancien !== null) {
    await SecureStore.setItemAsync(cle, ancien);
    await AsyncStorage.removeItem(cle);
  }
  return ancien;
}

async function enregistrerJeton(cle: string, jeton: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (jeton) await AsyncStorage.setItem(cle, jeton);
    else await AsyncStorage.removeItem(cle);
    return;
  }

  if (jeton) await SecureStore.setItemAsync(cle, jeton);
  else await SecureStore.deleteItemAsync(cle);
  await AsyncStorage.removeItem(cle);
}

function urlApiValide(url: string): boolean {
  try {
    const parsed = new URL(url);
    const protocoleAutorise = __DEV__
      ? parsed.protocol === 'http:' || parsed.protocol === 'https:'
      : parsed.protocol === 'https:';
    return protocoleAutorise
      && parsed.username === ''
      && parsed.password === ''
      && parsed.pathname.replace(/\/$/, '').endsWith('/api/v1');
  } catch {
    return false;
  }
}

export async function getApiUrl(): Promise<string> {
  const url = await AsyncStorage.getItem('cnts_api_url');
  if (url) return urlApiValide(url) ? url : '';
  return API_URL_PAR_DEFAUT && urlApiValide(API_URL_PAR_DEFAUT) ? API_URL_PAR_DEFAUT : '';
}

export async function setApiUrl(url: string): Promise<void> {
  const normalisee = url.trim().replace(/\/$/, '');
  if (!urlApiValide(normalisee)) {
    throw new Error(__DEV__
      ? 'Indiquez une URL HTTP ou HTTPS complète terminant par /api/v1.'
      : 'En production, l’API doit utiliser une URL HTTPS complète terminant par /api/v1.');
  }
  await AsyncStorage.setItem('cnts_api_url', normalisee);
}

export async function getToken(): Promise<string | null> {
  return lireJeton('cnts_token');
}

export async function setToken(token: string | null): Promise<void> {
  await enregistrerJeton('cnts_token', token);
}

export async function getDonneurToken(): Promise<string | null> {
  return lireJeton('cnts_donneur_token');
}

export async function setDonneurToken(token: string | null): Promise<void> {
  await enregistrerJeton('cnts_donneur_token', token);
}

export async function getCentreActifId(): Promise<string | null> {
  return AsyncStorage.getItem('cnts_centre_actif');
}

export async function setCentreActifId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem('cnts_centre_actif', id);
  } else {
    await AsyncStorage.removeItem('cnts_centre_actif');
  }
}

export async function creerClientApi(): Promise<AxiosInstance> {
  const baseURL = await getApiUrl();
  if (!baseURL) {
    throw new Error('Configurez une URL API HTTPS valide dans les paramètres de l’application.');
  }
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
  const centreActifId = await getCentreActifId();
  const entetes: Record<string, string> = {};
  if (token) {
    entetes.Authorization = `Bearer ${token}`;
  }
  if (centreActifId) {
    entetes['X-Centre-Actif'] = centreActifId;
  }
  const config = { headers: entetes };
  const reponse = method === 'get' || method === 'delete'
    ? await client[method](url, config)
    : await client[method](url, data, config);
  return reponse.data;
}

/** Requêtes de l'espace donneur : token distinct de celui du personnel. */
export async function requeteDonneur(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown,
): Promise<any> {
  const client = await creerClientApi();
  const token = await getDonneurToken();
  const config = { headers: token ? { Authorization: `Bearer ${token}` } : {} };
  const reponse = method === 'get' || method === 'delete'
    ? await client[method](url, config)
    : await client[method](url, data, config);

  return reponse.data;
}
