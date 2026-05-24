import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { HelpRequest } from '@/lib/types';
import { NEED_LABELS } from '@/lib/needs';
import { DEMO_HELPERS } from '@/lib/demoHelpers';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const needRequest: HelpRequest = await req.json();

    // Her yardımcı için mesafe hesapla, önce mesafeye göre sırala
    const scoredHelpers = DEMO_HELPERS.map((helper) => {
      const distance = calcDistance(
        needRequest.location.lat,
        needRequest.location.lng,
        helper.location.lat,
        helper.location.lng
      );
      const overlap = needRequest.needs.filter((n) => helper.needs.includes(n)).length;
      return { helper, distance, overlap };
    });

    // Önce mesafeye göre sırala (en yakın önde)
    scoredHelpers.sort((a, b) => a.distance - b.distance);
    const best = scoredHelpers[0];
    const top3 = scoredHelpers.slice(0, 3);

    const needLabels = needRequest.needs.map((n) => NEED_LABELS[n] || n).join(', ');
    const helperOffers = best.helper.needs.map((n) => NEED_LABELS[n] || n).join(', ');

    let matchReason = `${best.helper.name} ${best.helper.surname} size yardım edebilir.`;

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: `Sen bir deprem yardım eşleştirme asistanısın. Kısa, umut verici Türkçe mesajlar yaz. Maksimum 2 kısa cümle. İsmi kullan.`,
        messages: [
          {
            role: 'user',
            content: `İhtiyaç: "${needLabels}". En uygun yardımcı: ${best.helper.name} ${best.helper.surname}, sunduğu: "${helperOffers}", mesafe: ${best.distance.toFixed(1)} km. Kısa eşleşme bildirimi yaz.`,
          },
        ],
      });

      if (message.content[0].type === 'text') {
        matchReason = message.content[0].text;
      }
    } catch {
      // Claude API yoksa basit mesaj
      matchReason = `${best.helper.name} ${best.helper.surname} ihtiyaçlarınıza yardımcı olabilir. ${best.distance.toFixed(1)} km uzakta.`;
    }

    return NextResponse.json({
      matchReason,
      distance: parseFloat(best.distance.toFixed(1)),
      contact: best.helper.contact,
      helperName: `${best.helper.name} ${best.helper.surname}`,
      helperAvatar: best.helper.avatar,
      helperNote: best.helper.note,
      helperOffers: best.helper.needs.map((n) => NEED_LABELS[n] || n),
      topMatches: top3.map((m) => ({
        name: `${m.helper.name} ${m.helper.surname}`,
        avatar: m.helper.avatar,
        distance: parseFloat(m.distance.toFixed(1)),
        offers: m.helper.needs.map((n) => NEED_LABELS[n] || n),
        contact: m.helper.contact,
        note: m.helper.note,
      })),
    });
  } catch (err) {
    console.error('Match API error:', err);
    return NextResponse.json(
      {
        matchReason: 'Talebiniz kaydedildi. En yakın yardımcı bilgilendirilecek.',
        distance: 0,
        helperName: 'Sistem',
        helperOffers: [],
        topMatches: [],
      },
      { status: 200 }
    );
  }
}
