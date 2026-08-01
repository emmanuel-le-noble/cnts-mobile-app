import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { requete } from '../api/apiClient';
import { ajouterOperationHorsLigne } from '../storage/offlineStore';

interface Props {
  estConnecte: boolean;
  navigation: any;
}

export default function EcranCollecte({ estConnecte }: Props) {
  const [formulaire, setFormulaire] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'M',
    telephone: '',
    poids_kg: '',
    taux_hemoglobine: '',
    type_poche: 'SIMPLE',
    volume_ml: '',
  });
  const [envoi, setEnvoi] = useState(false);

  const majChamp = (champ: string, valeur: string) =>
    setFormulaire((f) => ({ ...f, [champ]: valeur }));

  const collecter = async () => {
    if (!formulaire.nom || !formulaire.prenom || !formulaire.date_naissance) {
      Alert.alert('Champs manquants', 'Nom, prénom et date de naissance sont obligatoires.');
      return;
    }

    const donnees = {
      nom: formulaire.nom,
      prenom: formulaire.prenom,
      date_naissance: formulaire.date_naissance,
      sexe: formulaire.sexe,
      telephone: formulaire.telephone || undefined,
      poids_kg: formulaire.poids_kg ? Number(formulaire.poids_kg) : undefined,
      taux_hemoglobine: formulaire.taux_hemoglobine ? Number(formulaire.taux_hemoglobine) : undefined,
      type_consultation: 'EXTERNE_MOBILE',
      decision_aptitude: 'APTE',
      type_poche: formulaire.type_poche,
      volume_ml: formulaire.volume_ml ? Number(formulaire.volume_ml) : undefined,
    };

    setEnvoi(true);
    try {
      if (estConnecte) {
        const reponse = await requete('post', '/collecte-mobile', donnees);
        Alert.alert('Collecte réussie', reponse.message || 'Don de sang enregistré.');
      } else {
        await ajouterOperationHorsLigne({ method: 'post', url: '/collecte-mobile', data: donnees });
        Alert.alert('Collecte enregistrée', 'Saisie sauvegardée localement. Elle sera synchronisée dès le retour du réseau.');
      }
      setFormulaire({
        nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '',
        poids_kg: '', taux_hemoglobine: '', type_poche: 'SIMPLE', volume_ml: '',
      });
    } catch (erreur: any) {
      const message = erreur?.response?.data?.message;
      if (message) {
        Alert.alert('Enregistrement en local', message);
        await ajouterOperationHorsLigne({ method: 'post', url: '/collecte-mobile', data: donnees });
      } else {
        Alert.alert('Erreur', message || 'La collecte a échoué, réessayez.');
      }
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Collecte mobile de sang</Text>
        <Text style={styles.sousTitre}>
          {estConnecte
            ? 'Enregistrement en ligne'
            : 'Mode hors-ligne : la saisie sera synchronisée plus tard'}
        </Text>

        <View style={styles.champLigne}>
          <View style={styles.champMoitie}>
            <Text style={styles.libelle}>Nom *</Text>
            <TextInput style={styles.champ} value={formulaire.nom} onChangeText={(v) => majChamp('nom', v)} />
          </View>
          <View style={styles.champMoitie}>
            <Text style={styles.libelle}>Prénom *</Text>
            <TextInput style={styles.champ} value={formulaire.prenom} onChangeText={(v) => majChamp('prenom', v)} />
          </View>
        </View>

        <Text style={styles.libelle}>Date de naissance *</Text>
        <TextInput style={styles.champ} placeholder="AAAA-MM-JJ" value={formulaire.date_naissance} onChangeText={(v) => majChamp('date_naissance', v)} />

        <Text style={styles.libelle}>Sexe</Text>
        <View style={styles.sexeLigne}>
          {(['M', 'F'] as const).map((sexe) => (
            <TouchableOpacity
              key={sexe}
              style={[styles.puceSexe, formulaire.sexe === sexe && styles.puceSexeActive]}
              onPress={() => majChamp('sexe', sexe)}
            >
              <Text style={formulaire.sexe === sexe ? styles.puceSexeTexteActive : styles.puceSexeTexte}>
                {sexe === 'M' ? 'Masculin' : 'Féminin'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.libelle}>Téléphone</Text>
        <TextInput style={styles.champ} keyboardType="phone-pad" value={formulaire.telephone} onChangeText={(v) => majChamp('telephone', v)} />

        <View style={styles.champLigne}>
          <View style={styles.champMoitie}>
            <Text style={styles.libelle}>Poids (kg)</Text>
            <TextInput style={styles.champ} keyboardType="decimal-pad" value={formulaire.poids_kg} onChangeText={(v) => majChamp('poids_kg', v)} />
          </View>
          <View style={styles.champMoitie}>
            <Text style={styles.libelle}>Hémoglobine (g/dL)</Text>
            <TextInput style={styles.champ} keyboardType="decimal-pad" value={formulaire.taux_hemoglobine} onChangeText={(v) => majChamp('taux_hemoglobine', v)} />
          </View>
        </View>

        <Text style={styles.libelle}>Type de poche</Text>
        <View style={styles.champLigne}>
          {(['SIMPLE', 'DOUBLE', 'TRIPLE'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.puceSexe, formulaire.type_poche === type && styles.puceSexeActive]}
              onPress={() => majChamp('type_poche', type)}
            >
              <Text style={formulaire.type_poche === type ? styles.puceSexeTexteActive : styles.puceSexeTexte}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.libelle}>Volume (ml)</Text>
        <TextInput style={styles.champ} keyboardType="numeric" value={formulaire.volume_ml} onChangeText={(v) => majChamp('volume_ml', v)} />

        <TouchableOpacity style={[styles.bouton, envoi && styles.boutonDesactive]} onPress={collecter} disabled={envoi}>
          <Text style={styles.boutonTexte}>{envoi ? 'Enregistrement…' : 'Enregistrer la collecte'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteneur: { flex: 1, backgroundColor: '#f8fafc' },
  contenu: { padding: 16, paddingBottom: 40 },
  titre: { fontSize: 22, fontWeight: 'bold', color: '#7f1d1d' },
  sousTitre: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  libelle: { fontSize: 13, color: '#374151', marginBottom: 4, marginTop: 10, fontWeight: '500' },
  champ: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff',
  },
  champLigne: { flexDirection: 'row', gap: 10 },
  champMoitie: { flex: 1 },
  sexeLigne: { flexDirection: 'row', gap: 10 },
  puceSexe: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff',
  },
  puceSexeActive: { backgroundColor: '#7f1d1d', borderColor: '#7f1d1d' },
  puceSexeTexte: { color: '#374151', fontWeight: '500' },
  puceSexeTexteActive: { color: '#fff', fontWeight: '600' },
  bouton: { backgroundColor: '#b91c1c', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  boutonDesactive: { opacity: 0.5 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
