import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { requete } from '../api/apiClient';

interface Centre {
  id: number;
  code_cts: string;
  nom_centre: string;
  type_structure: string;
  region?: string | null;
  lieu?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  donneurs?: number;
  dons_du_jour?: number;
  google_maps_url?: string | null;
}

export default function EcranCentres() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const reponse = await requete('get', '/centres-transfusion');
      setCentres(reponse?.data?.centres ?? []);
    } catch (erreur: any) {
      setCentres([]);
      if (!erreur?.response) Alert.alert('Hors-ligne', 'La liste des centres sera disponible dès le retour de la connexion.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirItineraire = async (centre: Centre) => {
    if (!centre.google_maps_url) {
      Alert.alert('Localisation indisponible', 'Les coordonnées de ce centre ne sont pas encore renseignées.');
      return;
    }
    const priseEnCharge = await Linking.canOpenURL(centre.google_maps_url);
    if (priseEnCharge) await Linking.openURL(centre.google_maps_url);
    else Alert.alert('Cartographie indisponible', 'Impossible d’ouvrir l’itinéraire sur cet appareil.');
  };

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={centres}
      keyExtractor={(centre) => String(centre.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} colors={['#ba002b']} />}
      ListHeaderComponent={
        <View style={styles.entete}>
          <Text style={styles.titre}>Centres de transfusion</Text>
          <Text style={styles.sousTitre}>Consultez les coordonnées du centre de travail et ouvrez son itinéraire.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.carte}>
          <Text style={styles.type}>{item.type_structure}</Text>
          <Text style={styles.nom}>{item.nom_centre}</Text>
          <Text style={styles.detail}>{[item.code_cts, item.lieu, item.region].filter(Boolean).join(' · ')}</Text>
          {item.adresse && <Text style={styles.detail}>{item.adresse}</Text>}
          {item.telephone && <Text style={styles.telephone}>{item.telephone}</Text>}
          <Text style={styles.stats}>{item.donneurs ?? 0} donneur(s) · {item.dons_du_jour ?? 0} don(s) aujourd’hui</Text>
          <TouchableOpacity style={styles.bouton} onPress={() => ouvrirItineraire(item)}>
            <Text style={styles.boutonTexte}>Ouvrir l’itinéraire</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucun centre accessible pour ce compte.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#f8fafc' },
  contenu: { padding: 16, paddingBottom: 32 },
  entete: { marginBottom: 14 },
  titre: { fontSize: 22, fontWeight: '700', color: '#7f1d1d' },
  sousTitre: { marginTop: 4, fontSize: 13, color: '#6b7280', lineHeight: 19 },
  carte: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  type: { color: '#b91c1c', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  nom: { color: '#111827', fontSize: 17, fontWeight: '700', marginTop: 3 },
  detail: { color: '#4b5563', fontSize: 13, marginTop: 5 },
  telephone: { color: '#b91c1c', fontSize: 14, fontWeight: '600', marginTop: 9 },
  stats: { color: '#6b7280', fontSize: 12, marginTop: 8 },
  bouton: { alignSelf: 'flex-start', backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 8, marginTop: 14, paddingHorizontal: 12, paddingVertical: 9 },
  boutonTexte: { color: '#b91c1c', fontSize: 13, fontWeight: '700' },
  vide: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 28 },
});
