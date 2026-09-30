import { type LegalDocSet, tgLink } from '../shared';

export const fr: LegalDocSet = {
  privacy: {
    title: 'Politique de confidentialité',
    intro:
      'CaloSnap (« l’application ») vous aide à suivre ce que vous mangez. La présente politique explique quelles données nous collectons, comment nous les utilisons et comment vous pouvez les supprimer.',
    sections: [
      {
        h: 'Données que nous collectons',
        p: [
          'Compte : nom, numéro de téléphone et mot de passe (conservé uniquement sous forme de hachage salé).',
          'Profil : âge, sexe, taille, poids, niveau d’activité, objectif et apport calorique quotidien cible.',
          'Journal : aliments et portions que vous enregistrez, ainsi que vos saisies d’eau et de poids.',
          'Photos : photos de repas et d’étiquettes nutritionnelles que vous soumettez pour analyse, ainsi qu’une photo de profil facultative.',
          'Problèmes de santé (facultatif) : affections que vous sélectionnez dans votre profil (par ex. diabète, hypertension). Elles servent uniquement à personnaliser les alertes et suggestions alimentaires.',
          'Nutritionniste IA et Chef IA : vos messages, listes d’ingrédients ou photos de réfrigérateur sont envoyés à notre serveur pour générer une réponse et n’y sont pas conservés. L’historique des conversations est conservé uniquement sur votre appareil et est effacé lorsque vous vous déconnectez.',
          'Statut d’abonnement : les achats sont traités par l’App Store / Google Play ; nous ne voyons ni ne conservons jamais les données de votre carte bancaire.',
        ],
      },
      {
        h: 'Utilisation des données',
        p: [
          'Pour calculer les calories et les macronutriments, tenir votre journal et définir des objectifs personnels.',
          'Les photos sont envoyées à Google Gemini afin de reconnaître les aliments.',
          'Pour le Nutritionniste IA, le Chef IA et les alertes santé, vos messages, ingrédients, le contenu de vos repas et les données de profil nécessaires à la personnalisation de la réponse (objectif, apport quotidien cible, problèmes de santé) sont envoyés à Google Gemini. Votre nom et votre numéro de téléphone ne sont pas transmis.',
          'Nous n’affichons aucune publicité, ne vendons jamais vos données et ne vous suivons pas dans d’autres applications.',
        ],
      },
      {
        h: 'Services tiers',
        p: [
          'Google Gemini (analyse des photos et assistants IA), Cloudinary (stockage des images), RevenueCat (statut d’abonnement), Railway (serveur et base de données), Open Food Facts (recherche par code-barres ; seul le code-barres est transmis).',
          'Les produits emballés que vous ajoutez (nom et valeurs nutritionnelles) deviennent visibles par les autres utilisateurs ; ils ne contiennent aucune donnée personnelle.',
        ],
      },
      {
        h: 'Conservation et suppression',
        p: [
          'Les données sont conservées tant que votre compte est actif.',
          'Profil → « Supprimer le compte » supprime immédiatement et définitivement votre compte ainsi que toutes les données associées (profil, journal, historiques, photos).',
        ],
      },
      { h: 'Enfants', p: ['L’application ne s’adresse pas aux enfants de moins de 13 ans.'] },
      { h: 'Contact', p: [`${tgLink('Écrivez-nous sur Telegram')}.`] },
    ],
  },
  terms: {
    title: 'Conditions d’utilisation',
    intro: 'En utilisant CaloSnap, vous acceptez les présentes conditions.',
    sections: [
      {
        h: 'Pas un avis médical',
        p: [
          'L’application est fournie à titre informatif uniquement et ne remplace pas l’avis d’un médecin ou d’un diététicien.',
          'Les calories et valeurs nutritionnelles estimées par l’IA sont approximatives et peuvent être erronées.',
          'Le Nutritionniste IA, le Chef IA et les alertes santé fournissent uniquement des conseils généraux : ils ne posent aucun diagnostic et ne prescrivent ni médicaments ni doses d’insuline. Si vous êtes diabétique ou atteint d’une autre affection, suivez les instructions de votre médecin.',
        ],
      },
      {
        h: 'Abonnement CaloSnap Pro',
        p: [
          'Les abonnements sont hebdomadaires, mensuels ou annuels ; le prix est affiché avant l’achat et débité sur votre compte App Store ou Google Play.',
          'L’abonnement se renouvelle automatiquement, sauf résiliation au moins 24 heures avant la fin de la période en cours.',
          'Vous pouvez le gérer ou le résilier dans les réglages de votre compte App Store ou Google Play. La suppression de votre compte CaloSnap n’entraîne pas la résiliation de l’abonnement.',
          'Toute partie non utilisée d’un essai gratuit est perdue lors de la souscription d’un abonnement.',
        ],
      },
      {
        h: 'Contenu des utilisateurs',
        p: ['Les données produit que vous ajoutez doivent être exactes. Nous pouvons supprimer les entrées incorrectes ou abusives.'],
      },
      {
        h: 'Responsabilité',
        p: ['L’application est fournie « en l’état ». Dans les limites permises par la loi, nous ne sommes pas responsables des dommages indirects.'],
      },
      { h: 'Contact', p: [`${tgLink('Écrivez-nous sur Telegram')}.`] },
    ],
  },
  'delete-account': {
    title: 'Supprimer votre compte',
    intro: 'Vous pouvez supprimer à tout moment votre compte CaloSnap et toutes les données associées.',
    sections: [
      {
        h: 'Dans l’application (recommandé)',
        p: ['Ouvrez CaloSnap → Profil → « Supprimer le compte » → saisissez votre mot de passe et confirmez. La suppression est immédiate.'],
      },
      {
        h: 'Si vous ne pouvez pas accéder à l’application',
        p: [`${tgLink('Écrivez-nous sur Telegram')} en indiquant le numéro de téléphone utilisé lors de votre inscription. Les demandes sont traitées sous 7 jours.`],
      },
      {
        h: 'Données supprimées',
        p: [
          'Votre compte, votre profil, votre journal, votre historique d’eau et de poids, vos photos scannées et votre photo de profil sont définitivement supprimés.',
          'Les produits emballés que vous avez ajoutés (sans données personnelles) restent dans le catalogue partagé.',
          'Les abonnements doivent être résiliés séparément dans l’App Store / Google Play.',
        ],
      },
    ],
  },
};
