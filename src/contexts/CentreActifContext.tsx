import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { getCentreActifId, requete, setCentreActifId } from '../api/apiClient';
import { useAuth } from './AuthContext';

export interface Centre {
  id: number;
  code_cts: string;
  nom_centre: string;
  type_structure?: string;
  region?: string;
  lieu?: string;
  adresse?: string;
  telephone?: string;
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url?: string | null;
}

interface ContexteDonnees {
  est_admin_general: boolean;
  centre_actif: Centre | null;
  centres_disponibles: Centre[];
}

interface CentreActifContexte {
  chargement: boolean;
  estAdminGeneral: boolean;
  centreActif: Centre | null;
  centreActifId: number | null;
  centresDisponibles: Centre[];
  changerCentre: (id: number) => Promise<void>;
  quitterCentre: () => Promise<void>;
  recharger: () => Promise<void>;
}

const Contexte = createContext<CentreActifContexte | null>(null);

export function CentreActifProvider({ children }: { children: ReactNode }) {
  const { utilisateur } = useAuth();
  const [chargement, setChargement] = useState(true);
  const [estAdminGeneral, setEstAdminGeneral] = useState(false);
  const [centreActif, setCentreActif] = useState<Centre | null>(null);
  const [centreActifId, setCentreActifIdLocal] = useState<number | null>(null);
  const [centresDisponibles, setCentresDisponibles] = useState<Centre[]>([]);

  const recharger = useCallback(async () => {
    let centre = null as Centre | null;
    let id = null as number | null;
    let centres = [] as Centre[];
    let admin = utilisateur?.roles?.some((role) => role.code === 'ADMIN_NATIONAL') ?? false;
    let contexteServeurDisponible = false;
    try {
      const reponse = await requete('get', '/me/contexte');
      if (reponse?.success) {
        contexteServeurDisponible = true;
        const donnees: ContexteDonnees = reponse.data;
        admin = Boolean(donnees.est_admin_general);
        centre = donnees.centre_actif ?? null;
        centres = donnees.centres_disponibles ?? [];
      }
    } catch {
      // hors-ligne : on garde uniquement l'identifiant enregistré localement
    }
    const enregistre = await getCentreActifId();
    if (enregistre) {
      const numero = Number(enregistre);
      const valide = !admin || !contexteServeurDisponible || centre !== null || centres.some((c) => c.id === numero);
      if (valide) {
        id = numero;
      } else {
        await setCentreActifId(null);
      }
    } else if (!admin) {
      // Pour les rôles ordinaires, le backend verrouille le centre du compte.
      // Garder son identifiant disponible pour les actions qui l'acceptent en payload.
      id = centre?.id ?? null;
    }
    setEstAdminGeneral(admin);
    setCentreActif(centre);
    setCentreActifIdLocal(id);
    setCentresDisponibles(centres);
    setChargement(false);
  }, [utilisateur]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const changerCentre = useCallback(async (id: number) => {
    await setCentreActifId(String(id));
    setCentreActifIdLocal(id);
    setCentreActif((ancien) =>
      ancien?.id === id
        ? ancien
        : centresDisponibles.find((c) => c.id === id) ?? { id, nom_centre: '', code_cts: '' }
    );
  }, [centresDisponibles]);

  const quitterCentre = useCallback(async () => {
    await setCentreActifId(null);
    setCentreActifIdLocal(null);
    setCentreActif(null);
  }, []);

  return (
    <Contexte.Provider
      value={{
        chargement,
        estAdminGeneral,
        centreActif,
        centreActifId,
        centresDisponibles,
        changerCentre,
        quitterCentre,
        recharger,
      }}
    >
      {children}
    </Contexte.Provider>
  );
}

export function useCentreActif(): CentreActifContexte {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error('useCentreActif doit être utilisé dans CentreActifProvider');
  return contexte;
}
