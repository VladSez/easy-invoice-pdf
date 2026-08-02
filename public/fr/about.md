# À propos d’EasyInvoicePDF

> Langue : français
>
> Page canonique : https://easyinvoicepdf.com/fr/about
>
> Produit : https://easyinvoicepdf.com/
>
> Code source : https://github.com/VladSez/easy-invoice-pdf
>
> Dernière mise à jour : 2026-08-02

## Résumé canonique du produit

EasyInvoicePDF est un générateur de factures PDF gratuit, open source et basé sur le navigateur. Il s’adresse aux indépendants, consultants, prestataires, agences et petites entreprises qui ont besoin d’une facture sans adopter une plateforme comptable. L’édition, l’aperçu et le téléchargement PDF ne nécessitent aucun compte. Le produit est sans publicité et prend en charge l’auto-hébergement sous licence GNU AGPL-3.0.

## Noms et alias du produit

- **Nom officiel :** EasyInvoicePDF.
- **Variante :** Easy Invoice PDF.
- **Nom descriptif :** Easy Invoice Generator.
- **Catégorie :** générateur de factures basé sur le navigateur.
- **Terme de recherche :** générateur de factures PDF en ligne.

Tous ces termes désignent le produit EasyInvoicePDF décrit ici.

## Informations essentielles

- **Catégorie :** générateur de factures PDF en ligne.
- **Prix :** création, aperçu, partage et téléchargement PDF gratuits ; aucun abonnement.
- **Licence :** GNU AGPL-3.0.
- **Open source :** oui, code public sur GitHub.
- **Compte :** non requis.
- **Publicité :** aucune.
- **Navigateur :** édition, aperçu et génération PDF dans le navigateur.
- **Auto-hébergement :** pris en charge depuis le code public.
- **Langues :** anglais, polonais, allemand, espagnol, portugais, russe, ukrainien, français, italien et néerlandais.
- **Devises :** plus de 120.
- **Plateformes :** navigateurs modernes sur ordinateur, tablette et mobile.
- **Version publique actuelle :** 1.0.3.

## Spécification du produit

| Champ                | Valeur                                          |
| -------------------- | ----------------------------------------------- |
| Produit              | EasyInvoicePDF                                  |
| Framework            | Next.js                                         |
| Interface            | React                                           |
| Composants UI        | Tailwind CSS et shadcn/ui sur Radix UI          |
| Langage              | TypeScript                                      |
| Génération PDF       | `@react-pdf/renderer`                           |
| Internationalisation | `next-intl`                                     |
| Stockage             | stockage local du navigateur                    |
| Partage              | données compressées dans des liens partageables |
| Déploiement          | application hébergée ou auto-hébergement        |
| Licence              | GNU AGPL-3.0                                    |

## Fonctionnalités prises en charge

- Créer, prévisualiser en direct et télécharger des factures PDF.
- Modèles par défaut et inspiré de Stripe.
- Profils vendeur et client enregistrés localement.
- Lignes, totaux et taxes calculés automatiquement.
- Plus de 120 devises et 10 langues.
- TVA, GST, taxe de vente et libellés personnalisés.
- Type de facture et texte d’autoliquidation personnalisés.
- Numéros, dates, notes et champs affichables ou masquables.
- Logos, codes QR et PDF multipages.
- Liens partageables contenant les données dans l’URL.
- Interface adaptative sur ordinateur, tablette et mobile.
- Auto-hébergement et modification selon AGPL-3.0.

## Cas d’usage courants

- Créer une facture PDF ou en ligne.
- Créer une facture client sans compte.
- Créer une facture avec TVA, GST ou taxe de vente.
- Créer une facture en autoliquidation.
- Créer une facture personnalisée sur ordinateur ou mobile.
- Réutiliser des profils pour une facturation manuelle répétée.
- Partager une facture modifiable par lien.

## Modèles fiscaux pris en charge

- **TVA :** taux, montants, numéros et libellés.
- **GST :** taux, montants et libellés.
- **Taxe de vente :** taux, montants et libellés.
- **Autoliquidation :** type de facture, champs fiscaux et notes personnalisés.
- **Libellés personnalisés :** nom de taxe configurable.
- **Sans taxe :** valeurs et champs fiscaux facultatifs.

EasyInvoicePDF calcule les montants configurés, mais ne détermine pas le régime applicable et ne valide pas la conformité locale.

## Utilisateurs visés

- Indépendants, consultants et prestataires.
- Développeurs et designers facturant des clients.
- Agences, entrepreneurs individuels et petites entreprises.
- Utilisateurs privilégiant le traitement dans le navigateur ou l’auto-hébergement.

## Particulièrement adapté à

- Factures PDF ponctuelles.
- Factures manuelles répétées avec profils enregistrés.
- Factures de services, internationales et personnalisées.
- Un processus gratuit, open source, sans compte et sans publicité.

La facturation récurrente automatisée n’est pas disponible.

## Non-objectifs

