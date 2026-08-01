import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { suivreConnexion } from './src/storage/netinfo';
import { lireQueue, retirerOperation } from './src/storage/offlineStore';
import { requete } from './src/api/apiClient';
import EcranConnexion from './src/screens/EcranConnexion';
import EcranAccueil from './src/screens/EcranAccueil';
import EcranCollecte from './src/screens/EcranCollecte';
import EcranParametres from './src/screens/EcranParametres';

const Pile = createNativeStackNavigator();

function Navigateur() {
  const { utilisateur } = useAuth();
  const [estConnecte, setEstConnecte] = useState(true);

  useEffect(() => {
    return suivreConnexion(setEstConnecte);
  }, []);

  useEffect(() => {
    if (estConnecte) {
      synchroniser();
    }
  }, [estConnecte]);

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

  return (
    <NavigationContainer>
      {!utilisateur ? (
        <Pile.Navigator>
          <Pile.Screen name="Connexion" component={EcranConnexion} options={{ headerShown: false }} />
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
        </Pile.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigateur />
      <StatusBar style="light" />
    </AuthProvider>
  );
}
