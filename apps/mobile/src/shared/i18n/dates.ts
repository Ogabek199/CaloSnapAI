// Hermes' Intl support for uz/ru/kk is incomplete, so date names are spelled out here instead of toLocaleDateString.
import type { Language } from './translations';

type Lang = Language;

const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  uz: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  kk: ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'],
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
};

const WEEKDAYS_LONG: Record<Lang, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  tr: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  kk: ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'],
  ko: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
};

const MONTHS: Record<Lang, string[]> = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  kk: ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'],
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
};

/** Russian needs the genitive form after a day number ("28 сентября"). */
const MONTHS_RU_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const TODAY_SHORT: Record<Lang, string> = {
  uz: 'Bugun', ru: 'Сег', en: 'Today', tr: 'Bugün', kk: 'Бүгін', ko: '오늘', es: 'Hoy', de: 'Heute', fr: 'Auj.',
};
const TODAY: Record<Lang, string> = {
  uz: 'Bugun', ru: 'Сегодня', en: 'Today', tr: 'Bugün', kk: 'Бүгін', ko: '오늘', es: 'Hoy', de: 'Heute', fr: 'Aujourd’hui',
};

export const toLang = (localeOrLang?: string): Lang => {
  const l = (localeOrLang || 'uz').slice(0, 2).toLowerCase();
  return l in MONTHS ? (l as Lang) : 'uz';
};

export const weekdayShort = (d: Date, lang: string) => WEEKDAYS_SHORT[toLang(lang)][d.getDay()];

export const monthYear = (d: Date, lang: string) => {
  const l = toLang(lang);
  if (l === 'ko') return `${d.getFullYear()}년 ${MONTHS.ko[d.getMonth()]}`;
  return `${MONTHS[l][d.getMonth()]} ${d.getFullYear()}`;
};

export const todayLabel = (lang: string, short = false) => (short ? TODAY_SHORT : TODAY)[toLang(lang)];

/** "Dushanba, 28-sentabr" / "Понедельник, 28 сентября" / "Monday, September 28" / "9월 28일 월요일". */
export const longDate = (d: Date, lang: string) => {
  const l = toLang(lang);
  const weekday = WEEKDAYS_LONG[l][d.getDay()];
  const day = d.getDate();
  const m = d.getMonth();
  switch (l) {
    case 'ru':
      return `${weekday}, ${day} ${MONTHS_RU_GENITIVE[m]}`;
    case 'en':
      return `${weekday}, ${MONTHS.en[m]} ${day}`;
    case 'ko':
      return `${MONTHS.ko[m]} ${day}일 ${weekday}`;
    case 'es':
      return `${weekday}, ${day} de ${MONTHS.es[m].toLowerCase()}`;
    case 'de':
      return `${weekday}, ${day}. ${MONTHS.de[m]}`;
    case 'fr':
      return `${weekday} ${day} ${MONTHS.fr[m].toLowerCase()}`;
    case 'tr':
    case 'kk':
      return `${weekday}, ${day} ${l === 'kk' ? MONTHS.kk[m].toLowerCase() : MONTHS.tr[m]}`;
    default:
      return `${weekday}, ${day}-${MONTHS.uz[m].toLowerCase()}`;
  }
};
