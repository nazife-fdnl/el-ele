// "Konuşalım" otomatik yanıtlayıcısı. Yapay zekâ KULLANMAZ ve internete
// bağlanmaz: kullanıcının yazdığı metindeki anahtar kelimelere bakıp önceden
// yazılmış cevaplardan uygun olanı seçer. Mesajlar telefondan hiç çıkmaz.
//
// Cevaplar psikolojik ilk yardım ilkelerine göre yazıldı: önce duyguyu
// karşıla, sonra tek bir küçük öneri ver, gerekiyorsa yardım hattına yönlendir.
// Acil durum (kendine zarar, istismar, fiziksel tehlike) her zaman önce gelir.

export type Topic =
  | 'kriz'
  | 'tehlike'
  | 'istismar'
  | 'nefes'
  | 'korku'
  | 'artci'
  | 'uyku'
  | 'yalniz'
  | 'yas'
  | 'suclu'
  | 'ofke'
  | 'cocuk'
  | 'ev'
  | 'iyi'
  | 'tesekkur'
  | 'selam'
  | 'bilinmiyor';

export interface BotReply {
  text: string;
  topic: Topic;
  crisis: boolean;
  suggestions: string[];
}

function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sıra önemli: üstteki konu önce kontrol edilir (acil durumlar en üstte).
const RULES: { topic: Topic; words: string[] }[] = [
  {
    topic: 'kriz',
    words: [
      'intihar', 'kendimi oldur', 'olmek istiyorum', 'olsem', 'yasamak istemiyorum',
      'kendime zarar', 'canima kiy', 'bilegimi', 'kendimi kesiyorum', 'yasamanin anlami yok',
      'hayatima son',
    ],
  },
  {
    topic: 'tehlike',
    words: ['enkaz', 'sikistim', 'mahsur', 'yaraliyim', 'kan kaybi', 'nefes alamiyorum', 'gocuk altinda'],
  },
  {
    topic: 'istismar',
    words: ['dovuyor', 'dovdu', 'taciz', 'istismar', 'zorla', 'tehdit ediyor', 'bana zarar veriyor', 'vuruyor'],
  },
  { topic: 'nefes', words: ['nefes', 'sakinles', 'rahatla', 'egzersiz'] },
  { topic: 'artci', words: ['artci', 'tekrar deprem', 'yine deprem', 'buyuk deprem', 'deprem olacak', 'deprem olur mu', 'sallanti'] },
  { topic: 'uyku', words: ['uyuyam', 'uyku', 'kabus', 'gece', 'uyandim', 'ruya'] },
  { topic: 'yas', words: ['kaybettim', 'hayatini kaybett', 'vefat', 'olen', 'yas tut', 'ozluyorum', 'ozledim', 'agliyorum', 'cenaze'] },
  { topic: 'suclu', words: ['sucluyum', 'suclu', 'keske', 'kurtaramadim', 'yardim edemedim', 'benim yuzumden'] },
  { topic: 'ofke', words: ['sinir', 'ofke', 'kizgin', 'kiziyorum', 'nefret', 'bagirmak'] },
  { topic: 'yalniz', words: ['yalniz', 'kimse yok', 'tek basima', 'kimsem yok', 'anlamiyor'] },
  { topic: 'cocuk', words: ['cocugum', 'kizim', 'oglum', 'cocuklar', 'bebegim', 'cocugumu'] },
  { topic: 'ev', words: ['evim yikildi', 'evimiz yikildi', 'evsiz', 'cadir', 'kalacak yer', 'ev yok', 'acim', 'su yok', 'yemek yok'] },
  { topic: 'korku', words: ['kork', 'panik', 'endise', 'kaygi', 'titriyorum', 'kalbim', 'gergin', 'tedirgin', 'stres'] },
  { topic: 'iyi', words: ['iyiyim', 'daha iyi', 'rahatladim', 'iyi hissediyorum', 'gecti'] },
  { topic: 'tesekkur', words: ['tesekkur', 'sagol', 'sag ol', 'eyvallah'] },
  { topic: 'selam', words: ['merhaba', 'selam', 'gunaydin', 'iyi aksamlar', 'slm', 'mrb'] },
];

