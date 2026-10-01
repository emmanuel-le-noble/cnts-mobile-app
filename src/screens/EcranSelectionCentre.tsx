import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCentreActif } from '../contexts/CentreActifContext';

export default function EcranSelectionCentre({ navigation }: { navigation: any }) {
  const { centresDisponibles, centreActifId, changerCentre, quitterCentre } = useCentreActif();

  const choisir = async (id: number) => {
    await changerCentre(id);
    navigation.goBack();
  };

  const quitter = async () => {
    await quitterCentre();
    navigation.goBack();
  };

  return (
    <View style={styles.conteneur}>
      <Text style={styles.sousTitre}>
        Le centre sélectionné détermine les données affichées et enregistrées (collecte, rapports).
      </Text>

      <FlatList
        data={centresDisponibles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const actif = item.id === centreActifId;
          return (
            <TouchableOpacity
              style={[styles.carte, actif && styles.carteActive]}
              onPress={() => choisir(item.id)}
            >
              <View style={styles.carteEntete}>
                <Text style={styles.carteNom}>{item.nom_centre}</Text>
                {actif && <Text style={styles.badgeActif}>ACTIF</Text>}
              </View>
              <Text style={styles.carteCode}>{item.code_cts}</Text>
              <Text style={styles.carteDetail}>
                {[item.type_structure, item.region, item.lieu].filter(Boolean).join(' · ') || '—'}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.vide}>Aucun centre disponible. Votre compte est rattaché à un centre spécifique.</Text>
        }
      />

      {centreActifId !== null && (
        <TouchableOpacity style={styles.boutonQuitter} onPress={quitter}>
          <Text style={styles.boutonQuitterTexte}>Quitter le centre sélectionné</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  sousTitre: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  carte: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  carteActive: { borderColor: '#b91c1c', borderWidth: 2 },
  carteEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carteNom: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  badgeActif: { color: '#166534', backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, fontWeight: '700', overflow: 'hidden' },
  carteCode: { fontSize: 13, color: '#b91c1c', fontWeight: '600', marginTop: 4 },
  carteDetail: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  vide: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 24 },
  boutonQuitter: { backgroundColor: '#fecaca', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  boutonQuitterTexte: { color: '#991b1b', fontWeight: '600' },
});