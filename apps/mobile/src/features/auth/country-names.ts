import type { Language } from '../../shared/i18n/translations';

type Names = Record<Exclude<Language, 'uz'>, string>;

/** Localized country names keyed by ISO 3166-1 alpha-2. Uzbek lives in `CountryItem.name`. */
export const COUNTRY_NAMES: Record<string, Names> = {
  // Home / CIS
  UZ: { ru: 'Узбекистан', en: 'Uzbekistan', tr: 'Özbekistan', kk: 'Өзбекстан', ko: '우즈베키스탄', es: 'Uzbekistán', de: 'Usbekistan', fr: 'Ouzbékistan' },
  RU: { ru: 'Россия', en: 'Russia', tr: 'Rusya', kk: 'Ресей', ko: '러시아', es: 'Rusia', de: 'Russland', fr: 'Russie' },
  KZ: { ru: 'Казахстан', en: 'Kazakhstan', tr: 'Kazakistan', kk: 'Қазақстан', ko: '카자흐스탄', es: 'Kazajistán', de: 'Kasachstan', fr: 'Kazakhstan' },
  KG: { ru: 'Киргизия', en: 'Kyrgyzstan', tr: 'Kırgızistan', kk: 'Қырғызстан', ko: '키르기스스탄', es: 'Kirguistán', de: 'Kirgisistan', fr: 'Kirghizistan' },
  TJ: { ru: 'Таджикистан', en: 'Tajikistan', tr: 'Tacikistan', kk: 'Тәжікстан', ko: '타지키스탄', es: 'Tayikistán', de: 'Tadschikistan', fr: 'Tadjikistan' },
  TM: { ru: 'Туркменистан', en: 'Turkmenistan', tr: 'Türkmenistan', kk: 'Түрікменстан', ko: '투르크메니스탄', es: 'Turkmenistán', de: 'Turkmenistan', fr: 'Turkménistan' },
  AZ: { ru: 'Азербайджан', en: 'Azerbaijan', tr: 'Azerbaycan', kk: 'Әзірбайжан', ko: '아제르바이잔', es: 'Azerbaiyán', de: 'Aserbaidschan', fr: 'Azerbaïdjan' },
  AM: { ru: 'Армения', en: 'Armenia', tr: 'Ermenistan', kk: 'Армения', ko: '아르메니아', es: 'Armenia', de: 'Armenien', fr: 'Arménie' },
  GE: { ru: 'Грузия', en: 'Georgia', tr: 'Gürcistan', kk: 'Грузия', ko: '조지아', es: 'Georgia', de: 'Georgien', fr: 'Géorgie' },
  BY: { ru: 'Беларусь', en: 'Belarus', tr: 'Belarus', kk: 'Беларусь', ko: '벨라루스', es: 'Bielorrusia', de: 'Belarus', fr: 'Biélorussie' },
  UA: { ru: 'Украина', en: 'Ukraine', tr: 'Ukrayna', kk: 'Украина', ko: '우크라이나', es: 'Ucrania', de: 'Ukraine', fr: 'Ukraine' },
  MD: { ru: 'Молдова', en: 'Moldova', tr: 'Moldova', kk: 'Молдова', ko: '몰도바', es: 'Moldavia', de: 'Moldau', fr: 'Moldavie' },

  // Nearby / popular destinations
  TR: { ru: 'Турция', en: 'Türkiye', tr: 'Türkiye', kk: 'Түркия', ko: '튀르키예', es: 'Turquía', de: 'Türkei', fr: 'Turquie' },
  AE: { ru: 'ОАЭ', en: 'United Arab Emirates', tr: 'Birleşik Arap Emirlikleri', kk: 'Біріккен Араб Әмірліктері', ko: '아랍에미리트', es: 'Emiratos Árabes Unidos', de: 'Vereinigte Arabische Emirate', fr: 'Émirats arabes unis' },
  SA: { ru: 'Саудовская Аравия', en: 'Saudi Arabia', tr: 'Suudi Arabistan', kk: 'Сауд Арабиясы', ko: '사우디아라비아', es: 'Arabia Saudí', de: 'Saudi-Arabien', fr: 'Arabie saoudite' },
  QA: { ru: 'Катар', en: 'Qatar', tr: 'Katar', kk: 'Катар', ko: '카타르', es: 'Catar', de: 'Katar', fr: 'Qatar' },
  KW: { ru: 'Кувейт', en: 'Kuwait', tr: 'Kuveyt', kk: 'Кувейт', ko: '쿠웨이트', es: 'Kuwait', de: 'Kuwait', fr: 'Koweït' },
  BH: { ru: 'Бахрейн', en: 'Bahrain', tr: 'Bahreyn', kk: 'Бахрейн', ko: '바레인', es: 'Baréin', de: 'Bahrain', fr: 'Bahreïn' },
  OM: { ru: 'Оман', en: 'Oman', tr: 'Umman', kk: 'Оман', ko: '오만', es: 'Omán', de: 'Oman', fr: 'Oman' },
  IL: { ru: 'Израиль', en: 'Israel', tr: 'İsrail', kk: 'Израиль', ko: '이스라엘', es: 'Israel', de: 'Israel', fr: 'Israël' },
  IR: { ru: 'Иран', en: 'Iran', tr: 'İran', kk: 'Иран', ko: '이란', es: 'Irán', de: 'Iran', fr: 'Iran' },
  AF: { ru: 'Афганистан', en: 'Afghanistan', tr: 'Afganistan', kk: 'Ауғанстан', ko: '아프가니스탄', es: 'Afganistán', de: 'Afghanistan', fr: 'Afghanistan' },
  PK: { ru: 'Пакистан', en: 'Pakistan', tr: 'Pakistan', kk: 'Пәкістан', ko: '파키스탄', es: 'Pakistán', de: 'Pakistan', fr: 'Pakistan' },
  IN: { ru: 'Индия', en: 'India', tr: 'Hindistan', kk: 'Үндістан', ko: '인도', es: 'India', de: 'Indien', fr: 'Inde' },
  BD: { ru: 'Бангладеш', en: 'Bangladesh', tr: 'Bangladeş', kk: 'Бангладеш', ko: '방글라데시', es: 'Bangladés', de: 'Bangladesch', fr: 'Bangladesh' },
  LK: { ru: 'Шри-Ланка', en: 'Sri Lanka', tr: 'Sri Lanka', kk: 'Шри-Ланка', ko: '스리랑카', es: 'Sri Lanka', de: 'Sri Lanka', fr: 'Sri Lanka' },
  NP: { ru: 'Непал', en: 'Nepal', tr: 'Nepal', kk: 'Непал', ko: '네팔', es: 'Nepal', de: 'Nepal', fr: 'Népal' },

  // East / SE Asia
  KR: { ru: 'Южная Корея', en: 'South Korea', tr: 'Güney Kore', kk: 'Оңтүстік Корея', ko: '대한민국', es: 'Corea del Sur', de: 'Südkorea', fr: 'Corée du Sud' },
  JP: { ru: 'Япония', en: 'Japan', tr: 'Japonya', kk: 'Жапония', ko: '일본', es: 'Japón', de: 'Japan', fr: 'Japon' },
  CN: { ru: 'Китай', en: 'China', tr: 'Çin', kk: 'Қытай', ko: '중국', es: 'China', de: 'China', fr: 'Chine' },
  HK: { ru: 'Гонконг', en: 'Hong Kong', tr: 'Hong Kong', kk: 'Гонконг', ko: '홍콩', es: 'Hong Kong', de: 'Hongkong', fr: 'Hong Kong' },
  MO: { ru: 'Макао', en: 'Macao', tr: 'Makao', kk: 'Макао', ko: '마카오', es: 'Macao', de: 'Macau', fr: 'Macao' },
  TW: { ru: 'Тайвань', en: 'Taiwan', tr: 'Tayvan', kk: 'Тайвань', ko: '대만', es: 'Taiwán', de: 'Taiwan', fr: 'Taïwan' },
  SG: { ru: 'Сингапур', en: 'Singapore', tr: 'Singapur', kk: 'Сингапур', ko: '싱가포르', es: 'Singapur', de: 'Singapur', fr: 'Singapour' },
  MY: { ru: 'Малайзия', en: 'Malaysia', tr: 'Malezya', kk: 'Малайзия', ko: '말레이시아', es: 'Malasia', de: 'Malaysia', fr: 'Malaisie' },
  TH: { ru: 'Таиланд', en: 'Thailand', tr: 'Tayland', kk: 'Тайланд', ko: '태국', es: 'Tailandia', de: 'Thailand', fr: 'Thaïlande' },
  VN: { ru: 'Вьетнам', en: 'Vietnam', tr: 'Vietnam', kk: 'Вьетнам', ko: '베트남', es: 'Vietnam', de: 'Vietnam', fr: 'Viêt Nam' },
  ID: { ru: 'Индонезия', en: 'Indonesia', tr: 'Endonezya', kk: 'Индонезия', ko: '인도네시아', es: 'Indonesia', de: 'Indonesien', fr: 'Indonésie' },
  PH: { ru: 'Филиппины', en: 'Philippines', tr: 'Filipinler', kk: 'Филиппин', ko: '필리핀', es: 'Filipinas', de: 'Philippinen', fr: 'Philippines' },
  KH: { ru: 'Камбоджа', en: 'Cambodia', tr: 'Kamboçya', kk: 'Камбоджа', ko: '캄보디아', es: 'Camboya', de: 'Kambodscha', fr: 'Cambodge' },
  MM: { ru: 'Мьянма', en: 'Myanmar', tr: 'Myanmar', kk: 'Мьянма', ko: '미얀마', es: 'Myanmar', de: 'Myanmar', fr: 'Myanmar' },

  // Europe
  GB: { ru: 'Великобритания', en: 'United Kingdom', tr: 'Birleşik Krallık', kk: 'Ұлыбритания', ko: '영국', es: 'Reino Unido', de: 'Vereinigtes Königreich', fr: 'Royaume-Uni' },
  DE: { ru: 'Германия', en: 'Germany', tr: 'Almanya', kk: 'Германия', ko: '독일', es: 'Alemania', de: 'Deutschland', fr: 'Allemagne' },
  FR: { ru: 'Франция', en: 'France', tr: 'Fransa', kk: 'Франция', ko: '프랑스', es: 'Francia', de: 'Frankreich', fr: 'France' },
  IT: { ru: 'Италия', en: 'Italy', tr: 'İtalya', kk: 'Италия', ko: '이탈리아', es: 'Italia', de: 'Italien', fr: 'Italie' },
  ES: { ru: 'Испания', en: 'Spain', tr: 'İspanya', kk: 'Испания', ko: '스페인', es: 'España', de: 'Spanien', fr: 'Espagne' },
  PT: { ru: 'Португалия', en: 'Portugal', tr: 'Portekiz', kk: 'Португалия', ko: '포르투갈', es: 'Portugal', de: 'Portugal', fr: 'Portugal' },
  NL: { ru: 'Нидерланды', en: 'Netherlands', tr: 'Hollanda', kk: 'Нидерланд', ko: '네덜란드', es: 'Países Bajos', de: 'Niederlande', fr: 'Pays-Bas' },
  BE: { ru: 'Бельгия', en: 'Belgium', tr: 'Belçika', kk: 'Бельгия', ko: '벨기에', es: 'Bélgica', de: 'Belgien', fr: 'Belgique' },
  CH: { ru: 'Швейцария', en: 'Switzerland', tr: 'İsviçre', kk: 'Швейцария', ko: '스위스', es: 'Suiza', de: 'Schweiz', fr: 'Suisse' },
  AT: { ru: 'Австрия', en: 'Austria', tr: 'Avusturya', kk: 'Австрия', ko: '오스트리아', es: 'Austria', de: 'Österreich', fr: 'Autriche' },
  PL: { ru: 'Польша', en: 'Poland', tr: 'Polonya', kk: 'Польша', ko: '폴란드', es: 'Polonia', de: 'Polen', fr: 'Pologne' },
  CZ: { ru: 'Чехия', en: 'Czechia', tr: 'Çekya', kk: 'Чехия', ko: '체코', es: 'Chequia', de: 'Tschechien', fr: 'Tchéquie' },
  SK: { ru: 'Словакия', en: 'Slovakia', tr: 'Slovakya', kk: 'Словакия', ko: '슬로바키아', es: 'Eslovaquia', de: 'Slowakei', fr: 'Slovaquie' },
  HU: { ru: 'Венгрия', en: 'Hungary', tr: 'Macaristan', kk: 'Венгрия', ko: '헝가리', es: 'Hungría', de: 'Ungarn', fr: 'Hongrie' },
  RO: { ru: 'Румыния', en: 'Romania', tr: 'Romanya', kk: 'Румыния', ko: '루마니아', es: 'Rumanía', de: 'Rumänien', fr: 'Roumanie' },
  BG: { ru: 'Болгария', en: 'Bulgaria', tr: 'Bulgaristan', kk: 'Болгария', ko: '불가리아', es: 'Bulgaria', de: 'Bulgarien', fr: 'Bulgarie' },
  GR: { ru: 'Греция', en: 'Greece', tr: 'Yunanistan', kk: 'Грекия', ko: '그리스', es: 'Grecia', de: 'Griechenland', fr: 'Grèce' },
  HR: { ru: 'Хорватия', en: 'Croatia', tr: 'Hırvatistan', kk: 'Хорватия', ko: '크로아티아', es: 'Croacia', de: 'Kroatien', fr: 'Croatie' },
  RS: { ru: 'Сербия', en: 'Serbia', tr: 'Sırbistan', kk: 'Сербия', ko: '세르비아', es: 'Serbia', de: 'Serbien', fr: 'Serbie' },
  SE: { ru: 'Швеция', en: 'Sweden', tr: 'İsveç', kk: 'Швеция', ko: '스웨덴', es: 'Suecia', de: 'Schweden', fr: 'Suède' },
  NO: { ru: 'Норвегия', en: 'Norway', tr: 'Norveç', kk: 'Норвегия', ko: '노르웨이', es: 'Noruega', de: 'Norwegen', fr: 'Norvège' },
  DK: { ru: 'Дания', en: 'Denmark', tr: 'Danimarka', kk: 'Дания', ko: '덴마크', es: 'Dinamarca', de: 'Dänemark', fr: 'Danemark' },
  FI: { ru: 'Финляндия', en: 'Finland', tr: 'Finlandiya', kk: 'Финляндия', ko: '핀란드', es: 'Finlandia', de: 'Finnland', fr: 'Finlande' },
  IE: { ru: 'Ирландия', en: 'Ireland', tr: 'İrlanda', kk: 'Ирландия', ko: '아일랜드', es: 'Irlanda', de: 'Irland', fr: 'Irlande' },
  LT: { ru: 'Литва', en: 'Lithuania', tr: 'Litvanya', kk: 'Литва', ko: '리투아니아', es: 'Lituania', de: 'Litauen', fr: 'Lituanie' },
  LV: { ru: 'Латвия', en: 'Latvia', tr: 'Letonya', kk: 'Латвия', ko: '라트비아', es: 'Letonia', de: 'Lettland', fr: 'Lettonie' },
  EE: { ru: 'Эстония', en: 'Estonia', tr: 'Estonya', kk: 'Эстония', ko: '에스토니아', es: 'Estonia', de: 'Estland', fr: 'Estonie' },

  // Americas
  US: { ru: 'США', en: 'United States', tr: 'ABD', kk: 'АҚШ', ko: '미국', es: 'Estados Unidos', de: 'Vereinigte Staaten', fr: 'États-Unis' },
  CA: { ru: 'Канада', en: 'Canada', tr: 'Kanada', kk: 'Канада', ko: '캐나다', es: 'Canadá', de: 'Kanada', fr: 'Canada' },
  MX: { ru: 'Мексика', en: 'Mexico', tr: 'Meksika', kk: 'Мексика', ko: '멕시코', es: 'México', de: 'Mexiko', fr: 'Mexique' },
  BR: { ru: 'Бразилия', en: 'Brazil', tr: 'Brezilya', kk: 'Бразилия', ko: '브라질', es: 'Brasil', de: 'Brasilien', fr: 'Brésil' },
  AR: { ru: 'Аргентина', en: 'Argentina', tr: 'Arjantin', kk: 'Аргентина', ko: '아르헨티나', es: 'Argentina', de: 'Argentinien', fr: 'Argentine' },
  CL: { ru: 'Чили', en: 'Chile', tr: 'Şili', kk: 'Чили', ko: '칠레', es: 'Chile', de: 'Chile', fr: 'Chili' },
  CO: { ru: 'Колумбия', en: 'Colombia', tr: 'Kolombiya', kk: 'Колумбия', ko: '콜롬비아', es: 'Colombia', de: 'Kolumbien', fr: 'Colombie' },
  PE: { ru: 'Перу', en: 'Peru', tr: 'Peru', kk: 'Перу', ko: '페루', es: 'Perú', de: 'Peru', fr: 'Pérou' },

  // Africa / Oceania
  EG: { ru: 'Египет', en: 'Egypt', tr: 'Mısır', kk: 'Мысыр', ko: '이집트', es: 'Egipto', de: 'Ägypten', fr: 'Égypte' },
  MA: { ru: 'Марокко', en: 'Morocco', tr: 'Fas', kk: 'Марокко', ko: '모로코', es: 'Marruecos', de: 'Marokko', fr: 'Maroc' },
  NG: { ru: 'Нигерия', en: 'Nigeria', tr: 'Nijerya', kk: 'Нигерия', ko: '나이지리아', es: 'Nigeria', de: 'Nigeria', fr: 'Nigeria' },
  ZA: { ru: 'ЮАР', en: 'South Africa', tr: 'Güney Afrika', kk: 'Оңтүстік Африка', ko: '남아프리카 공화국', es: 'Sudáfrica', de: 'Südafrika', fr: 'Afrique du Sud' },
  KE: { ru: 'Кения', en: 'Kenya', tr: 'Kenya', kk: 'Кения', ko: '케냐', es: 'Kenia', de: 'Kenia', fr: 'Kenya' },
  AU: { ru: 'Австралия', en: 'Australia', tr: 'Avustralya', kk: 'Аустралия', ko: '오스트레일리아', es: 'Australia', de: 'Australien', fr: 'Australie' },
  NZ: { ru: 'Новая Зеландия', en: 'New Zealand', tr: 'Yeni Zelanda', kk: 'Жаңа Зеландия', ko: '뉴질랜드', es: 'Nueva Zelanda', de: 'Neuseeland', fr: 'Nouvelle-Zélande' },
};

export function countryName(item: { iso: string; name: string }, lang: Language): string {
  if (lang === 'uz') return item.name;
  return COUNTRY_NAMES[item.iso]?.[lang] ?? COUNTRY_NAMES[item.iso]?.en ?? item.name;
}