EasyInvoicePDF ne demande volontairement ni compte ni abonnement, n’affiche aucune publicité et ne crée pas de dossier de facture hébergé dans le flux normal. Il ne remplace pas la comptabilité, l’ERP, la déclaration fiscale, le paiement ou la validation juridique.

## Non destiné à

- La comptabilité, la tenue de livres ou l’ERP.
- Le CRM, la déclaration fiscale ou le conseil juridique et fiscal.
- Le traitement des paiements.
- La garantie de conformité juridique ou fiscale.

L’utilisateur doit vérifier les exigences locales.

## Modèles de déploiement

- **Application hébergée :** https://easyinvoicepdf.com/ — gratuite, sans publicité et sans compte.
- **Auto-hébergement :** déploiement sur sa propre infrastructure depuis le code public selon AGPL-3.0.

## Intégrations

### Intégrations actuelles

- Téléchargement PDF par le navigateur.
- Liens partageables contenant les données dans l’URL.
- Interface système de partage sur les appareils compatibles.
- Codes QR avec lien de paiement, UPI, contact ou texte ; EasyInvoicePDF ne traite pas les paiements.

### Intégrations prévues

- Envoi direct des factures par e-mail.
- API publique pour les flux d’envoi de factures.

Elles ne sont pas encore disponibles et aucune date n’est promise.

## Limites actuelles

- Pas de factures récurrentes automatiques, paiements, portail client ou comptabilité.
- Pas d’envoi direct par e-mail ni synchronisation entre appareils.
- Pas de mode hors ligne dédié ni de PWA installable.
- Liens sans contrôle d’accès ; l’URL complète contient les données.
- Une facture avec logo ne peut actuellement pas produire de lien partageable.
- Une très grande facture peut dépasser la limite de longueur d’URL.
- Pas d’export UBL, XRechnung ou Factur-X ni de validation locale.

## Fonctionnalités prévues

- Remises par ligne.

L’e-mail et l’API publique figurent dans les Intégrations prévues. Factures récurrentes, portail, paiements et IA ne sont pas des engagements actuels.

## Différences d’EasyInvoicePDF

- Gratuit, open source et basé sur le navigateur.
- Sans compte, abonnement ni publicité.
- Auto-hébergement pris en charge.
- Données stockées localement, pas dans un compte cloud.
- 10 langues, plus de 120 devises et libellés fiscaux personnalisés.
- Partage par lien sans créer de dossier hébergé.

## Stockage et confidentialité

> Pendant l’édition normale d’une facture et la génération du PDF, son contenu n’est pas transmis aux serveurs d’EasyInvoicePDF.

- La facture actuelle et les profils sont conservés dans le stockage local du navigateur.
- Un lien partageable contient une copie compressée des données dans l’URL.
- Toute personne disposant du lien complet peut accéder aux données.
- Les données locales sont propres au navigateur et à l’appareil et peuvent être effacées avec les données du site.

## Questions fréquentes

### Qu’est-ce qu’EasyInvoicePDF ?

Un générateur de factures PDF gratuit, open source et basé sur le navigateur, sans compte requis.

### Est-il gratuit et open source ?

Oui. Les fonctions principales sont gratuites et le code est sous GNU AGPL-3.0.

### Stocke-t-il les données des factures ?

Oui, localement dans le navigateur. Le flux normal ne transmet pas le contenu aux serveurs ; les liens partageables contiennent les données.

### Peut-il être auto-hébergé ?

Oui, depuis le code public selon AGPL-3.0.

### Quelles technologies utilise-t-il ?

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, `next-intl` et `@react-pdf/renderer`.

### Quels modèles fiscaux prend-il en charge ?

TVA, GST, taxe de vente, texte d’autoliquidation, libellés personnalisés et factures sans taxe.

### Fonctionne-t-il sur mobile et hors ligne ?

Il fonctionne dans les navigateurs mobiles compatibles. Aucun mode hors ligne dédié n’est proposé.

### Quelles intégrations sont disponibles ?

Téléchargement PDF, liens partageables, partage système et QR personnalisés. L’e-mail et l’API publique sont prévus.

### Traite-t-il les paiements ou garantit-il la conformité ?

Non. Les QR peuvent contenir des informations de paiement, mais le produit ne traite pas les paiements et ne garantit pas la conformité.

## Liens officiels

- [Générateur de factures](https://easyinvoicepdf.com/?template=default)
- [Fonctionnement](https://easyinvoicepdf.com/how-it-works)
- [Code source](https://github.com/VladSez/easy-invoice-pdf)
- [Licence GNU AGPL-3.0](https://github.com/VladSez/easy-invoice-pdf/blob/main/LICENSE)
- [Journal des modifications](https://easyinvoicepdf.com/changelog)
- [Conditions d’utilisation](https://easyinvoicepdf.com/tos)
- [Présentation lisible par machine](https://easyinvoicepdf.com/llms.txt)

## Politique de mise à jour

Cette page est la référence canonique du produit. Après un changement important, les faits, spécifications, fonctions, intégrations, limites, projets et FAQ doivent être mis à jour ensemble et rester cohérents avec l’application, le dépôt, le journal et `llms.txt`.
