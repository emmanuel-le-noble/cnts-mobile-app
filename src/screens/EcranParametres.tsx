import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiUrl, setApiUrl } from '../api/apiClient';
import { useCentreActif } from '../contexts/CentreActifContext';

export default function EcranParametres({ navigation }: { navigation: any }) {
  const { estAdminGeneral, centreActif, centreActifId } = useCentreActif();
  const [url, setUrl] = useState('');

  useEffect(() => {
    let actif = true;
    getApiUrl()
      .then((valeur) => {
        if (actif) setUrl(valeur);
      })
    return () => { actif = false; };
  }, []);

  const enregistrer = async () => {
    if (!url.trim()) {
      Alert.alert('Adresse invalide', 'Saisissez l\'adresse du serveur API.');
      return;
    }
    try {
      await setApiUrl(url.trim());
      Alert.alert('Enregistré', 'L\'adresse du serveur a été mise à jour.');
    } catch (erreur) {
      Alert.alert('Adresse non sécurisée', erreur instanceof Error ? erreur.message : 'L’adresse API doit utiliser HTTPS en production.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.carte}>
        <Text style={styles.titre}>Centre de travail</Text>
        <Text style={styles.sousTitre}>
          {centreActif?.nom_centre
            ? `Vous travaillez sur : ${centreActif.nom_centre} (${centreActif.code_cts})`
            : centreActifId !== null
              ? 'Centre en cours de chargement…'
              : estAdminGeneral
                ? 'Aucun centre sélectionné — les données seront inaccessibles tant que vous n\'avez pas choisi votre centre.'
                : 'Aucun centre associé à votre compte.'}
        </Text>
        {estAdminGeneral && (
          <TouchableOpacity style={styles.boutonSecondaire} onPress={() => navigation.navigate('SelectionCentre')}>
            <Text style={styles.boutonSecondaireTexte}>
              {centreActifId !== null ? 'Changer de centre' : 'Choisir un centre'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Configuration</Text>
        <Text style={styles.sousTitre}>{__DEV__
          ? 'Adresse du serveur API (HTTP ou HTTPS, terminant par /api/v1).'
          : 'Adresse HTTPS de l’API de production, terminant par /api/v1.'}</Text>
        <TextInput
          style={styles.champ}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={url}
          onChangeText={setUrl}
          placeholder={__DEV__ ? 'http://…/api/v1' : 'https://…/api/v1'}
        />
        <TouchableOpacity style={styles.bouton} onPress={enregistrer}>
          <Text style={styles.boutonTexte}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#f8fafc', padding: 16, justifyContent: 'center' },
  carte: { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 16 },
  titre: { fontSize: 20, fontWeight: 'bold', color: '#7f1d1d' },
  sousTitre: { fontSize: 13, color: '#6b7280', marginBottom: 12, marginTop: 4 },
  boutonSecondaire: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  boutonSecondaireTexte: { color: '#b91c1c', fontSize: 15, fontWeight: '600' },
  champ: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  bouton: { backgroundColor: '#b91c1c', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
