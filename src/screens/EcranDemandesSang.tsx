import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { requete } from '../api/apiClient';
import { useCentreActif } from '../contexts/CentreActifContext';

type Demande = { id: number; code_demande: string; demandeur_nom?: string; patient_nom?: string; medecin_prescripteur?: string; type_psl_requis: string; quantite_requise: number; groupes_sanguins_requis?: string[]; urgence: string; statut: string; motif?: string };

const STATUTS: Record<string, string> = { EN_ATTENTE: 'En attente', EN_COURS: 'En cours', LIVREE: 'Livrée', ANNULEE: 'Annulée' };

export default function EcranDemandesSang() {
  const { centreActifId } = useCentreActif();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [livraison, setLivraison] = useState<Demande | null>(null);
  const [reponseCentre, setReponseCentre] = useState('');
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    setErreur('');
    try {
      const reponse = await requete('get', '/demandes-sang');
      setDemandes(reponse?.data?.data ?? []);
    } catch (e: any) { setErreur(e?.response?.data?.message || 'Impossible de charger les demandes. Vérifiez vos droits et la connexion.'); }
    finally { setChargement(false); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const prendreEnCharge = (demande: Demande) => {
    Alert.alert('Prendre en charge', `Attribuer la demande ${demande.code_demande} à votre centre ?`, [
      { text: 'Retour', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        setAction(true);
        try {
          await requete('post', `/demandes-sang/${demande.id}/prendre-en-charge`, centreActifId ? { centre_id: centreActifId } : {});
          await charger();
          Alert.alert('Demande prise en charge', `${demande.code_demande} est maintenant en cours de traitement.`);
        } catch (e: any) { Alert.alert('Action impossible', e?.response?.data?.message || 'La demande n’a pas pu être prise en charge.'); }
        finally { setAction(false); }
      } },
    ]);
  };

  const marquerLivree = async () => {
    if (!livraison) return;
    setAction(true);
    try {
      await requete('post', `/demandes-sang/${livraison.id}/livree`, { centre_reponse: reponseCentre.trim() || undefined });
      const code = livraison.code_demande;
      setLivraison(null); setReponseCentre(''); await charger();
      Alert.alert('Demande mise à jour', `${code} a été marquée comme livrée.`);
    } catch (e: any) { Alert.alert('Action impossible', e?.response?.data?.message || 'La demande n’a pas pu être mise à jour.'); }
    finally { setAction(false); }
  };

  return <FlatList
    style={styles.page} contentContainerStyle={styles.contenu} data={demandes} keyExtractor={(item) => String(item.id)}
    refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} colors={['#ba002b']} />}
    ListHeaderComponent={<View style={styles.entete}><Text style={styles.kicker}>DISTRIBUTION PSL</Text><Text style={styles.titre}>Demandes de sang</Text><Text style={styles.sousTitre}>Suivez les besoins des établissements et leur prise en charge.</Text>
      {livraison && <View style={styles.formLivraison}><Text style={styles.formTitre}>Confirmer la livraison · {livraison.code_demande}</Text><Text style={styles.libelle}>Note de réponse (facultative)</Text><TextInput style={styles.champ} value={reponseCentre} onChangeText={setReponseCentre} multiline placeholder="Précision pour l’établissement" placeholderTextColor="#94a3b8" /><View style={styles.actionsForm}><TouchableOpacity style={styles.boutonClair} onPress={() => { setLivraison(null); setReponseCentre(''); }}><Text style={styles.boutonClairTexte}>Annuler</Text></TouchableOpacity><TouchableOpacity style={styles.boutonPrincipal} onPress={marquerLivree} disabled={action}><Text style={styles.boutonPrincipalTexte}>{action ? 'Enregistrement…' : 'Confirmer la livraison'}</Text></TouchableOpacity></View></View>}
    </View>}
    renderItem={({ item }) => {
      const critique = item.urgence === 'CRITIQUE';
      return <View style={[styles.carte, critique && styles.carteCritique]}>
        <View style={styles.ligne}><Text style={styles.code}>{item.code_demande}</Text><Text style={[styles.badge, critique ? styles.urgenceCritique : item.urgence === 'URGENT' ? styles.urgence : styles.normal]}>{item.urgence || 'NORMAL'}</Text></View>
        <Text style={styles.etablissement}>{item.demandeur_nom || 'Établissement demandeur'}</Text>
        <Text style={styles.detail}>Patient : {item.patient_nom || '—'}</Text>
        {!!item.medecin_prescripteur && <Text style={styles.detail}>Prescripteur : {item.medecin_prescripteur}</Text>}
        <Text style={styles.besoin}>{item.type_psl_requis} · {item.quantite_requise} unité(s)</Text>
        <Text style={styles.detail}>Groupes demandés : {(item.groupes_sanguins_requis || []).join(', ') || '—'}</Text>
        <View style={styles.basCarte}><Text style={styles.statut}>{STATUTS[item.statut] || item.statut}</Text>
          {item.statut === 'EN_ATTENTE' && <TouchableOpacity style={styles.boutonPrincipal} onPress={() => prendreEnCharge(item)} disabled={action}><Text style={styles.boutonPrincipalTexte}>Prendre en charge</Text></TouchableOpacity>}
          {item.statut === 'EN_COURS' && <TouchableOpacity style={styles.boutonPrincipal} onPress={() => { setLivraison(item); setReponseCentre(''); }}><Text style={styles.boutonPrincipalTexte}>Marquer livrée</Text></TouchableOpacity>}
        </View>
      </View>;
    }}
    ListEmptyComponent={chargement ? <ActivityIndicator color="#ba002b" style={{ marginTop: 28 }} /> : <Text style={styles.vide}>{erreur || 'Aucune demande de sang à afficher.'}</Text>}
  />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#e3e8f3' }, contenu: { padding: 16, paddingBottom: 36 }, entete: { marginBottom: 12 }, kicker: { color: '#ba002b', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, titre: { color: '#141c26', fontSize: 24, fontWeight: '800', marginTop: 5 }, sousTitre: { color: '#5d3f3f', fontSize: 13, lineHeight: 19, marginTop: 4 },
  carte: { backgroundColor: 'rgba(255,255,255,0.84)', borderRadius: 13, borderWidth: 1, borderColor: '#fff', padding: 15, marginBottom: 10 }, carteCritique: { borderLeftWidth: 4, borderLeftColor: '#ba002b' }, ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, code: { color: '#425e91', fontSize: 12, fontWeight: '800' }, badge: { overflow: 'hidden', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: '800' }, urgenceCritique: { backgroundColor: '#fee2e2', color: '#991b1b' }, urgence: { backgroundColor: '#ffedd5', color: '#9a3412' }, normal: { backgroundColor: '#dcfce7', color: '#166534' },
  etablissement: { color: '#141c26', fontSize: 16, fontWeight: '800', marginTop: 10 }, detail: { color: '#64748b', fontSize: 12, marginTop: 5 }, besoin: { color: '#ba002b', fontSize: 14, fontWeight: '800', marginTop: 9 }, basCarte: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 }, statut: { color: '#334155', fontSize: 12, fontWeight: '700' },
  boutonPrincipal: { backgroundColor: '#ba002b', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 }, boutonPrincipalTexte: { color: '#fff', fontSize: 11, fontWeight: '800' }, formLivraison: { backgroundColor: '#fff', padding: 13, borderRadius: 12, marginTop: 14, borderWidth: 1, borderColor: '#e6bdbc' }, formTitre: { color: '#141c26', fontSize: 14, fontWeight: '800' }, libelle: { color: '#475569', fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 5 }, champ: { minHeight: 60, borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: 'top', color: '#141c26' }, actionsForm: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }, boutonClair: { padding: 9 }, boutonClairTexte: { color: '#64748b', fontWeight: '700' }, vide: { color: '#64748b', textAlign: 'center', marginTop: 24 },
});
