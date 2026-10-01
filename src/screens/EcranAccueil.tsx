import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCentreActif } from '../contexts/CentreActifContext';
import { requete } from '../api/apiClient';
import { lireQueue } from '../storage/offlineStore';

interface Stats {
  donneurs_aujourdhui: number;
  prelevements_aujourdhui: number;
  psl_en_stock: number;
  recettes_aujourdhui_fcfa: number;
}

export default function EcranAccueil({
  estConnecte,
  navigation,
}: {
  estConnecte: boolean;
  navigation: any;
}) {
  const { utilisateur, deconnexion } = useAuth();
  const { estAdminGeneral, centreActif, centreActifId } = useCentreActif();
  const [stats, setStats] = useState<Stats | null>(null);
  const [enAttente, setEnAttente] = useState(0);

  useEffect(() => {
    requete('get', '/reporting/dashboard')
      .then((reponse) => setStats(reponse.data))
      .catch(() => setStats(null));
  }, [estConnecte]);

  useEffect(() => {
    lireQueue().then((queue) => setEnAttente(queue.length));
  }, [estConnecte]);

  const role = utilisateur?.roles?.[0]?.code || '';
  const permissions = utilisateur?.permissions || [];
  const estAdminNational = utilisateur?.roles?.some((r) => r.code === 'ADMIN_NATIONAL') || false;
  const peut = (permission: string) => estAdminNational || permissions.includes(permission);
  const sansCentre = estAdminGeneral && centreActifId === null;

  const ouvrirCollecte = () => {
    if (sansCentre) {
      Alert.alert('Centre requis', 'Choisissez d\'abord votre centre de travail.');
      return;
    }
    navigation.navigate('Collecte');
  };

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <View>
          <Text style={styles.salutation}>Bonjour,</Text>
          <Text style={styles.nom}>{utilisateur?.nom_complet}</Text>
          <Text style={styles.role}>{role}</Text>
          {estAdminGeneral ? (
            <TouchableOpacity onPress={() => navigation.navigate('SelectionCentre')}>
              <Text style={[styles.centre, styles.centreCliquable]}>
                {centreActif?.nom_centre
                  ? `Centre : ${centreActif.nom_centre}`
                  : centreActifId !== null
                    ? 'Centre chargé…'
                    : 'Aucun centre sélectionné — touchez pour choisir'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.centre}>
              {centreActif?.nom_centre
                ? `Centre : ${centreActif.nom_centre}`
                : 'Centre non renseigné'}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={deconnexion} style={styles.boutonDeconnexion}>
          <Text style={styles.boutonDeconnexionTexte}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.bandeau, estConnecte ? styles.enLigne : styles.horsLigne]}>
        <Text style={styles.bandeauTexte}>
          {estConnecte ? '● Connecté — synchronisation active' : '○ Hors-ligne — saisies enregistrées localement'}
        </Text>
      </View>

      {sansCentre && (
        <TouchableOpacity
          style={styles.centreRequis}
          onPress={() => navigation.navigate('SelectionCentre')}
        >
          <Text style={styles.centreRequisTitre}>Aucun centre sélectionné</Text>
          <Text style={styles.centreRequisTexte}>
            L'administrateur national doit choisir son centre de travail pour consulter les données et enregistrer des collectes.
          </Text>
          <Text style={styles.centreRequisAction}>Choisir un centre →</Text>
        </TouchableOpacity>
      )}

      {enAttente > 0 && (
        <View style={styles.attente}>
          <Text style={styles.attenteTexte}>{enAttente} opération(s) en attente de synchronisation</Text>
        </View>
      )}

      <View style={styles.grille}>
        <View style={styles.carteStat}>
          <Text style={styles.valeurStat}>{stats?.donneurs_aujourdhui ?? '—'}</Text>
          <Text style={styles.libelleStat}>Donneurs aujourd'hui</Text>
        </View>
        <View style={styles.carteStat}>
          <Text style={styles.valeurStat}>{stats?.prelevements_aujourdhui ?? '—'}</Text>
          <Text style={styles.libelleStat}>Prélèvements</Text>
        </View>
        <View style={styles.carteStat}>
          <Text style={styles.valeurStat}>{stats?.psl_en_stock ?? '—'}</Text>
          <Text style={styles.libelleStat}>PSL en stock</Text>
        </View>
        <View style={styles.carteStat}>
          <Text style={styles.valeurStat}>{stats?.recettes_aujourdhui_fcfa ?? '—'}</Text>
          <Text style={styles.libelleStat}>Recettes (FCFA)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitre}>Actions rapides</Text>
      <FlatList
        data={[
          { titre: 'Nouvelle collecte', ecran: 'Collecte', description: 'Donneur, consultation et prélèvement', onPress: ouvrirCollecte },
          { titre: 'Centres de transfusion', ecran: 'Centres', description: 'Coordonnées et itinéraires des centres accessibles', onPress: () => navigation.navigate('Centres') },
          ...(estAdminGeneral
            ? [{ titre: 'Changer de centre', ecran: 'SelectionCentre', description: 'Centre de travail utilisé pour les données', onPress: () => navigation.navigate('SelectionCentre') }]
            : []),
          ...(peut('alertes_urgentes.consulter')
            ? [{ titre: 'Alertes urgentes', ecran: 'AlertesUrgentes', description: 'Consulter les alertes destinées à votre profil', onPress: () => navigation.navigate('AlertesUrgentes') }]
            : []),
          ...(peut('demandes_sang.consulter')
            ? [{ titre: 'Demandes de sang', ecran: 'DemandesSang', description: 'Suivre et prendre en charge les demandes de PSL', onPress: () => navigation.navigate('DemandesSang') }]
            : []),
          { titre: 'Configuration', ecran: 'Parametres', description: 'Adresse du serveur API', onPress: () => navigation.navigate('Parametres') },
        ]}
        keyExtractor={(item) => item.titre}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.action} onPress={item.onPress}>
            <Text style={styles.actionTitre}>{item.titre}</Text>
            <Text style={styles.actionDescription}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  salutation: { fontSize: 14, color: '#6b7280' },
  nom: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  role: { fontSize: 12, color: '#b91c1c', fontWeight: '600' },
  centre: { fontSize: 12, color: '#374151', marginTop: 4 },
  centreCliquable: { color: '#b91c1c', fontWeight: '600', textDecorationLine: 'underline' },
  boutonDeconnexion: { backgroundColor: '#fecaca', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  boutonDeconnexionTexte: { color: '#991b1b', fontWeight: '600' },
  bandeau: { borderRadius: 8, padding: 10, marginBottom: 8 },
  enLigne: { backgroundColor: '#dcfce7' },
  horsLigne: { backgroundColor: '#fef9c3' },
  bandeauTexte: { color: '#166534', fontSize: 13, fontWeight: '500' },
  centreRequis: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 14, marginBottom: 10 },
  centreRequisTitre: { fontSize: 15, fontWeight: '700', color: '#991b1b' },
  centreRequisTexte: { fontSize: 13, color: '#7f1d1d', marginTop: 4 },
  centreRequisAction: { fontSize: 13, fontWeight: '700', color: '#b91c1c', marginTop: 8 },
  attente: { backgroundColor: '#fde68a', borderRadius: 8, padding: 10, marginBottom: 12 },
  attenteTexte: { color: '#92400e', fontSize: 13, fontWeight: '500' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  carteStat: { backgroundColor: '#fff', borderRadius: 10, padding: 16, width: '47%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  valeurStat: { fontSize: 24, fontWeight: 'bold', color: '#7f1d1d' },
  libelleStat: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  sectionTitre: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  action: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionTitre: { fontSize: 16, fontWeight: '600', color: '#7f1d1d' },
  actionDescription: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
