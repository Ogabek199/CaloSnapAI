import { type LegalDocSet, tgLink } from '../shared';

export const de: LegalDocSet = {
  privacy: {
    title: 'Datenschutzerklärung',
    intro:
      'CaloSnap („die App“) hilft dir dabei, deine Ernährung zu protokollieren. Diese Erklärung beschreibt, welche Daten wir erheben, wie wir sie verwenden und wie du sie löschen kannst.',
    sections: [
      {
        h: 'Welche Daten wir erheben',
        p: [
          'Konto: Name, Telefonnummer und Passwort (ausschließlich als gesalzener Hash gespeichert).',
          'Profil: Alter, Geschlecht, Größe, Gewicht, Aktivitätslevel, Ziel und tägliches Kalorienziel.',
          'Tagebuch: von dir eingetragene Lebensmittel und Portionen sowie Wasser- und Gewichtseinträge.',
          'Fotos: Fotos von Mahlzeiten und Nährwertetiketten, die du zur Analyse einreichst, sowie ein optionales Profilbild.',
          'Gesundheitszustände (optional): Erkrankungen, die du in deinem Profil auswählst (z. B. Diabetes, Bluthochdruck). Sie werden ausschließlich dazu verwendet, Lebensmittelhinweise und Vorschläge auf dich abzustimmen.',
          'KI-Ernährungsberater und KI-Koch: Deine Nachrichten, Zutatenlisten oder Kühlschrankfotos werden an unseren Server gesendet, um eine Antwort zu erzeugen, und dort nicht gespeichert. Der Chatverlauf wird nur auf deinem Gerät gespeichert und beim Abmelden gelöscht.',
          'Abostatus: Käufe werden über den App Store / Google Play abgewickelt; wir sehen oder speichern niemals Kartendaten.',
        ],
      },
      {
        h: 'Wie wir Daten verwenden',
        p: [
          'Um Kalorien und Makronährstoffe zu berechnen, dein Tagebuch zu führen und persönliche Ziele festzulegen.',
          'Fotos werden zur Erkennung von Lebensmitteln an Google Gemini gesendet.',
          'Für den KI-Ernährungsberater, den KI-Koch und die Gesundheitshinweise werden deine Nachrichten, Zutaten, Mahlzeiteninhalte und die zur Personalisierung der Antwort erforderlichen Profildaten (Ziel, Tagesziel, Gesundheitszustände) an Google Gemini gesendet. Dein Name und deine Telefonnummer werden nicht übermittelt.',
          'Wir zeigen keine Werbung, verkaufen deine Daten niemals und verfolgen dich nicht über andere Apps hinweg.',
        ],
      },
      {
        h: 'Dienste von Drittanbietern',
        p: [
          'Google Gemini (Fotoanalyse und KI-Assistenten), Cloudinary (Bildspeicherung), RevenueCat (Abostatus), Railway (Server und Datenbank), Open Food Facts (Barcode-Abfrage; es wird nur der Barcode übermittelt).',
          'Von dir hinzugefügte verpackte Produkte (Name und Nährwertangaben) werden für andere Nutzer sichtbar; sie enthalten keine personenbezogenen Daten.',
        ],
      },
      {
        h: 'Speicherdauer und Löschung',
        p: [
          'Daten werden gespeichert, solange dein Konto aktiv ist.',
          'Profil → „Konto löschen“ löscht dein Konto und alle zugehörigen Daten (Profil, Tagebuch, Einträge, Fotos) sofort und endgültig.',
        ],
      },
      { h: 'Kinder', p: ['Die App richtet sich nicht an Kinder unter 13 Jahren.'] },
      { h: 'Kontakt', p: [`${tgLink('Schreib uns auf Telegram')}.`] },
    ],
  },
  terms: {
    title: 'Nutzungsbedingungen',
    intro: 'Mit der Nutzung von CaloSnap erklärst du dich mit diesen Bedingungen einverstanden.',
    sections: [
      {
        h: 'Keine medizinische Beratung',
        p: [
          'Die App dient ausschließlich Informationszwecken und ersetzt nicht die Beratung durch einen Arzt oder eine Ernährungsfachkraft.',
          'Von der KI geschätzte Kalorien- und Nährwerte sind Näherungswerte und können fehlerhaft sein.',
          'Der KI-Ernährungsberater, der KI-Koch und die Gesundheitshinweise bieten nur allgemeine Orientierung: Sie stellen keine Diagnosen und verordnen keine Medikamente oder Insulindosen. Wenn du Diabetes oder eine andere Erkrankung hast, befolge die Anweisungen deines Arztes.',
        ],
      },
      {
        h: 'CaloSnap Pro-Abonnement',
        p: [
          'Abonnements sind wöchentlich, monatlich oder jährlich erhältlich; der Preis wird vor dem Kauf angezeigt und deinem App Store- oder Google Play-Konto belastet.',
          'Ein Abonnement verlängert sich automatisch, sofern es nicht mindestens 24 Stunden vor Ende des aktuellen Zeitraums gekündigt wird.',
          'Du kannst es in den Einstellungen deines App Store- oder Google Play-Kontos verwalten oder kündigen. Das Löschen deines CaloSnap-Kontos kündigt das Abonnement nicht.',
          'Ein nicht genutzter Teil einer kostenlosen Testphase verfällt, wenn du ein Abonnement abschließt.',
        ],
      },
      {
        h: 'Nutzerinhalte',
        p: ['Von dir hinzugefügte Produktdaten müssen korrekt sein. Wir können fehlerhafte oder missbräuchliche Einträge entfernen.'],
      },
      {
        h: 'Haftung',
        p: ['Die App wird „wie besehen“ bereitgestellt. Soweit gesetzlich zulässig, haften wir nicht für mittelbare Schäden.'],
      },
      { h: 'Kontakt', p: [`${tgLink('Schreib uns auf Telegram')}.`] },
    ],
  },
  'delete-account': {
    title: 'Konto löschen',
    intro: 'Du kannst dein CaloSnap-Konto und alle zugehörigen Daten jederzeit löschen.',
    sections: [
      {
        h: 'In der App (empfohlen)',
        p: ['Öffne CaloSnap → Profil → „Konto löschen“ → gib dein Passwort ein und bestätige. Die Löschung erfolgt sofort.'],
      },
      {
        h: 'Wenn du keinen Zugriff auf die App hast',
        p: [`${tgLink('Schreib uns auf Telegram')} und gib die Telefonnummer an, mit der du dich registriert hast. Anfragen werden innerhalb von 7 Tagen bearbeitet.`],
      },
      {
        h: 'Was gelöscht wird',
        p: [
          'Dein Konto, dein Profil, dein Tagebuch, dein Wasser- und Gewichtsverlauf, gescannte Fotos und dein Profilbild werden endgültig gelöscht.',
          'Von dir hinzugefügte verpackte Produkte (ohne personenbezogene Daten) verbleiben im gemeinsamen Katalog.',
          'Abonnements müssen separat im App Store / bei Google Play gekündigt werden.',
        ],
      },
    ],
  },
};
