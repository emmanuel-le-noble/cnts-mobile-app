import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, getToken, requete, setCentreActifId, setToken } from '../api/apiClient';

const CLE_UTILISATEUR = 'cnts_user_snapshot';

interface Utilisateur {
  id: number;
  nom_complet: string;
  email: string;
  roles?: { code: string; libelle: string }[];
  permissions?: string[];
}

interface AuthContexte {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string) => Promise<{ ok: boolean; message?: string }>;
  deconnexion: () => Promise<void>;
}

const Contexte = createContext<AuthContexte | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    const restaurer = async () => {
      const jeton = await getToken();
      if (!jeton) {
        if (actif) setChargement(false);
        return;
      }
      const instantane = await AsyncStorage.getItem(CLE_UTILISATEUR);
      if (instantane && actif) {
        try { setUtilisateur(JSON.parse(instantane) as Utilisateur); } catch { await AsyncStorage.removeItem(CLE_UTILISATEUR); }
      }
      try {
        const reponse = await requete('get', '/auth/me');
        if (actif && reponse?.success) {
          setUtilisateur(reponse.data);
          await AsyncStorage.setItem(CLE_UTILISATEUR, JSON.stringify(reponse.data));
        }
      } catch (erreur: any) {
        // Une panne réseau n'invalide pas la session locale : les collectes restent saisissables hors ligne.
        if (erreur?.response?.status === 401) {
          await setToken(null);
          await setCentreActifId(null);
          await AsyncStorage.removeItem(CLE_UTILISATEUR);
          if (actif) setUtilisateur(null);
        }
      } finally {
        if (actif) setChargement(false);
      }
    };
    restaurer();
    return () => { actif = false; };
  }, []);

  const connexion = async (email: string, motDePasse: string) => {
    setChargement(true);
    try {
      const reponse = await requete('post', '/auth/login', { email, password: motDePasse });
      await setToken(reponse.data.token);
      await setCentreActifId(null);
      setUtilisateur(reponse.data.user);
      await AsyncStorage.setItem(CLE_UTILISATEUR, JSON.stringify(reponse.data.user));
      return { ok: true };
    } catch (erreur: any) {
      const urlApi = await getApiUrl();
      return {
        ok: false,
        message: erreur?.response?.data?.message
          || (erreur?.request
            ? `Serveur CNTS inaccessible à l’adresse ${urlApi}. Vérifiez le Wi‑Fi, l’IP LAN et que l’API écoute sur 0.0.0.0.`
            : 'Connexion impossible'),
      };
    } finally {
      setChargement(false);
    }
  };

  const deconnexion = async () => {
    try {
      await requete('post', '/auth/logout');
    } catch {
      // on déconnecte localement même hors-ligne
    }
    await setToken(null);
    await setCentreActifId(null);
    await AsyncStorage.removeItem(CLE_UTILISATEUR);
    setUtilisateur(null);
  };

  return (
    <Contexte.Provider value={{ utilisateur, chargement, connexion, deconnexion }}>
      {children}
    </Contexte.Provider>
  );
}

export function useAuth(): AuthContexte {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return contexte;
}
