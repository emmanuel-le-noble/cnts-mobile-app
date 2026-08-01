import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { requete, setToken } from '../api/apiClient';

interface Utilisateur {
  id: number;
  nom_complet: string;
  email: string;
  roles?: { code: string; libelle: string }[];
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
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    requete('get', '/auth/me')
      .then((reponse) => {
        if (reponse?.success) {
          setUtilisateur(reponse.data);
        }
      })
      .catch(() => {
        setToken(null);
      });
  }, []);

  const connexion = async (email: string, motDePasse: string) => {
    setChargement(true);
    try {
      const reponse = await requete('post', '/auth/login', { email, password: motDePasse });
      await setToken(reponse.data.token);
      setUtilisateur(reponse.data.user);
      return { ok: true };
    } catch (erreur: any) {
      return {
        ok: false,
        message: erreur?.response?.data?.message || 'Connexion impossible',
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
