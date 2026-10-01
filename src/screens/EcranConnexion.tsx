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
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function EcranConnexion({ navigation }: { navigation: any }) {
  const { connexion, chargement } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const seConnecter = async () => {
    setErreur(null);
    if (!email.trim() || !motDePasse) {
      setErreur('Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
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
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <View style={styles.marque}>
          <Text style={styles.marqueSigle}>CNTS TOGO</Text>
          <Text style={styles.accroche}>Collecte mobile de sang</Text>
        </View>
        <View style={styles.carte}>
        <Text style={styles.titre}>Connexion personnel</Text>
        <Text style={styles.sousTitre}>Accédez à votre espace de collecte sécurisé.</Text>

        {erreur && <Text style={styles.erreur}>{erreur}</Text>}

        <Text style={styles.libelle}>Adresse e-mail</Text>
        <TextInput
          style={styles.champ}
          placeholder="Adresse email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.libelle}>Mot de passe</Text>
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
        <TouchableOpacity onPress={() => navigation.navigate('ConfigurationApi')} style={styles.lienSecondaire}>
          <Text style={styles.lienSecondaireTexte}>Configurer l’adresse du serveur</Text>
        </TouchableOpacity>
        <View style={styles.separateur} />
        <TouchableOpacity onPress={() => navigation.navigate('ConnexionDonneur')}>
          <Text style={styles.lienDonneur}>Vous êtes donneur ? Accéder à mon espace donneur →</Text>
        </TouchableOpacity>
        </View>
        <Text style={styles.note}>Réservé au personnel habilité du CNTS Togo.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#7f1d1d' },
  contenu: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  marque: { alignItems: 'center', marginBottom: 28 },
  marqueSigle: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  accroche: { color: '#fecdd3', fontSize: 14, marginTop: 6 },
  carte: { backgroundColor: '#fff', borderRadius: 18, padding: 26, shadowColor: '#2a0509', shadowOpacity: 0.28, shadowRadius: 20, elevation: 8 },
  titre: { fontSize: 25, fontWeight: '800', color: '#7f1d1d', textAlign: 'center' },
  sousTitre: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 5, marginBottom: 24 },
  erreur: { backgroundColor: '#fff1f2', color: '#b91c1c', padding: 11, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  libelle: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  champ: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 16,
  },
  bouton: { backgroundColor: '#ba002b', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '600' },
  lienSecondaire: { alignSelf: 'center', paddingVertical: 14 }, lienSecondaireTexte: { color: '#9f1239', fontSize: 13, fontWeight: '700' },
  separateur: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 14 }, lienDonneur: { color: '#00693e', textAlign: 'center', fontSize: 13, fontWeight: '800' },
  note: { color: '#fecdd3', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