const REPLIES: Record<Topic, string[]> = {
  kriz: [
    'Bunu yazdığın için teşekkür ederim, şu an çok zor bir yerdesin ve yalnız değilsin. Lütfen hemen 112’yi ara ya da yanındaki güvendiğin birine bunu söyle. 18 yaşından küçüksen ALO 183’ü de arayabilirsin. Senin güvende olman her şeyden önemli.',
  ],
  tehlike: [
    'Şu an tehlikedeysen hemen 112’yi ara. Enkaz altındaysan ağzını bir bezle kapat, gücünü korumak için bağırmak yerine düdük çal ya da borulara, duvara vurarak ses çıkar. El Ele’deki düdüğü, feneri ve Acil Buton’u da kullanabilirsin.',
  ],
  istismar: [
    'Bunu anlattığın için çok cesursun ve bu senin suçun değil. Şu an tehlikedeysen hemen 112’yi ara. 18 yaşından küçüksen ALO 183’ü arayabilir ve güvendiğin bir büyüğüne (öğretmen, akraba, okul rehber öğretmeni) anlatabilirsin.',
  ],
  nefes: [
    'Birlikte deneyelim: Burnundan yavaşça nefes alırken 4’e kadar say. Nefesini 2 saniye tut. Ağzından yavaşça verirken 6’ya kadar say. Bunu 5 kez tekrarla. Verdiğin nefesin aldığından uzun olması vücudunu sakinleştirir.',
    'Bir de şunu dene: Etrafında görebildiğin 5 şeyi, dokunabildiğin 4 şeyi, duyabildiğin 3 sesi, kokusunu alabildiğin 2 şeyi ve tadını alabildiğin 1 şeyi say. Bu, aklını şu ana getirir ve paniği azaltır.',
  ],
  korku: [
    'Böyle korkman çok anlaşılır; yaşadığın şey gerçekten korkutucu. Vücudun seni korumaya çalışıyor. İstersen birlikte sakinleştirici bir nefes egzersizi yapabiliriz, "nefes" yazman yeterli.',
    'Korku dalga gibi gelir ve geçer. Şu an güvenli bir yerdeysen bunu kendine yüksek sesle söyle: "Şu an güvendeyim." Güvendiğin birinin yanında olmak da çok iyi gelir.',
  ],
  artci: [
    'Artçılardan korkmak çok doğal. Büyük depremlerden sonra artçılar olur ve zamanla azalır. Depremin günü ve saati önceden bilinemez; "bu gece deprem olacak" gibi mesajlara inanma, bilgiyi AFAD’dan al. Sarsıntı olursa Çök-Kapan-Tutun yapmayı bilmek de kendini daha güvende hissettirir.',
    'Hazırlıklı olmak korkuyu azaltır: Deprem çantanı kapının yakınında tut, ailenle buluşma noktasını konuşun. Uygulamadaki Deprem Çantası listesine ve Deprem Oyunu’na da bakabilirsin.',
  ],
  uyku: [
    'Depremden sonra uyuyamamak ve kabus görmek çok yaygın, zamanla düzelir. Yatmadan önce haberlere ve sosyal medyaya bakmamayı dene. Ayakkabın, fenerin ve telefonun yatağının yanında olsun; bu, kendini daha güvende hissettirir.',
    'Uykun kaçarsa kendini zorlama. Kalkıp sakin bir şey yap, yavaş nefes al, sonra tekrar dene. Uykusuzluk haftalardır sürüyorsa bir doktora başvurmanı öneririm.',
  ],
  yalniz: [
    'Kendini yalnız hissetmek çok ağır. Bunu yazman bile önemli bir adım. Bugün bir kişiye, kısa da olsa, bir mesaj atabilir misin? Bazen tek bir konuşma bile iyi gelir.',
    'Yalnız değilsin; aynı şeyleri yaşayan çok insan var. Mahallendeki toplanma alanları, gönüllüler ve yardım çadırları da insanlarla bir araya gelmek için bir yol olabilir.',
  ],
  yas: [
    'Çok üzgünüm. Kaybın acısı çok ağırdır ve ağlamak, öfkelenmek, uyuşmuş hissetmek yasın normal parçalarıdır. Duygularını sevdiğin biriyle paylaşmak iyi gelebilir. Acın çok uzun süre bu kadar ağır kalırsa bir uzmandan destek almayı düşün.',
  ],
  suclu: [
    'Böyle hissetmen, ne kadar çok önemsediğini gösteriyor. Ama deprem senin suçun değil ve o anda yapabileceğinin en iyisini yaptın. Kendine, bir arkadaşına göstereceğin şefkati göstermeye çalış.',
  ],
  ofke: [
    'Öfkelenmen çok anlaşılır; yaşadıkların adil değil. Öfkeyi bastırmak yerine güvenli bir şekilde dışarı çıkarmak iyi gelir: yürüyüş yapmak, bir kâğıda yazmak ya da güvendiğin biriyle konuşmak gibi.',
  ],
  cocuk: [
    'Çocuklar depremden sonra çok korkabilir, geceleri ağlayabilir ya da yaşından küçük davranabilir; bunlar normaldir. Ona sık sık sarıl, sorularını basit ve doğru cevapla, "Şu an güvendeyiz" de. Mümkünse uyku ve yemek saatlerini düzenli tutun. Çocuklar için Deprem Oyunu’nu birlikte oynayabilirsiniz.',
  ],
  ev: [
    'Bu çok zor bir durum. Su, yiyecek, barınak gibi bir ihtiyacın varsa El Ele’de "Yardıma İhtiyacım Var" ile talep oluşturabilirsin; yakınındaki gönüllüler görür. Yakındaki market ve eczaneleri de Araçlar’dan bulabilirsin. Hayati tehlike varsa önce 112’yi ara.',
  ],
  iyi: [
    'Bunu duyduğuma çok sevindim! Kendine iyi bakmaya devam et. Ne zaman istersen buradayım.',
  ],
  tesekkur: [
    'Rica ederim. Kendine iyi bak, ne zaman istersen tekrar yazabilirsin. Zor bir an olursa 112’yi aramaktan çekinme.',
  ],
  selam: [
    'Merhaba, buradayım. Şu an nasıl hissediyorsun? Korku, uyuyamama, artçı kaygısı ya da başka bir şey olabilir.',
  ],
  bilinmiyor: [
    'Anlattığın için teşekkür ederim. Biraz daha anlatır mısın, şu an en çok ne hissediyorsun? Korku, üzüntü, yalnızlık, öfke ya da uyuyamama olabilir.',
    'Seni dinliyorum. Ben otomatik bir yardımcıyım ve her şeyi anlayamayabilirim, ama aşağıdaki konulardan birini seçebilirsin. Güvendiğin biriyle konuşmak da çok iyi gelir.',
  ],
};

