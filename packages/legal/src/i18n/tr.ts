import { type LegalDocSet, tgLink } from '../shared';

export const tr: LegalDocSet = {
  privacy: {
    title: 'Gizlilik Politikası',
    intro:
      'CaloSnap (“uygulama”), yediklerinizi takip etmenize yardımcı olur. Bu politika, hangi verileri topladığımızı, bunları nasıl kullandığımızı ve nasıl silebileceğinizi açıklar.',
    sections: [
      {
        h: 'Topladığımız veriler',
        p: [
          'Hesap: ad, telefon numarası ve şifre (yalnızca tuzlanmış karma (hash) olarak saklanır).',
          'Profil: yaş, cinsiyet, boy, kilo, aktivite düzeyi, hedef ve günlük kalori hedefi.',
          'Günlük: kaydettiğiniz yiyecekler ve porsiyonlar, su ve kilo kayıtları.',
          'Fotoğraflar: analiz için gönderdiğiniz yemek ve besin etiketi fotoğrafları ile isteğe bağlı profil fotoğrafı.',
          'Sağlık durumları (isteğe bağlı): profilinizde seçtiğiniz durumlar (ör. diyabet, hipertansiyon). Bunlar yalnızca yiyecek uyarılarını ve önerilerini size göre uyarlamak için kullanılır.',
          'Yapay Zekâ Beslenme Uzmanı ve Yapay Zekâ Şef: mesajlarınız, malzeme listeleriniz veya buzdolabı fotoğraflarınız yanıt oluşturmak amacıyla sunucumuza gönderilir ve orada saklanmaz. Sohbet geçmişi yalnızca cihazınızda tutulur ve oturumu kapattığınızda silinir.',
          'Abonelik durumu: satın alımlar App Store / Google Play tarafından işlenir; kart bilgilerinizi hiçbir zaman görmeyiz ve saklamayız.',
        ],
      },
      {
        h: 'Verileri nasıl kullanıyoruz',
        p: [
          'Kalori ve makro besinleri hesaplamak, günlüğünüzü tutmak ve kişisel hedefler belirlemek için.',
          'Fotoğraflar, yiyecekleri tanımak amacıyla Google Gemini’ye gönderilir.',
          'Yapay Zekâ Beslenme Uzmanı, Yapay Zekâ Şef ve sağlık uyarıları için mesajlarınız, malzemeleriniz, öğün içerikleriniz ve yanıtı kişiselleştirmek için gereken profil verileri (hedef, günlük hedef, sağlık durumları) Google Gemini’ye gönderilir. Adınız ve telefon numaranız gönderilmez.',
          'Reklam göstermeyiz, verilerinizi asla satmayız ve sizi diğer uygulamalar genelinde izlemeyiz.',
        ],
      },
      {
        h: 'Üçüncü taraf hizmetler',
        p: [
          'Google Gemini (fotoğraf analizi ve yapay zekâ asistanları), Cloudinary (görsel depolama), RevenueCat (abonelik durumu), Railway (sunucu ve veritabanı), Open Food Facts (barkod sorgulama; yalnızca barkod gönderilir).',
          'Eklediğiniz paketli ürünler (ad ve besin değerleri) diğer kullanıcılar tarafından görülebilir hâle gelir; bunlar kişisel veri içermez.',
        ],
      },
      {
        h: 'Saklama ve silme',
        p: [
          'Veriler, hesabınız etkin olduğu sürece saklanır.',
          'Profil → “Hesabı sil” seçeneği, hesabınızı ve ilgili tüm verileri (profil, günlük, kayıtlar, fotoğraflar) derhal ve kalıcı olarak siler.',
        ],
      },
      { h: 'Çocuklar', p: ['Uygulama 13 yaşından küçük çocuklara yönelik değildir.'] },
      { h: 'İletişim', p: [`${tgLink('Telegram üzerinden bize yazın')}.`] },
    ],
  },
  terms: {
    title: 'Kullanım Koşulları',
    intro: 'CaloSnap’i kullanarak bu koşulları kabul etmiş olursunuz.',
    sections: [
      {
        h: 'Tıbbi tavsiye değildir',
        p: [
          'Uygulama yalnızca bilgilendirme amaçlıdır ve bir doktorun veya diyetisyenin tavsiyesinin yerini tutmaz.',
          'Yapay zekâ tarafından tahmin edilen kalori ve besin değerleri yaklaşıktır ve hatalı olabilir.',
          'Yapay Zekâ Beslenme Uzmanı, Yapay Zekâ Şef ve sağlık uyarıları yalnızca genel bilgi sunar: teşhis koymaz, ilaç veya insülin dozu önermez. Diyabetiniz veya başka bir sağlık durumunuz varsa doktorunuzun talimatlarına uyun.',
        ],
      },
      {
        h: 'CaloSnap Pro aboneliği',
        p: [
          'Abonelikler haftalık, aylık veya yıllıktır; fiyat satın almadan önce gösterilir ve App Store veya Google Play hesabınızdan tahsil edilir.',
          'Abonelik, mevcut dönemin bitiminden en az 24 saat önce iptal edilmediği sürece otomatik olarak yenilenir.',
          'Aboneliğinizi App Store veya Google Play hesap ayarlarınızdan yönetebilir ya da iptal edebilirsiniz. CaloSnap hesabınızı silmek aboneliği iptal etmez.',
          'Abonelik satın aldığınızda ücretsiz deneme süresinin kullanılmayan kısmı geçersiz hâle gelir.',
        ],
      },
      {
        h: 'Kullanıcı içeriği',
        p: ['Eklediğiniz ürün verileri doğru olmalıdır. Hatalı veya kötüye kullanım içeren kayıtları kaldırabiliriz.'],
      },
      {
        h: 'Sorumluluk',
        p: ['Uygulama “olduğu gibi” sunulmaktadır. Yasaların izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz.'],
      },
      { h: 'İletişim', p: [`${tgLink('Telegram üzerinden bize yazın')}.`] },
    ],
  },
  'delete-account': {
    title: 'Hesabınızı silin',
    intro: 'CaloSnap hesabınızı ve ilgili tüm verileri istediğiniz zaman silebilirsiniz.',
    sections: [
      {
        h: 'Uygulama içinden (önerilir)',
        p: ['CaloSnap’i açın → Profil → “Hesabı sil” → şifrenizi girin ve onaylayın. Silme işlemi anında gerçekleşir.'],
      },
      {
        h: 'Uygulamaya erişemiyorsanız',
        p: [`Kayıt olduğunuz telefon numarasıyla ${tgLink('Telegram üzerinden bize yazın')}. Talepler 7 gün içinde tamamlanır.`],
      },
      {
        h: 'Neler silinir',
        p: [
          'Hesabınız, profiliniz, günlüğünüz, su ve kilo geçmişiniz, taranan fotoğraflarınız ve profil fotoğrafınız kalıcı olarak silinir.',
          'Eklediğiniz paketli ürünler (kişisel veri içermez) ortak katalogda kalır.',
          'Abonelikler App Store / Google Play üzerinden ayrıca iptal edilmelidir.',
        ],
      },
    ],
  },
};
