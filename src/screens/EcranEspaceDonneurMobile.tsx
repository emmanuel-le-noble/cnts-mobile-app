import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requeteDonneur, setDonneurToken } from '../api/apiClient';

type Onglet = 'dons' | 'resultats' | 'carte';

interface Donneur {
  nom_complet?: string;
  code_donneur?: string;
  groupe_sanguin_definitif?: string | null;
  nb_dons_realises?: number;
}

interface HistoriqueDon {
  id: number;
  code_don?: string;
  date_don?: string;
  type_poche?: string | null;
  volume_ml?: number;
  statut_prelevement?: string;
  statut_qualification?: string;
  groupe_confirme?: string | null;
  rh_confirme?: string | null;
  motif_blocage?: string | null;
}

interface ResultatDon {
  id: number;
  code_don?: string;
  date_don?: string;
  groupe_confirme?: string | null;
  rh_confirme?: string | null;
  serologie?: {
    vih?: string;
    hbs_ag?: string;
    hcv?: string;
    syphilis?: string;
    htlv?: string;
    paludisme?: string;
  } | null;
}

interface CarteDonneur {
  qr_image?: string;
  code_donneur?: string;
  nom_complet?: string;
  date_naissance?: string;
  sexe?: string;
  groupe_sanguin?: string | null;
  nb_dons_realises?: number;
  photo_url?: string | null;
}

interface ResumeDons {
  nb_dons_realises?: number;
  dernier_don?: { code_don?: string; date_don?: string; type_poche?: string | null } | null;
  prochaine_date_eligibilite?: string | null;
  eligible?: boolean;
  historique?: HistoriqueDon[];
}

const LIBELLES_STATUT_PRELEVEMENT: Record<string, { texte: string; couleur: string; fond: string }> = {
  CONFORME: { texte: 'Don conforme', couleur: '#166534', fond: '#dcfce7' },
  INCIDENT: { texte: 'Incident', couleur: '#991b1b', fond: '#fee2e2' },
  INCOMPLET: { texte: 'Don incomplet', couleur: '#92400e', fond: '#fef3c7' },
};

const LIBELLES_STATUT_QUALIFICATION: Record<string, { texte: string; couleur: string; fond: string }> = {
  EN_ATTENTE: { texte: 'En attente de résultats', couleur: '#92400e', fond: '#fef3c7' },
  VALIDEE_LIBEREE: { texte: 'Poche libérée', couleur: '#166534', fond: '#dcfce7' },
  BLANCHE_BLOQUEE: { texte: 'Poche bloquée', couleur: '#991b1b', fond: '#fee2e2' },
  DETRUITE: { texte: 'Poche détruite', couleur: '#4b5563', fond: '#f3f4f6' },
};

const MARQUEURS = [
  { cle: 'vih', libelle: 'VIH' },
  { cle: 'hbs_ag', libelle: 'Hépatite B (Ag HBs)' },
  { cle: 'hcv', libelle: 'Hépatite C' },
  { cle: 'syphilis', libelle: 'Syphilis' },
  { cle: 'htlv', libelle: 'HTLV' },
  { cle: 'paludisme', libelle: 'Paludisme' },
] as const;

function badgeStatut(mapping: Record<string, { texte: string; couleur: string; fond: string }>, statut?: string | null) {
  return mapping[statut ?? ''] ?? { texte: statut ?? 'Inconnu', couleur: '#4b5563', fond: '#f3f4f6' };
}

function formaterDate(valeur?: string): string {
  if (!valeur) return '—';
  const partie = valeur.split(' ')[0];
  const [a, m, j] = partie.split('-');
  return a && m && j ? `${j}/${m}/${a}` : valeur;
}

