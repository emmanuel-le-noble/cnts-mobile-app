import { useState } from 'react';
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

export default function EcranParametres() {
  const [url, setUrl] = useState('');
  const [charge, setCharge] = useState(false);

  const charger = async () => {
    const valeur = await getApiUrl();
    setUrl(valeur);
    setCharge(true);
  };

  if (!charge) {
    charger();
  }

  const enregistrer = async () => {
    if (!url.trim()) {
      Alert.alert('Adresse invalide', 'Saisissez l\'adresse du serveur API.');
      return;
    }
    await setApiUrl(url.trim());
    Alert.alert('Enregistré', 'L\'adresse du serveur a été mise à jour.');
  };

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.carte}>
        <Text style={styles.titre}>Configuration</Text>
        <Text style={styles.sousTitre}>Adresse du serveur API (ex. http://192.168.1.100:8000/api/v1)</Text>
        <TextInput
          style={styles.champ}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={url}
          onChangeText={setUrl}
          placeholder="http://…/api/v1"
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
  carte: { backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  titre: { fontSize: 20, fontWeight: 'bold', color: '#7f1d1d' },
  sousTitre: { fontSize: 13, color: '#6b7280', marginBottom: 12, marginTop: 4 },
  champ: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  bouton: { backgroundColor: '#b91c1c', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
