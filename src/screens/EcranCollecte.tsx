import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { requete } from '../api/apiClient';
import { ajouterOperationHorsLigne } from '../storage/offlineStore';

type Reponses = Record<string, string | boolean>;

const FORMULAIRE_INITIAL: Reponses = {
  nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '', groupe_sanguin_declare: '',
  pression_arterielle: '', poids_kg: '', taille_cm: '', taux_hemoglobine: '',
  sous_traitement_medical: false, medicaments_recents: false, medicaments_details: '',
  rapports_a_risque: false, drogue_injectable: false, tatouage_piercing: false, tatouage_piercing_date: '',
  vaccination_recente: false, vaccin_type: '', vaccin_date: '',
  antecedent_depuis_dernier_don: false, antecedent_hospitalisation: false, antecedent_transfusion: false,
  antecedent_chirurgie: false, antecedent_reaction_don: false, antecedent_voyage: false, antecedent_details: '',
  decision_aptitude: 'APTE', motif_inaptitude: '', duree_inaptitude_jours: '', date_fin_ajournement: '',
  type_poche: 'SIMPLE', volume_ml: '',
};

const QUESTIONS = [
  ['sous_traitement_medical', 'Le donneur suit-il actuellement un traitement médical ?'],
  ['medicaments_recents', 'A-t-il pris des médicaments récemment ?'],
  ['rapports_a_risque', 'A-t-il eu des rapports sexuels à risque ?'],
  ['drogue_injectable', 'A-t-il déjà consommé des drogues par injection ?'],
  ['tatouage_piercing', 'A-t-il eu un tatouage ou un piercing récemment ?'],
  ['vaccination_recente', 'A-t-il été vacciné récemment ?'],
] as const;

function Section({ titre, numero }: { titre: string; numero: string }) {
  return <View style={styles.enteteSection}><Text style={styles.numeroSection}>{numero}</Text><Text style={styles.titreSection}>{titre}</Text></View>;
}

