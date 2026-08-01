# AGENTS.md (cnts-mobile-app)

Application mobile CNTS — **Expo SDK 49 / React Native 0.72.10 / React 18.2 / TypeScript**, UI et messages **en français**.

## Contraintes de versions (vérifiées)

- **React Navigation v6 uniquement** (`@react-navigation/native@6`, `@react-navigation/stack@6`, `@react-navigation/native-stack@6`) : la v7 exige react-native-screens ≥ 4, incompatible avec SDK 49 (screens 3.22). Ne pas mettre à jour.
- `react-native-gesture-handler` requis par le stack navigator (installé en 2.12.0).
- Ne pas `npx expo install` de nouvelles libs sans vérifier la compatibilité SDK 49 (`npx expo-doctor`).
- Les docs versionnées Expo v49 (`https://docs.expo.dev/versions/v49.0.0/`) sont **archivées/supprimées** — se référer à `npx expo-doctor` et au `package.json`.

## Structure

- `src/api/apiClient.ts` — axios, URL API + token persistés (AsyncStorage) ; `src/storage/offlineStore.ts` (file hors-ligne), `netinfo.ts` ; `src/contexts/AuthContext.tsx` ; `src/screens/` (Connexion, Accueil, Collecte, Parametres).
- Mode offline-first : `EcranCollecte` enregistre dans la file si hors-ligne ; `App.tsx` synchronise séquentiellement au retour du réseau (endpoint `/collecte-mobile`).

## Vérification

```bash
npx tsc --noEmit
npx expo-doctor
```
