import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function EcranConnexion() {
  const { connexion, chargement } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const seConnecter = async () => {
    setErreur(null);
    const resultat = await connexion(email, motDePasse);
    if (!resultat.ok) {
      setErreur(resultat.message || 'Erreur de connexion');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.conteneur}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.carte}>
        <Text style={styles.titre}>CNTS Togo</Text>
        <Text style={styles.sousTitre}>Collecte mobile de sang</Text>

        {erreur && <Text style={styles.erreur}>{erreur}</Text>}

        <TextInput
          style={styles.champ}
          placeholder="Adresse email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.champ}
          placeholder="Mot de passe"
          secureTextEntry
          value={motDePasse}
          onChangeText={setMotDePasse}
        />

        <TouchableOpacity style={styles.bouton} onPress={seConnecter} disabled={chargement}>
          {chargement ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.boutonTexte}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, justifyContent: 'center', backgroundColor: '#7f1d1d', padding: 24 },
  carte: { backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  titre: { fontSize: 28, fontWeight: 'bold', color: '#7f1d1d', textAlign: 'center' },
  sousTitre: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  erreur: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 6, marginBottom: 12 },
  champ: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  bouton: { backgroundColor: '#b91c1c', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
