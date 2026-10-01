import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { requete } from '../api/apiClient';

type Alerte = { id: number; titre: string; message: string; niveau: string; statut: string; source?: string; created_at?: string; centre?: { nom_centre?: string } };

export default function EcranAlertesUrgentes() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    setErreur('');
    try {
      const reponse = await requete('get', '/alertes-urgentes');
      setAlertes(reponse?.data?.data ?? []);
    } catch (e: any) {
      setErreur(e?.response?.data?.message || 'Impossible de charger les alertes. Vérifiez votre accès et la connexion.');
    } finally { setChargement(false); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const marquerLue = async (alerte: Alerte) => {
    setAction(true);
    try {
      await requete('post', `/alertes-urgentes/${alerte.id}/lire`);
      Alert.alert('Alerte lue', 'Cette alerte a été marquée comme lue.');
    } catch (e: any) { Alert.alert('Action impossible', e?.response?.data?.message || 'Impossible de marquer cette alerte comme lue.'); }
    finally { setAction(false); }
  };

  const toutesLues = async () => {
    setAction(true);
    try {
      const reponse = await requete('post', '/alertes-urgentes/toutes-lues');
      Alert.alert('Alertes mises à jour', reponse?.message || 'Toutes les alertes ont été marquées comme lues.');
      await charger();
    } catch (e: any) { Alert.alert('Action impossible', e?.response?.data?.message || 'Impossible de mettre à jour les alertes.'); }
    finally { setAction(false); }
  };

  return (
    <FlatList
      style={styles.page} contentContainerStyle={styles.contenu} data={alertes} keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} colors={['#ba002b']} />}
      ListHeaderComponent={<View style={styles.entete}><Text style={styles.kicker}>INFORMATION PERSONNEL</Text><Text style={styles.titre}>Alertes urgentes</Text><Text style={styles.sousTitre}>Consultez les alertes actives de votre centre.</Text><TouchableOpacity style={styles.boutonSecondaire} onPress={toutesLues} disabled={action}><Text style={styles.boutonSecondaireTexte}>{action ? 'Mise à jour…' : 'Tout marquer comme lu'}</Text></TouchableOpacity></View>}
      renderItem={({ item }) => {
        const critique = item.niveau === 'CRITIQUE';
        return <View style={[styles.carte, critique && styles.carteCritique]}>
          <View style={styles.ligne}><Text style={[styles.badge, critique ? styles.badgeCritique : styles.badgeInfo]}>{item.niveau || 'INFO'}</Text><Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''}</Text></View>
          <Text style={styles.alerteTitre}>{item.titre}</Text><Text style={styles.message}>{item.message}</Text>
          {!!item.centre?.nom_centre && <Text style={styles.centre}>{item.centre.nom_centre}</Text>}
          <TouchableOpacity style={styles.action} onPress={() => marquerLue(item)} disabled={action}><Text style={styles.actionTexte}>Marquer comme lue</Text></TouchableOpacity>
        </View>;
      }}
      ListEmptyComponent={chargement ? <ActivityIndicator color="#ba002b" style={{ marginTop: 28 }} /> : <Text style={styles.vide}>{erreur || 'Aucune alerte urgente à afficher.'}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#e3e8f3' }, contenu: { padding: 16, paddingBottom: 36 }, entete: { marginBottom: 12 }, kicker: { color: '#ba002b', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, titre: { color: '#141c26', fontSize: 24, fontWeight: '800', marginTop: 5 }, sousTitre: { color: '#5d3f3f', fontSize: 13, marginTop: 4 },
  boutonSecondaire: { alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, marginTop: 12, borderWidth: 1, borderColor: '#e6bdbc' }, boutonSecondaireTexte: { color: '#ba002b', fontWeight: '700', fontSize: 12 },
  carte: { backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 13, borderWidth: 1, borderColor: '#fff', padding: 15, marginBottom: 10 }, carteCritique: { borderLeftWidth: 4, borderLeftColor: '#ba002b' }, ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, badge: { overflow: 'hidden', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: '800' }, badgeCritique: { backgroundColor: '#fee2e2', color: '#991b1b' }, badgeInfo: { backgroundColor: '#ffedd5', color: '#9a3412' }, date: { color: '#64748b', fontSize: 11 }, alerteTitre: { color: '#141c26', fontSize: 16, fontWeight: '800', marginTop: 10 }, message: { color: '#475569', fontSize: 13, lineHeight: 19, marginTop: 5 }, centre: { color: '#64748b', fontSize: 11, marginTop: 8 }, action: { alignSelf: 'flex-start', paddingVertical: 8, marginTop: 6 }, actionTexte: { color: '#425e91', fontSize: 12, fontWeight: '800' }, vide: { textAlign: 'center', color: '#64748b', marginTop: 24, lineHeight: 20 },
});
