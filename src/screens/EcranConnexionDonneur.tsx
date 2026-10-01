import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { requete, setDonneurToken } from '../api/apiClient';

export default function EcranConnexionDonneur({ navigation }: { navigation: any }) {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const connexion = async () => {
    setErreur(null);
    if (!identifiant.trim() || !motDePasse) {
      setErreur('Saisissez votre code donneur, téléphone ou e-mail, ainsi que votre mot de passe.');
      return;
    }
    setChargement(true);
    try {
      const reponse = await requete('post', '/donneur/auth/login', { identifiant: identifiant.trim(), mot_de_passe: motDePasse });
      await setDonneurToken(reponse.data.token);
      navigation.replace('EspaceDonneurMobile');
    } catch (e: any) {
      setErreur(e?.response?.data?.message || 'Connexion impossible. Vérifiez vos identifiants et l’adresse du serveur.');
    } finally { setChargement(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.retour} onPress={() => navigation.navigate('Connexion')}><Text style={styles.retourTexte}>‹  Retour à la connexion personnel</Text></TouchableOpacity>
        <View style={styles.entete}><Text style={styles.marque}>CNTS TOGO</Text><Text style={styles.accroche}>Espace donneur personnel</Text></View>
        <View style={styles.carte}>
          <Text style={styles.titre}>Connexion donneur</Text>
          <Text style={styles.sousTitre}>Vos dons, votre carte et vos résultats en toute confidentialité.</Text>
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}
          <Text style={styles.libelle}>Code donneur, téléphone ou e-mail</Text>
          <TextInput style={styles.champ} placeholder="01-2026-000001" value={identifiant} onChangeText={setIdentifiant} autoCapitalize="none" />
          <Text style={styles.libelle}>Mot de passe</Text>
          <TextInput style={styles.champ} placeholder="••••••••" value={motDePasse} onChangeText={setMotDePasse} secureTextEntry />
          <TouchableOpacity style={styles.bouton} onPress={connexion} disabled={chargement}>{chargement ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonTexte}>Accéder à mon espace</Text>}</TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ConfigurationApi')} style={styles.lien}><Text style={styles.lienTexte}>Configurer l’adresse du serveur</Text></TouchableOpacity>
          <View style={styles.separateur} />
          <TouchableOpacity onPress={() => navigation.navigate('Connexion')}><Text style={styles.personnel}>Vous êtes personnel CNTS ? Connexion personnel →</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#141c26' }, contenu: { flexGrow: 1, justifyContent: 'center', padding: 24 }, retour: { alignSelf: 'flex-start', marginBottom: 30 }, retourTexte: { color: '#dbeafe', fontWeight: '800' },
  entete: { alignItems: 'center', marginBottom: 18 }, marque: { color: '#ffb3b2', fontSize: 13, fontWeight: '800', letterSpacing: 3 }, accroche: { color: '#cbd5e1', fontSize: 14, marginTop: 6 },
  carte: { backgroundColor: '#fff', borderRadius: 18, padding: 25 }, titre: { color: '#7f1d1d', fontSize: 25, fontWeight: '800', textAlign: 'center' }, sousTitre: { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 6, marginBottom: 22 },
  erreur: { backgroundColor: '#fff1f2', color: '#b91c1c', padding: 11, borderRadius: 8, fontSize: 13, marginBottom: 14 }, libelle: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 6 }, champ: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 14, fontSize: 15 },
  bouton: { backgroundColor: '#ba002b', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 }, boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' }, lien: { alignSelf: 'center', paddingVertical: 14 }, lienTexte: { color: '#9f1239', fontSize: 13, fontWeight: '700' }, separateur: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 14 }, personnel: { color: '#425e91', textAlign: 'center', fontSize: 13, fontWeight: '800' },
});
