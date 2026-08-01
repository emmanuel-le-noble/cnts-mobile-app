import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
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

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <View>
          <Text style={styles.salutation}>Bonjour,</Text>
          <Text style={styles.nom}>{utilisateur?.nom_complet}</Text>
          <Text style={styles.role}>{role}</Text>
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
          { titre: 'Nouvelle collecte', ecran: 'Collecte', description: 'Donneur, consultation et prélèvement' },
          { titre: 'Configuration', ecran: 'Parametres', description: 'Adresse du serveur API' },
        ]}
        keyExtractor={(item) => item.titre}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate(item.ecran)}>
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
  boutonDeconnexion: { backgroundColor: '#fecaca', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  boutonDeconnexionTexte: { color: '#991b1b', fontWeight: '600' },
  bandeau: { borderRadius: 8, padding: 10, marginBottom: 8 },
  enLigne: { backgroundColor: '#dcfce7' },
  horsLigne: { backgroundColor: '#fef9c3' },
  bandeauTexte: { color: '#166534', fontSize: 13, fontWeight: '500' },
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
