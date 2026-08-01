# CNTS Togo — Application Mobile (Expo SDK 49)

Application Android de collecte mobile de sang (tablettes/terrain), TypeScript, **offline-first** : les saisies hors-ligne sont stockées dans `AsyncStorage` puis synchronisées séquentiellement au retour du réseau (NetInfo).

## Installation

```bash
npm install
npx expo start        # scanner le QR code avec l'app Expo Go
```

## Configuration

Dans l'app : menu **Configuration**, saisir l'URL du serveur API (ex. `http://192.168.1.100:8000/api/v1`).

## Structure

- `src/api/apiClient.ts` — client axios (URL API + token persistés dans AsyncStorage)
- `src/storage/offlineStore.ts` — file d'attente des opérations hors-ligne
- `src/storage/netinfo.ts` — suivi de connexion
- `src/contexts/AuthContext.tsx` — session mobile
- `src/screens/` — EcranConnexion, EcranAccueil (stats + actions), EcranCollecte (donneur + consultation + prélèvement en une seule saisie, endpoint `/collecte-mobile`), EcranParametres

## Notes

- React Navigation **v6 uniquement** (v7 incompatible avec SDK 49 / react-native-screens 3.x).
- Vérification : `npx tsc --noEmit`.