const SUGGESTIONS: Record<Topic, string[]> = {
  kriz: ['Konuşacak biri lazım'],
  tehlike: ['Nefes egzersizi'],
  istismar: ['Konuşacak biri lazım'],
  nefes: ['Bir egzersiz daha', 'Daha iyiyim'],
  korku: ['Nefes egzersizi', 'Artçılardan korkuyorum'],
  artci: ['Nefes egzersizi', 'Uyuyamıyorum'],
  uyku: ['Nefes egzersizi', 'Artçılardan korkuyorum'],
  yalniz: ['Nefes egzersizi', 'Çok korkuyorum'],
  yas: ['Kendimi yalnız hissediyorum', 'Nefes egzersizi'],
  suclu: ['Nefes egzersizi', 'Kendimi yalnız hissediyorum'],
  ofke: ['Nefes egzersizi'],
  cocuk: ['Uyuyamıyorum', 'Artçılardan korkuyorum'],
  ev: ['Çok korkuyorum'],
  iyi: [],
  tesekkur: [],
  selam: ['Çok korkuyorum', 'Uyuyamıyorum', 'Artçılardan korkuyorum', 'Kendimi yalnız hissediyorum'],
  bilinmiyor: ['Çok korkuyorum', 'Uyuyamıyorum', 'Artçılardan korkuyorum', 'Kendimi yalnız hissediyorum'],
};

export const STARTERS = ['Çok korkuyorum', 'Uyuyamıyorum', 'Artçılardan korkuyorum', 'Kendimi yalnız hissediyorum'];

// Anahtar kelime bir kelimenin BAŞINDA eşleşir ("kork" → "korkuyorum",
// "korktum"); kelimenin ortasında eşleşmez ("ac" → "acil" yanlış alarm olmasın).
function matches(text: string, word: string): boolean {
  const w = normalize(word);
  return text === w || text.startsWith(w) || text.includes(` ${w}`);
}

function detectTopic(text: string): Topic {
  const t = normalize(text);
  for (const rule of RULES) {
    if (rule.words.some((w) => matches(t, w))) return rule.topic;
  }
  return 'bilinmiyor';
}

/**
 * Kullanıcının mesajına otomatik cevap üretir. Aynı konu art arda gelirse
 * farklı bir cevap seçilir (sayaç ekranda tutulur).
 */
export function botReply(text: string, seen: Partial<Record<Topic, number>>): BotReply {
  let topic = detectTopic(text);
  const t = normalize(text);
  if (topic === 'bilinmiyor' && t.includes('bir egzersiz daha')) topic = 'nefes';
  if (topic === 'bilinmiyor' && t.includes('konusacak biri')) topic = 'yalniz';
  const options = REPLIES[topic];
  const n = seen[topic] ?? 0;
  return {
    text: options[n % options.length],
    topic,
    crisis: topic === 'kriz' || topic === 'tehlike' || topic === 'istismar',
    suggestions: SUGGESTIONS[topic],
  };
}
