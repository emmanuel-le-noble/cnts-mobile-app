# CNTS Togo -- Application Mobile (Expo SDK 49)

Application Android de collecte mobile de sang (tablettes/terrain). React Native + TypeScript, **offline-first** : les saisies hors-ligne sont stockees dans AsyncStorage puis synchronisees au retour du reseau.

---

## Table des matieres

1. [Pre-requis](#1-pre-requis)
2. [Installation](#2-installation)
3. [Architecture](#3-architecture)
4. [Mode offline-first](#4-mode-offline-first)
5. [Ecrans](#5-ecrans)
6. [Dependances cles](#6-dependances-cles)
7. [Verification](#7-verification)
8. [Scripts](#8-scripts)
9. [Pieges connus](#9-pieges-connus)

---

## 1. Pre-requis

- Node.js 18.x ou 20.x
- Expo CLI (`npx expo`)
- Expo Go (application Android pour tester)
- Backend Laravel demarre sur le port 8000

---

## 2. Installation

```bash
cd cnts-mobile-app
npm install
npx expo start
# Scanner le QR code avec Expo Go
```

### Configuration

Dans l'app : menu **Parametres** -> saisir l'URL du serveur API (ex. `http://192.168.1.100:8000/api/v1`).

**Attention** : l'app se connecte a l'IP LAN du serveur, pas a localhost. Configurer dans l'app (Parametres).

---

## 3. Architecture

### 3.1. Structure

```
cnts-mobile-app/src/
+-- api/
|   +-- apiClient.ts             # Client axios (URL + token en AsyncStorage)
+-- storage/
|   +-- offlineStore.ts          # File d'operations hors-ligne
|   +-- netinfo.ts               # Etat reseau
+-- contexts/
|   +-- AuthContext.tsx           # Session mobile
+-- screens/
|   +-- EcranConnexion.tsx       # Login personnel
|   +-- EcranAccueil.tsx         # Stats + actions rapides
|   +-- EcranCollecte.tsx        # Formulaire combine (donneur + consultation + prelevement)
|   +-- EcranEspaceDonneurMobile.tsx  # 3 onglets : Dons / Resultats / Carte
|   +-- EcranParametres.tsx      # Configuration URL API
|   +-- EcranSelectionCentre.tsx # Choix du centre
|   +-- EcranConnexionDonneur.tsx # Login espace donneur
|   +-- EcranConfigurationApi.tsx # Configuration URL serveur
+-- theme/
|   +-- liquidGlass.tsx          # Theme verre (FondLiquide, stylesVerre, COULEURS)
+-- navigation/                  # React Navigation v6 (PAS v7)
+-- components/                  # Composants UI
+-- types/                       # Types TypeScript
+-- utils/                       # Utilitaires
+-- data/                        # Donnees
App.tsx                          # Point d'entree + logique synchro
```

### 3.2. Point d'entree

`App.tsx` :
1. Initialise le contexte d'authentification
2. Verifie le token stocke
3. Charge l'ecran approprie (Connexion ou Accueil)
4. Active la synchro automatique au retour du reseau

### 3.3. Conventions

- TypeScript (`.tsx`) obligatoire
- React Navigation **v6 uniquement** (v7 incompatible avec SDK 49)
- `FlatList` au lieu de `ScrollView` pour les listes
- UI et messages en francais

---

## 4. Mode offline-first

### 4.1. Fonctionnement

1. **Saisie hors-ligne** : `EcranCollecte` enregistre les operations dans la file (AsyncStorage) avec le statut `EN_ATTENTE`
2. **Detection reseau** : `netinfo.ts` surveille l'etat de connexion via NetInfo
3. **Synchro automatique** : au retour du reseau, `App.tsx` synchronise sequentiellement les operations en attente via `POST /collecte-mobile`
4. **Idempotence** : chaque operation a un `client_ref` unique (UUID prefixe `collecte-`) pour eviter les doublons

### 4.2. File hors-ligne

```typescript
// src/storage/offlineStore.ts
interface OperationEnAttente {
    id: string;
    client_ref: string;
    type: 'donneur' | 'consultation' | 'prelevement';
    donnees: any;
    statut: 'EN_ATTENTE' | 'ENVOYE' | 'ERREUR';
    dateCreation: string;
}
```

### 4.3. Endpoint de synchro

```
POST /api/v1/collecte-mobile
Body: { client_ref, type, donnees }
Reponse: 201 (cree) ou 200 (deja present, idempotent)
```

### 4.4. Client de reference

```typescript
// UUID sans tirets prefixe "collecte-" (max 64 chars)
genererClientRef() = `collecte-${uuid}`
```

Le backend verifie la presence du `client_ref` : si deja present, il retourne 200 au lieu de 201 (idempotence).

---

## 5. Ecrans

### EcranConnexion (`EcranConnexion.tsx`)
- **Formulaire** : email + mot de passe
- **Stockage** : token JWT dans AsyncStorage
- **Persistance** : verification du token au demarrage

### EcranAccueil (`EcranAccueil.tsx`)
- **Stats** : nombre de donneurs, dons du jour, consultations
- **Actions rapides** : "Nouvelle collecte" → EcranCollecte
- **Navigation** : accès rapide aux écrans principaux

### EcranCollecte (`EcranCollecte.tsx`)
Formulaire combine en une seule saisie :

**Section 1 — Donneur**
- Nom, prénom
- Date de naissance
- Sexe (M/F)
- Téléphone (format togolais `+228`)
- Groupe sanguin (si connu)
- Photo (optionnelle)

**Section 2 — Consultation**
- Type de consultation (`INTERNE` ou `EXTERNE_MOBILE`)
- Poids (kg)
- Taille (cm)
- Pression artérielle
- Taux d'hémoglobine (g/dL)
- **Questionnaire de dépistage** (6 questions avec sous-champs conditionnels) :
  - Sous traitement médical ? (détails)
  - Médicaments récemment ? (détails)
  - Rapports sexuels à risque ?
  - Drogue injectable ?
  - Tatouage/piercing ? (date)
  - Vaccination récente ? (type + date)
- **Antécédents depuis le dernier don** :
  - Problèmes de santé ? (hospitalisation, transfusion, chirurgie, réaction don, voyage zone risque, autres)
- **Décision d'aptitude** : APTE / INAPTE_TEMPORAIRE / INAPTE_DEFINITIF

**Section 3 — Prélèvement**
- Type de poche (Simple/Double/Triple/Quadruple)
- Volume (mL)
- Observations

**Mode hors-ligne** :
- Les données sont stockées localement avec un `client_ref` unique
- Au retour du réseau → synchronisation automatique via `POST /collecte-mobile`

### EcranEspaceDonneurMobile (`EcranEspaceDonneurMobile.tsx`)
3 onglets :
- **Dons** : historique des dons, compteur, prochaine date d'éligibilité, badge éligibilité
- **Résultats** : groupe sanguin définitif, sérologie (Positif/Négatif/Indéterminé)
- **Carte** : QR code (data-URI), code donneur, photo, lien de partage

### EcranParametres (`EcranParametres.tsx`)
- **URL API** : configuration de l'adresse du serveur (IP LAN)
- **Deconnexion** : réinitialisation du token

### EcranSelectionCentre (`EcranSelectionCentre.tsx`)
- **Liste** des centres actifs
- **Selection** : centre actif pour la session

### EcranConnexionDonneur (`EcranConnexionDonneur.tsx`)
- **Formulaire** : email + mot de passe
- **Stockage** : token dédié dans AsyncStorage

---

## 6. Dependances cles

| Package | Version | Usage |
| --- | --- | --- |
| expo | SDK 49 | Framework React Native |
| react-native | 0.72.10 | Runtime |
| react | 18.2.0 | UI |
| @react-navigation/native | v6 | Navigation |
| @react-navigation/stack | v6 | Stack navigator |
| @react-native-async-storage/async-storage | 1.18 | Stockage local |
| @react-native-community/netinfo | 9.3 | Etat reseau |
| axios | 1.19 | Client HTTP |
| typescript | 5.1 | Typage |

**Important** : React Navigation **v6 uniquement**. La v7 est incompatible avec Expo SDK 49.

---

## 7. Verification

```bash
# Verifier le typage TypeScript
npx tsc --noEmit

# Verifier la compatibilite SDK
npx expo-doctor
```

---

## 8. Scripts

```bash
npm run start   # Demarrer Expo
npm run android # Lancer sur Android
npm run ios     # Lancer sur iOS
npm run web     # Lancer en web
```

---

## 9. Pieges connus

1. **React Navigation v7** : ne PAS mettre a jour. La v7 exige react-native-screens >= 4, incompatible avec SDK 49 (screens 3.22).

2. **`npx expo install`** : ne pas installer de nouvelles libs sans verifier la compatibilite SDK 49 (`npx expo-doctor`).

3. **URL API** : l'app se connecte a l'IP LAN du serveur, pas a localhost. Configurer dans l'app (Parametres).

4. **Offline-first** : les operations en erreur sont marquees `ERREUR` mais restent dans la file. La re-synchro se fait automatiquement au prochain retour reseau.

5. **`client_ref`** : UUID sans tirets prefixe `collecte-` (max 64 chars). Utilise pour l'idempotence : si le backend recoit un `client_ref` deja present, il retourne 200 au lieu de 201.

6. **Phone format** : le backend attend le format togolais `^(\+228|00228|0)?[2-9]\d{7}$` (espaces et tirets rejetes).

7. **Expo Go** : certaines native modules ne fonctionnent pas dans Expo Go. En cas de probleme, utiliser un build dev (`npx expo run:android`).

8. **TypeScript** : toujours verifier avec `npx tsc --noEmit` avant de commiter.

9. **`npx expo-doctor`** : les docs versionnees Expo v49 sont archivees/supprimees -- se referer a `npx expo-doctor` et au `package.json`.

10. **Styles inline** : les ecrans donneur utilisent des `StyleSheet.inline` hex (`#f8fafc`, bordeaux `#ba002b`/`#e31c3d`) -- PAS `liquidGlass.tsx` (dossier `src/theme` vide au moment de la reecriture).