function libelleMarqueur(valeur?: string): { texte: string; couleur: string } {
  if (!valeur) return { texte: 'Non testé', couleur: '#6b7280' };
  if (valeur.startsWith('P')) return { texte: 'Positif', couleur: '#991b1b' };
  if (valeur.startsWith('N')) return { texte: 'Négatif', couleur: '#166534' };
  if (valeur === 'IND') return { texte: 'Indéterminé', couleur: '#92400e' };
  return { texte: valeur, couleur: '#374151' };
}

export default function EcranEspaceDonneurMobile({ navigation }: { navigation: any }) {
  const [donneur, setDonneur] = useState<Donneur | null>(null);
  const [dons, setDons] = useState<ResumeDons | null>(null);
  const [resultats, setResultats] = useState<{ resultats?: ResultatDon[]; groupe_sanguin_definitif?: string | null } | null>(null);
  const [carte, setCarte] = useState<CarteDonneur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('dons');

  const charger = useCallback(async () => {
    try {
      const [rMe, rDons, rResultats, rCarte] = await Promise.all([
        requeteDonneur('get', '/donneur/me'),
        requeteDonneur('get', '/donneur/dons'),
        requeteDonneur('get', '/donneur/resultats'),
        requeteDonneur('get', '/donneur/carte'),
      ]);
      setDonneur(rMe.data);
      setDons(rDons.data);
      setResultats(rResultats.data);
      setCarte(rCarte.data);
    } catch {
      Alert.alert('Session expirée', 'Reconnectez-vous à votre espace donneur.');
      await setDonneurToken(null);
      navigation.replace('ConnexionDonneur');
    } finally {
      setChargement(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const deconnexion = async () => {
    try {
      await requeteDonneur('post', '/donneur/auth/logout');
    } catch {
      // déconnexion locale quoi qu'il arrive
    }
    await setDonneurToken(null);
    navigation.replace('ConnexionDonneur');
  };

  if (chargement) {
    return (
      <View style={styles.pageCentree}>
        <ActivityIndicator size="large" color="#e31c3d" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.kicker}>ESPACE DONNEUR</Text>
      <Text style={styles.titre}>Bonjour {donneur?.nom_complet || 'Donneur'}</Text>

      <View style={styles.carteProfil}>
        <View style={styles.carteInfos}>
          <Text style={styles.libelle}>Code donneur</Text>
          <Text style={styles.valeur}>{donneur?.code_donneur || '—'}</Text>
          <Text style={styles.libelle}>Groupe sanguin confirmé</Text>
          <Text style={styles.groupe}>{donneur?.groupe_sanguin_definitif || 'En attente de confirmation'}</Text>
        </View>
        <View style={styles.carteDons}>
          <Text style={styles.donsChiffre}>{dons?.nb_dons_realises ?? donneur?.nb_dons_realises ?? 0}</Text>
          <Text style={styles.donsLibelle}>don(s) enregistré(s)</Text>
        </View>
      </View>

      {dons?.prochaine_date_eligibilite ? (
        <View style={styles.eligible}>
          <Text style={styles.eligibleTexte}>
            {dons.eligible
              ? `Vous êtes éligible : prochain don possible dès le ${formaterDate(dons.prochaine_date_eligibilite)}.`
              : `Prochaine éligibilité : ${formaterDate(dons.prochaine_date_eligibilite)}.`}
          </Text>
        </View>
      ) : null}

      <View style={styles.onglets}>
        {([
          ['dons', 'Dons'],
          ['resultats', 'Résultats'],
          ['carte', 'Ma carte'],
        ] as [Onglet, string][]).map(([code, libelle]) => (
          <TouchableOpacity
            key={code}
            style={[styles.onglet, onglet === code && styles.ongletActif]}
            onPress={() => setOnglet(code)}
          >
            <Text style={[styles.ongletTexte, onglet === code && styles.ongletTexteActif]}>{libelle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {onglet === 'dons' && (
        <View style={styles.bloc}>
          <Text style={styles.blocTitre}>Historique de vos dons</Text>
          {!dons?.historique || dons.historique.length === 0 ? (
            <Text style={styles.vide}>Aucun don enregistré pour le moment.</Text>
          ) : (
            dons.historique.map((don) => {
              const sp = badgeStatut(LIBELLES_STATUT_PRELEVEMENT, don.statut_prelevement);
              const sq = badgeStatut(LIBELLES_STATUT_QUALIFICATION, don.statut_qualification);
              return (
                <View key={don.id} style={styles.carteLigne}>
                  <View style={styles.ligneEntete}>
                    <Text style={styles.ligneCode}>{don.code_don || '—'}</Text>
                    <Text style={styles.ligneDate}>{formaterDate(don.date_don)}</Text>
                  </View>
                  <View style={styles.ligneDetail}>
                    <Text style={styles.ligneTexte}>
                      {[don.type_poche, don.volume_ml ? `${don.volume_ml} ml` : null].filter(Boolean).join(' · ') || 'Poche'}
                      {don.groupe_confirme ? ` · groupe ${don.groupe_confirme}${don.rh_confirme ? ` ${don.rh_confirme}` : ''}` : ''}
                    </Text>
                  </View>
                  <View style={styles.ligneBadges}>
                    <View style={[styles.badge, { backgroundColor: sp.fond }]}>
                      <Text style={[styles.badgeTexte, { color: sp.couleur }]}>{sp.texte}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: sq.fond }]}>
                      <Text style={[styles.badgeTexte, { color: sq.couleur }]}>{sq.texte}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {onglet === 'resultats' && (
        <View style={styles.bloc}>
          <Text style={styles.blocTitre}>Résultats de laboratoire</Text>
          <Text style={styles.blocSousTitre}>
            Groupe sanguin définitif : <Text style={{ fontWeight: '800', color: '#ba002b' }}>{resultats?.groupe_sanguin_definitif || 'En attente'}</Text>
          </Text>
          {!resultats?.resultats || resultats.resultats.length === 0 ? (
            <Text style={styles.vide}>Vos résultats apparaîtront ici dès la libération de votre poche.</Text>
          ) : (
            resultats.resultats.map((r) => (
              <View key={r.id} style={styles.carteResultat}>
                <View style={styles.ligneEntete}>
                  <Text style={styles.ligneCode}>{r.code_don || '—'}</Text>
                  <Text style={styles.ligneDate}>{formaterDate(r.date_don)}</Text>
                </View>
                <Text style={styles.ligneTexte}>
                  {r.groupe_confirme ? `Groupe ${r.groupe_confirme}${r.rh_confirme ? ` ${r.rh_confirme}` : ''}` : 'Groupage en attente'}
                </Text>
                {r.serologie && (
                  <View style={styles.marqueurs}>
                    {MARQUEURS.map((m) => {
                      const res = libelleMarqueur(r.serologie?.[m.cle]);
                      return (
                        <View key={m.cle} style={styles.marqueurLigne}>
                          <Text style={styles.marqueurLibelle}>{m.libelle}</Text>
                          <Text style={[styles.marqueurValeur, { color: res.couleur }]}>{res.texte}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {onglet === 'carte' && (
        <View style={styles.blocCarte}>
          <Text style={styles.blocTitre}>Votre carte donneur</Text>
          {carte?.qr_image ? (
            <View style={styles.carteQr}>
              <Image source={{ uri: carte.qr_image }} style={styles.qrImage} resizeMode="contain" />
              <Text style={styles.carteTexte}>Ce QR code est rattaché à votre dossier CNTS.</Text>
              <View style={styles.carteLigneInfo}>
                <Text style={styles.carteLibelle}>Nom</Text>
                <Text style={styles.carteValeur}>{carte.nom_complet || donneur?.nom_complet || '—'}</Text>
              </View>
              <View style={styles.carteLigneInfo}>
                <Text style={styles.carteLibelle}>Code donneur</Text>
                <Text style={styles.carteValeur}>{carte.code_donneur || donneur?.code_donneur || '—'}</Text>
              </View>
              <View style={styles.carteLigneInfo}>
                <Text style={styles.carteLibelle}>Groupe sanguin</Text>
                <Text style={styles.carteValeur}>{carte.groupe_sanguin || '—'}</Text>
              </View>
              <View style={styles.carteLigneInfo}>
                <Text style={styles.carteLibelle}>Dons réalisés</Text>
                <Text style={styles.carteValeur}>{carte.nb_dons_realises ?? donneur?.nb_dons_realises ?? 0}</Text>
              </View>
              {carte.photo_url ? <Image source={{ uri: carte.photo_url }} style={styles.photo} /> : null}
            </View>
          ) : (
            <Text style={styles.vide}>Votre carte donneur n&apos;est pas encore disponible.</Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.bouton} onPress={deconnexion}>
        <Text style={styles.boutonTexte}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  pageCentree: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  contenu: { padding: 22, paddingBottom: 40 },
  kicker: { color: '#ba002b', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  titre: { color: '#141c26', fontSize: 26, fontWeight: '800', marginTop: 6 },
  carteProfil: { flexDirection: 'row', marginTop: 18, gap: 12 },
  carteInfos: { flex: 1, backgroundColor: '#7f1d1d', borderRadius: 16, padding: 20, paddingBottom: 22 },
  libelle: { color: '#fecdd3', fontSize: 12, fontWeight: '700', marginTop: 6 },
  valeur: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 3 },
  groupe: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 3 },
  carteDons: { width: 110, backgroundColor: '#141c26', borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center' },
  donsChiffre: { color: '#fff', fontSize: 34, fontWeight: '900' },
  donsLibelle: { color: '#94a3b8', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4, lineHeight: 15 },
  eligible: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#a7f3d0' },
  eligibleTexte: { color: '#065f46', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  onglets: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 9999, padding: 4, marginTop: 20 },
  onglet: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9999 },
  ongletActif: { backgroundColor: '#ba002b' },
  ongletTexte: { color: '#475569', fontSize: 13, fontWeight: '700' },
  ongletTexteActif: { color: '#ffffff' },
  bloc: { marginTop: 20 },
  blocCarte: { marginTop: 20, alignItems: 'center' },
  blocTitre: { color: '#141c26', fontSize: 16, fontWeight: '800' },
  blocSousTitre: { color: '#334155', fontSize: 13, fontWeight: '600', marginTop: 6 },
  vide: { color: '#64748b', fontSize: 13, lineHeight: 20, marginTop: 14 },
  carteLigne: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  ligneEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ligneCode: { color: '#141c26', fontSize: 13, fontWeight: '800' },
  ligneDate: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  ligneDetail: { marginTop: 6 },
  ligneTexte: { color: '#475569', fontSize: 13, lineHeight: 19 },
  ligneBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  badgeTexte: { fontSize: 11, fontWeight: '800' },
  carteResultat: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  marqueurs: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  marqueurLigne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  marqueurLibelle: { color: '#334155', fontSize: 13, fontWeight: '600' },
  marqueurValeur: { fontSize: 13, fontWeight: '800' },
  carteQr: { backgroundColor: '#ffffff', borderRadius: 18, padding: 24, alignItems: 'center', marginTop: 14, width: '100%', borderWidth: 1, borderColor: '#e2e8f0' },
  qrImage: { width: 200, height: 200, backgroundColor: '#ffffff' },
  carteTexte: { color: '#64748b', fontSize: 12, marginTop: 10, marginBottom: 14 },
  carteLigneInfo: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  carteLibelle: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  carteValeur: { color: '#141c26', fontSize: 13, fontWeight: '800' },
  photo: { width: 72, height: 72, borderRadius: 36, marginTop: 16 },
  bouton: { borderColor: '#ba002b', borderWidth: 1, borderRadius: 9, alignItems: 'center', paddingVertical: 13, marginTop: 28 },
  boutonTexte: { color: '#ba002b', fontWeight: '800' },
});