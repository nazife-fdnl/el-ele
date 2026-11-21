// Ana sayfadaki "Günün ipucu" kartı. Her gün bir sonraki ipucu gösterilir.
export const TIPS: string[] = [
  'Dolap ve kitaplıkları duvara sabitle. Deprem yaralanmalarının önemli bir kısmı devrilen eşyalardan olur.',
  'Deprem anında Çök-Kapan-Tutun: sağlam bir masanın altına ya da yanına çök, başını koru, tutun.',
  'Ailenle bir buluşma noktası belirle. Telefonlar çalışmazsa nerede buluşacağınızı bilin.',
  'e-Devlet’ten evine en yakın toplanma alanını öğren ve ailenle paylaş.',
  'Deprem çantanı kapının yakınında, kolay ulaşılır bir yerde tut.',
  'Yatağını pencere, ayna ve ağır eşyalardan uzak bir yere koy.',
  'Sarsıntı sırasında asansör kullanma, merdivene ve balkona koşma.',
  'Gaz kokusu varsa kibrit, çakmak yakma ve elektrik düğmelerine dokunma.',
  'Deprem sonrası hatları meşgul etme; yakınlarına kısa mesajla haber ver.',
  'Bilgiyi AFAD gibi resmî kaynaklardan al; doğrulanmamış haberleri paylaşma.',
];

export function tipOfToday(): string {
  const day = Math.floor(Date.now() / 86400000);
  return TIPS[day % TIPS.length];
}
