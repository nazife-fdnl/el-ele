import Link from 'next/link';
import { Page, Section, Title, Card } from '@/components/ui';

interface LegalSection {
  title: string;
  items: string[];
}

// Mobil uygulamadaki bilgilendirmenin aynısı (components/LegalText.tsx), web için uyarlandı.
const SECTIONS: LegalSection[] = [
  {
    title: 'Bu uygulama ne değildir?',
    items: [
      'El Ele resmî bir acil durum hizmeti değildir ve 112’nin yerini tutmaz. Hayati tehlike varsa önce 112’yi ara.',
      'El Ele, yardıma ihtiyacı olanlarla yardım edebilecek gönüllüleri buluşturan bir dayanışma aracıdır. Yardımın ulaşacağını garanti etmez.',
    ],
  },
  {
    title: 'Hangi bilgilerin, kime gösterilir?',
    items: [
      'Konum: Yardım talebi ya da yardım teklifi oluştururken paylaştığın konum (ya da seçtiğin ilin merkezi), ilanınla birlikte haritada ve listelerde diğer kullanıcılara gösterilir. Konum yalnızca sen istediğinde alınır; arka planda takip edilmez. İzin vermezsen ilini listeden seçebilirsin; konum IP adresinden tahmin edilmez.',
      'Telefon numarası: Paylaşmak zorunlu değildir. Paylaşırsan numaran listelerde görünmez; ilanındaki “Ara” düğmesine basan kullanıcıya gösterilir.',
      'Not, kan grubu ve alerji: Yazmak zorunlu değildir. Yazarsan ilanınla birlikte diğer kullanıcılara gösterilir.',
      'Acil Buton: Basıp iptal etmezsen konumunla birlikte “kritik” öncelikli bir yardım talebi açılır ve diğer kullanıcılara gösterilir.',
      'Yakındaki yerler: Market, bakkal ve eczaneler Google Haritalar’dan (ulaşılamazsa OpenStreetMap’ten) bulunur; bunun için konumun bu hizmetlere gönderilir, El Ele bu konumu saklamaz. Bir yerin açık olup olmadığını bildirirsen bu bildirim (cihaz kimliğinle birlikte, ama başkalarına cihaz kimliği gösterilmeden) 24 saat boyunca diğer kullanıcılara gösterilir.',
      'Deprem bildirimleri: Açarsan cihazının bildirim anahtarı, seçtiğin il ve büyüklük eşiği sunucumuzda saklanır; bildirimleri kapatınca silinir. Deprem bilgileri AFAD ve Kandilli Rasathanesi’nden alınır; bu bir erken uyarı sistemi değildir.',
      '“Konuşalım” otomatik bir yardımcıdır; hazır cevaplar verir ve yapay zekâ kullanmaz. Yazdıkların cihazından çıkmaz, hiçbir yere gönderilmez ve saklanmaz.',
      'Hesap, reklam ve izleme yoktur. Site senden ad, e-posta ya da şifre istemez. Tercihlerin (deprem çantası işaretleri, oyun yıldızları, acil kişiler) sadece bu tarayıcıda saklanır.',
    ],
  },
  {
    title: 'Yapay zekâ kullanımı',
    items: [
      'Yalnızca sen açıkça izin verirsen, yardım talebine yazdığın not ve seçtiğin ihtiyaç türleri, aciliyetini değerlendirmek için bir yapay zekâ hizmetine (Anthropic – Claude) gönderilir. Telefon numaran ve konumun bu hizmete gönderilmez.',
      'İzin vermezsen talebin yine kaydedilir; yalnızca yapay zekâ değerlendirmesi yapılmaz.',
    ],
  },
  {
    title: 'Mobil uygulamadaki cihaz izinleri',
    items: [
      'Rehber: “Yakınlarına haber ver” özelliğinde seçtiğin kişiler yalnızca kendi cihazında saklanır, sunucuya gönderilmez. Mesajı her zaman sen onaylayıp gönderirsin.',
      'Mikrofon ve konuşma tanıma: Yalnızca sen başlattığında, söylediklerini yazıya çevirmek için kullanılır. El Ele ses kaydı saklamaz.',
      'Kamera: Yalnızca feneri (flaşı) açmak ve SOS sinyali vermek için kullanılır. Fotoğraf ya da video çekilmez.',
      'Bildirimler: Yalnızca deprem bildirimlerini açarsan izin istenir.',
    ],
  },
  {
    title: 'Kullanım koşulları',
    items: [
      'Uygunsuz içeriğe ve kötüye kullanıma tolerans gösterilmez. Müstehcen, hakaret ya da nefret içeren, dolandırıcılık amaçlı, sahte ya da spam ilan ve mesajlar yasaktır.',
      'Uygunsuz bulduğun bir ilanı ya da mesajı “Bildir / Gizle” ile bildirebilir, sahibini engelleyebilirsin. Bildirimler en geç 24 saat içinde incelenir; uygunsuz içerik kaldırılır ve sahibi engellenir.',
      'Gerçek olmayan yardım talebi oluşturmak, gerçekten yardıma ihtiyacı olanların yardıma ulaşmasını geciktirir. Lütfen yalnızca doğru bilgi paylaş.',
      'Tanımadığın kişilerle buluşurken kendi güvenliğine dikkat et.',
    ],
  },
];

export default function Hakkinda() {
  return (
    <Page tabs>
      <Title sub="El Ele, deprem ve afetlerde yardıma ihtiyacı olanlarla yardım edebilecek gönüllüleri buluşturan ücretsiz bir dayanışma uygulamasıdır.">
        Hakkında
      </Title>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <a href="https://play.google.com/store/apps/details?id=com.elele.deprem" className="rounded-[6px] bg-ink p-4 text-white">
          <span className="block text-[17px] font-extrabold">Android uygulaması</span>
          <span className="block text-[15px] text-zinc-300">Google Play’den indir: fener, deprem bildirimleri ve daha fazlası</span>
        </a>
        <a href="/gizlilik.html" className="rounded-[6px] border border-line bg-card p-4">
          <span className="block text-[17px] font-extrabold">Gizlilik politikası</span>
          <span className="block text-[15px] text-muted">Tam metin</span>
        </a>
      </div>
      {SECTIONS.map((s) => (
        <div key={s.title}>
          <Section>{s.title.toLocaleUpperCase('tr-TR')}</Section>
          <Card className="mt-2 flex flex-col gap-2">
            {s.items.map((t, i) => (
              <p key={i} className="text-[15px] leading-relaxed">• {t}</p>
            ))}
          </Card>
        </div>
      ))}
      <Section>İLETİŞİM</Section>
      <Card>
        <p className="text-[15px]">
          Soruların, bir ilanın silinmesi ya da uygunsuz içerik bildirimi için:{' '}
          <a href="mailto:nazifefidanol34@gmail.com" className="font-bold underline">nazifefidanol34@gmail.com</a>
        </p>
        <p className="mt-2 text-[15px]"><Link href="/destek.html" className="font-bold underline">Destek sayfası</Link></p>
      </Card>
    </Page>
  );
}
