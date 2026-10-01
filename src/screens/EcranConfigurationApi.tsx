import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getApiUrl, setApiUrl } from '../api/apiClient';

export default function EcranConfigurationApi({ navigation }: { navigation: any }) {
  const [url, setUrl] = useState('');

  useEffect(() => { getApiUrl().then(setUrl); }, []);

  const enregistrer = async () => {
    const valeur = url.trim().replace(/\/$/, '');
    if (!/^https?:\/\/.+\/api\/v1$/i.test(valeur)) {
      Alert.alert('Adresse invalide', __DEV__
        ? 'Utilisez une adresse HTTP ou HTTPS complète terminant par /api/v1.'
        : 'Utilisez l’adresse HTTPS de production, terminant par /api/v1.');
      return;
    }
    try {
      await setApiUrl(valeur);
      Alert.alert('Adresse enregistrée', 'Vous pouvez maintenant vous connecter.', [{ text: 'Retour', onPress: () => navigation.goBack() }]);
    } catch (erreur) {
      Alert.alert('Adresse non sécurisée', erreur instanceof Error ? erreur.message : 'L’adresse API doit utiliser HTTPS en production.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.carte}>
        <Text style={styles.titre}>Adresse du serveur CNTS</Text>
        <Text style={styles.texte}>{__DEV__
          ? <>En développement, saisissez l’adresse du serveur API, suivie de <Text style={styles.gras}>/api/v1</Text>.</>
          : <>En production, saisissez l’adresse HTTPS de l’API, suivie de <Text style={styles.gras}>/api/v1</Text>.</>}
        </Text>
        <TextInput style={styles.champ} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder={__DEV__ ? 'http://192.168.1.10:8000/api/v1' : 'https://serveur-cnts/api/v1'} />
        <TouchableOpacity style={styles.bouton} onPress={enregistrer}><Text style={styles.boutonTexte}>Enregistrer l’adresse</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', backgroundColor: '#7f1d1d', padding: 24 },
  carte: { backgroundColor: '#fff', borderRadius: 18, padding: 24 }, titre: { color: '#7f1d1d', fontSize: 21, fontWeight: '800' },
  texte: { color: '#4b5563', fontSize: 14, lineHeight: 21, marginTop: 10 }, gras: { fontWeight: '800' },
  champ: { borderColor: '#d1d5db', borderWidth: 1, borderRadius: 9, padding: 12, fontSize: 14, marginTop: 18 },
  bouton: { backgroundColor: '#ba002b', borderRadius: 9, paddingVertical: 13, alignItems: 'center', marginTop: 16 }, boutonTexte: { color: '#fff', fontWeight: '800' },
});
