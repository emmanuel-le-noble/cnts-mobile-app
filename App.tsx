import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Animated, Image, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CentreActifProvider } from './src/contexts/CentreActifContext';
import { suivreConnexion } from './src/storage/netinfo';
import { lireQueue, retirerOperation } from './src/storage/offlineStore';
import { requete } from './src/api/apiClient';
import EcranConnexion from './src/screens/EcranConnexion';
import EcranAccueil from './src/screens/EcranAccueil';
import EcranCollecte from './src/screens/EcranCollecte';
import EcranParametres from './src/screens/EcranParametres';
import EcranSelectionCentre from './src/screens/EcranSelectionCentre';
import EcranCentres from './src/screens/EcranCentres';
import EcranConnexionDonneur from './src/screens/EcranConnexionDonneur';
import EcranEspaceDonneurMobile from './src/screens/EcranEspaceDonneurMobile';
import EcranConfigurationApi from './src/screens/EcranConfigurationApi';
import EcranAlertesUrgentes from './src/screens/EcranAlertesUrgentes';
import EcranDemandesSang from './src/screens/EcranDemandesSang';

const Pile = createNativeStackNavigator();

function Navigateur() {
  const { utilisateur, chargement: authChargement } = useAuth();
  const [estConnecte, setEstConnecte] = useState(true);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return suivreConnexion(setEstConnecte);
  }, []);

  useEffect(() => {
    if (estConnecte) {
      synchroniser();
    }
  }, [estConnecte]);

  useEffect(() => {
    if (!authChargement) return;
    rotation.setValue(0);
    const animation = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 1400, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [authChargement, rotation]);

  const synchroniser = async () => {
    const queue = await lireQueue();
    for (const operation of queue) {
      try {
        await requete(operation.method, operation.url, operation.data);
        await retirerOperation(operation.id);
      } catch {
        return;
      }
    }
    if (queue.length > 0) {
      Alert.alert('Synchronisation', 'Les saisies hors-ligne ont été synchronisées.');
    }
  };

  if (authChargement) {
    const rotationLogo = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return <View style={styles.chargement}>
      <View style={styles.logoCadre}>
        <Animated.View style={[styles.anneauChargement, { transform: [{ rotate: rotationLogo }] }]} />
        <View style={styles.logoInterieur}><Image source={require('./assets/logo-cnts.png')} style={styles.logo} resizeMode="contain" /></View>
      </View>
      <Text style={styles.chargementTexte}>Préparation de votre espace CNTS…</Text>
    </View>;
  }

  return (
    <NavigationContainer>
      {!utilisateur ? (
        <Pile.Navigator initialRouteName="Connexion">
          <Pile.Screen name="Connexion" component={EcranConnexion} options={{ headerShown: false }} />
          <Pile.Screen name="ConnexionDonneur" component={EcranConnexionDonneur} options={{ headerShown: false }} />
          <Pile.Screen name="EspaceDonneurMobile" component={EcranEspaceDonneurMobile} options={{ title: 'Mon espace donneur', headerShown: false }} />
          <Pile.Screen name="ConfigurationApi" component={EcranConfigurationApi} options={{ title: 'Configuration API' }} />
        </Pile.Navigator>
      ) : (
        <Pile.Navigator>
          <Pile.Screen
            name="Accueil"
            options={{ title: 'CNTS Togo' }}
          >
            {(props) => <EcranAccueil {...props} estConnecte={estConnecte} />}
          </Pile.Screen>
          <Pile.Screen name="Collecte" options={{ title: 'Collecte mobile' }}>
            {(props) => <EcranCollecte {...props} estConnecte={estConnecte} />}
          </Pile.Screen>
          <Pile.Screen name="Parametres" options={{ title: 'Configuration' }} component={EcranParametres} />
          <Pile.Screen name="SelectionCentre" options={{ title: 'Choisir un centre' }} component={EcranSelectionCentre} />
          <Pile.Screen name="Centres" options={{ title: 'Centres de transfusion' }} component={EcranCentres} />
          <Pile.Screen name="AlertesUrgentes" options={{ title: 'Alertes urgentes' }} component={EcranAlertesUrgentes} />
          <Pile.Screen name="DemandesSang" options={{ title: 'Demandes de sang' }} component={EcranDemandesSang} />
        </Pile.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  chargement: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e3e8f3' },
  logoCadre: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center' },
  anneauChargement: { position: 'absolute', width: 82, height: 82, borderRadius: 20, borderWidth: 4, borderColor: '#f2c6ce', borderTopColor: '#ba002b' },
  logoInterieur: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' },
  logo: { width: 66, height: 66 },
  chargementTexte: { color: '#5d3f3f', fontSize: 13, fontWeight: '600', marginTop: 14 },
});

export default function App() {
  return (
    <AuthProvider>
      <CentreActifProvider>
        <Navigateur />
      </CentreActifProvider>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