export default function EcranCollecte({ estConnecte }: { estConnecte: boolean }) {
  const [formulaire, setFormulaire] = useState<Reponses>({ ...FORMULAIRE_INITIAL });
  const [envoi, setEnvoi] = useState(false);
  const majChamp = (champ: string, valeur: string | boolean) => setFormulaire((f) => ({ ...f, [champ]: valeur }));
  const texte = (champ: string) => String(formulaire[champ] ?? '');
  const oui = (champ: string) => formulaire[champ] === true;
  const duree = Number(formulaire.duree_inaptitude_jours || 0);

  const majDuree = (valeur: string) => {
    majChamp('duree_inaptitude_jours', valeur);
    const dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + (Number(valeur) || 0));
    const isoLocal = `${dateFin.getFullYear()}-${String(dateFin.getMonth() + 1).padStart(2, '0')}-${String(dateFin.getDate()).padStart(2, '0')}`;
    majChamp('date_fin_ajournement', Number(valeur) > 0 ? isoLocal : '');
  };

  const collecter = async () => {
    if (!texte('nom').trim() || !texte('prenom').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(texte('date_naissance'))) {
      Alert.alert('Informations à compléter', 'Le nom, le prénom et une date de naissance au format AAAA-MM-JJ sont obligatoires.');
      return;
    }
    if (oui('medicaments_recents') && !texte('medicaments_details').trim()) {
      Alert.alert('Questionnaire incomplet', 'Précisez les médicaments pris récemment.'); return;
    }
    if (oui('tatouage_piercing') && !texte('tatouage_piercing_date')) {
      Alert.alert('Questionnaire incomplet', 'Précisez la date du tatouage ou du piercing.'); return;
    }
    if (oui('vaccination_recente') && (!texte('vaccin_type').trim() || !texte('vaccin_date'))) {
      Alert.alert('Questionnaire incomplet', 'Précisez le vaccin et sa date.'); return;
    }
    if (texte('decision_aptitude') !== 'APTE' && !texte('motif_inaptitude').trim()) {
      Alert.alert('Décision incomplète', 'Indiquez le motif de l’inaptitude.'); return;
    }
    if (texte('decision_aptitude') === 'INAPTE_TEMPORAIRE' && (!duree || !texte('date_fin_ajournement'))) {
      Alert.alert('Décision incomplète', 'Indiquez une durée d’ajournement valide.'); return;
    }

    const nombreOuVide = (cle: string) => texte(cle) === '' ? undefined : Number(texte(cle).replace(',', '.'));
    const donnees = {
      nom: texte('nom').trim(), prenom: texte('prenom').trim(), date_naissance: texte('date_naissance'),
      sexe: texte('sexe'), telephone: texte('telephone').trim() || undefined,
      groupe_sanguin_declare: texte('groupe_sanguin_declare') || undefined,
      type_consultation: 'EXTERNE_MOBILE', pression_arterielle: texte('pression_arterielle').trim() || undefined,
      poids_kg: nombreOuVide('poids_kg'), taille_cm: nombreOuVide('taille_cm'), taux_hemoglobine: nombreOuVide('taux_hemoglobine'),
      sous_traitement_medical: oui('sous_traitement_medical'), medicaments_recents: oui('medicaments_recents'),
      medicaments_details: texte('medicaments_details').trim() || undefined, rapports_a_risque: oui('rapports_a_risque'),
      drogue_injectable: oui('drogue_injectable'), tatouage_piercing: oui('tatouage_piercing'),
      tatouage_piercing_date: texte('tatouage_piercing_date') || undefined,
      vaccination_recente: oui('vaccination_recente'), vaccin_type: texte('vaccin_type').trim() || undefined,
      vaccin_date: texte('vaccin_date') || undefined,
      antecedent_depuis_dernier_don: oui('antecedent_depuis_dernier_don'),
      antecedent_hospitalisation: oui('antecedent_hospitalisation'), antecedent_transfusion: oui('antecedent_transfusion'),
      antecedent_chirurgie: oui('antecedent_chirurgie'), antecedent_reaction_don: oui('antecedent_reaction_don'),
      antecedent_voyage: oui('antecedent_voyage'), antecedent_details: texte('antecedent_details').trim() || undefined,
      decision_aptitude: texte('decision_aptitude'), motif_inaptitude: texte('motif_inaptitude').trim() || undefined,
      duree_inaptitude_jours: nombreOuVide('duree_inaptitude_jours'),
      date_fin_ajournement: texte('date_fin_ajournement') || undefined,
      type_poche: texte('type_poche'), volume_ml: nombreOuVide('volume_ml'),
    };

    setEnvoi(true);
    try {
      if (estConnecte) {
        const reponse = await requete('post', '/collecte-mobile', donnees);
        const resultat = reponse.data;
        const compte = resultat?.donneur?.code_donneur
          ? `\nCode donneur : ${resultat.donneur.code_donneur}${resultat.mot_de_passe_initial ? `\nMot de passe initial : ${resultat.mot_de_passe_initial}` : ''}` : '';
        Alert.alert('Collecte enregistrée', `${reponse.message || 'La collecte a été enregistrée.'}${compte}`);
      } else {
        await ajouterOperationHorsLigne({ method: 'post', url: '/collecte-mobile', data: donnees });
        Alert.alert('Collecte enregistrée hors ligne', 'La consultation sera synchronisée dès le retour de la connexion.');
      }
      setFormulaire({ ...FORMULAIRE_INITIAL });
    } catch (erreur: any) {
      if (!erreur?.response) {
        await ajouterOperationHorsLigne({ method: 'post', url: '/collecte-mobile', data: donnees });
        Alert.alert('Collecte enregistrée hors ligne', 'Le serveur est momentanément inaccessible. La consultation sera synchronisée au retour du réseau.');
        setFormulaire({ ...FORMULAIRE_INITIAL });
      } else {
        const message = erreur.response.data?.message || 'La collecte n’a pas pu être enregistrée.';
        const erreursValidation = Object.values(erreur.response.data?.errors || {}).flat().join('\n');
        Alert.alert('Vérifiez la collecte', erreursValidation || message);
      }
    } finally { setEnvoi(false); }
  };

  const champ = (libelle: string, cle: string, options: { clavier?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad'; placeholder?: string; onChange?: (valeur: string) => void } = {}) => (
    <View style={styles.champBloc} key={cle}>
      <Text style={styles.libelle}>{libelle}</Text>
      <TextInput style={styles.champ} value={texte(cle)} onChangeText={(v) => options.onChange ? options.onChange(v) : majChamp(cle, v)} keyboardType={options.clavier || 'default'} placeholder={options.placeholder} placeholderTextColor="#94a3b8" />
    </View>
  );

  const choix = (libelle: string, cle: string, options: string[]) => (
    <View style={styles.champBloc} key={cle}>
      <Text style={styles.libelle}>{libelle}</Text>
      <View style={styles.choixLigne}>{options.map((option) => (
        <TouchableOpacity key={option} onPress={() => majChamp(cle, option === '—' ? '' : option)} style={[styles.choix, texte(cle) === (option === '—' ? '' : option) && styles.choixActif]}>
          <Text style={[styles.choixTexte, texte(cle) === option && styles.choixTexteActif]}>{option}</Text>
        </TouchableOpacity>
      ))}</View>
    </View>
  );

  const question = (cle: string, libelle: string) => (
    <View style={styles.question} key={cle}>
      <Text style={styles.questionTexte}>{libelle}</Text>
      <View style={styles.choixLigne}>{[true, false].map((valeur) => (
        <TouchableOpacity key={String(valeur)} onPress={() => majChamp(cle, valeur)} style={[styles.choix, formulaire[cle] === valeur && (valeur ? styles.ouiActif : styles.nonActif)]}>
          <Text style={[styles.choixTexte, formulaire[cle] === valeur && styles.choixTexteActif]}>{valeur ? 'Oui' : 'Non'}</Text>
        </TouchableOpacity>
      ))}</View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>COLLECTE TERRAIN · CNTS TOGO</Text>
        <Text style={styles.titre}>Nouvelle collecte</Text>
        <Text style={styles.sousTitre}>{estConnecte ? 'Les réponses du questionnaire sont enregistrées avec la consultation.' : 'Mode hors ligne : les réponses seront synchronisées au retour du réseau.'}</Text>

        <Section numero="01" titre="Informations du donneur" />
        <View style={styles.ligne}>{champ('Nom *', 'nom')}{champ('Prénom *', 'prenom')}</View>
        {champ('Date de naissance * · AAAA-MM-JJ', 'date_naissance', { placeholder: '1990-01-31' })}
        {choix('Sexe', 'sexe', ['M', 'F'])}
        {champ('Téléphone', 'telephone', { clavier: 'phone-pad', placeholder: '+228 90 00 00 00' })}
        {choix('Groupe sanguin déclaré', 'groupe_sanguin_declare', ['—', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])}

        <Section numero="02" titre="Examen clinique" />
        <View style={styles.ligne}>{champ('Poids (kg)', 'poids_kg', { clavier: 'decimal-pad' })}{champ('Taille (cm)', 'taille_cm', { clavier: 'decimal-pad' })}</View>
        <View style={styles.ligne}>{champ('Tension artérielle', 'pression_arterielle', { placeholder: '120/80' })}{champ('Hémoglobine (g/dL)', 'taux_hemoglobine', { clavier: 'decimal-pad' })}</View>

        <Section numero="03" titre="Questionnaire de dépistage" />
        <Text style={styles.aide}>Répondez à chaque question. Les précisions s’affichent selon la réponse.</Text>
        {QUESTIONS.map(([cle, libelle]) => question(cle, libelle))}
        {oui('medicaments_recents') && champ('Médicaments pris récemment *', 'medicaments_details')}
        {oui('tatouage_piercing') && champ('Date du tatouage ou piercing * · AAAA-MM-JJ', 'tatouage_piercing_date', { placeholder: '2026-09-01' })}
        {oui('vaccination_recente') && <View style={styles.ligne}>{champ('Type de vaccin *', 'vaccin_type')}{champ('Date du vaccin * · AAAA-MM-JJ', 'vaccin_date', { placeholder: '2026-09-01' })}</View>}

        <Section numero="04" titre="Antécédents depuis le dernier don" />
        {question('antecedent_depuis_dernier_don', 'Un événement de santé est-il survenu depuis le dernier don ?')}
        {oui('antecedent_depuis_dernier_don') && <>
          {question('antecedent_hospitalisation', 'Hospitalisation')}
          {question('antecedent_transfusion', 'Transfusion')}
          {question('antecedent_chirurgie', 'Chirurgie')}
          {question('antecedent_reaction_don', 'Réaction lors d’un don')}
          {question('antecedent_voyage', 'Voyage en zone à risque')}
          {champ('Autres détails ou précisions', 'antecedent_details')}
        </>}

        <Section numero="05" titre="Décision d’aptitude" />
        {choix('Décision', 'decision_aptitude', ['APTE', 'INAPTE_TEMPORAIRE', 'INAPTE_DEFINITIF'])}
        {texte('decision_aptitude') !== 'APTE' && champ('Motif d’inaptitude *', 'motif_inaptitude')}
        {texte('decision_aptitude') === 'INAPTE_TEMPORAIRE' && <>
          {champ('Durée de l’ajournement (jours) *', 'duree_inaptitude_jours', { clavier: 'numeric', placeholder: 'Ex. 30', onChange: majDuree })}
          <Text style={styles.dateCalculee}>Fin d’ajournement estimée : {texte('date_fin_ajournement') || 'à calculer'}</Text>
        </>}

        {texte('decision_aptitude') === 'APTE' && <>
          <Section numero="06" titre="Prélèvement" />
          {choix('Type de poche', 'type_poche', ['SIMPLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE'])}
          {champ('Volume prélevé (ml)', 'volume_ml', { clavier: 'numeric', placeholder: '450' })}
        </>}

        <TouchableOpacity style={[styles.bouton, envoi && styles.boutonDesactive]} onPress={collecter} disabled={envoi}>
          <Text style={styles.boutonTexte}>{envoi ? 'Enregistrement…' : estConnecte ? 'Enregistrer la consultation' : 'Enregistrer hors ligne'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, conteneur: { flex: 1, backgroundColor: '#e3e8f3' }, contenu: { padding: 16, paddingBottom: 42 },
  kicker: { color: '#ba002b', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }, titre: { fontSize: 25, fontWeight: '800', color: '#141c26', marginTop: 5 },
  sousTitre: { color: '#5d3f3f', fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 10 },
  enteteSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e6bdbc' },
  numeroSection: { color: '#ba002b', fontWeight: '900', fontSize: 12 }, titreSection: { color: '#141c26', fontSize: 16, fontWeight: '800', flex: 1 },
  aide: { color: '#5d3f3f', fontSize: 12, marginBottom: 6 }, ligne: { flexDirection: 'row', gap: 10 }, champBloc: { flex: 1, minWidth: 0, marginBottom: 7 },
  libelle: { fontSize: 12, color: '#374151', marginBottom: 5, marginTop: 5, fontWeight: '700' },
  champ: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff', color: '#141c26' },
  question: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: 'rgba(255,255,255,0.72)', padding: 10, borderRadius: 10, marginVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  questionTexte: { flex: 1, color: '#263244', fontSize: 12, lineHeight: 17, fontWeight: '600' }, choixLigne: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choix: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8, marginBottom: 5 },
  choixActif: { backgroundColor: '#ba002b', borderColor: '#ba002b' }, ouiActif: { backgroundColor: '#ba002b', borderColor: '#ba002b' }, nonActif: { backgroundColor: '#425e91', borderColor: '#425e91' },
  choixTexte: { color: '#334155', fontSize: 11, fontWeight: '700' }, choixTexteActif: { color: '#fff' },
  dateCalculee: { color: '#425e91', fontSize: 12, fontWeight: '700', marginTop: 2 },
  bouton: { backgroundColor: '#ba002b', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 23 }, boutonDesactive: { opacity: 0.55 }, boutonTexte: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
