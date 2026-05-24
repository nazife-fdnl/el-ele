'use client';

import { useEffect, useRef } from 'react';
import { HelpRequest } from '@/lib/types';
import { NEEDS } from '@/lib/needs';

interface Props {
  requests: HelpRequest[];
  center?: [number, number];
  zoom?: number;
}

export default function MapView({ requests, center, zoom = 13 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current) return;
      if (mapRef.current) return;

      // Fix Leaflet default icon issue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const defaultCenter: [number, number] = center || [41.0082, 28.9784];

      const map = L.map(containerRef.current!, {
        center: defaultCenter,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(map);

      // MUST call this after map is added to DOM
      setTimeout(() => {
        if (mapRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mapRef.current as any).invalidateSize(true);
        }
      }, 100);

      // Add markers
      requests.forEach((req) => {
        const isNeed = req.type === 'need';

        const needEmojis = req.needs
          .slice(0, 2)
          .map((id) => NEEDS.find((n) => n.id === id)?.emoji || '')
          .join('');

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              position: relative;
              width: 48px;
              height: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${isNeed ? `<div style="
                position: absolute;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(220,38,38,0.3);
                animation: ripple 1.5s ease-out infinite;
              "></div>` : ''}
              <div style="
                position: relative;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${isNeed ? '#dc2626' : '#16a34a'};
                border: 3px solid ${isNeed ? '#fca5a5' : '#86efac'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 3px 14px rgba(0,0,0,0.6);
                z-index: 1;
              ">${needEmojis || (isNeed ? '🆘' : '🙌')}</div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          popupAnchor: [0, -28],
        });

        const needNames = req.needs
          .map((id) => NEEDS.find((n) => n.id === id)?.label || id)
          .join(', ');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reqAny = req as any;
        const displayName = reqAny.name
          ? `${reqAny.name} ${reqAny.surname || ''}`
          : isNeed ? 'İhtiyaç sahibi' : 'Yardımcı';

        const popup = `
          <div style="
            background: #1a1a2e;
            color: #fff;
            padding: 12px 14px;
            border-radius: 14px;
            min-width: 170px;
            font-family: -apple-system, system-ui, sans-serif;
            border: 1px solid ${isNeed ? '#7f1d1d' : '#14532d'};
          ">
            <div style="font-weight:700;color:${isNeed ? '#f87171' : '#4ade80'};margin-bottom:6px;font-size:14px;">
              ${isNeed ? '🆘' : '🙌'} ${displayName}
            </div>
            <div style="color:#d1d5db;font-size:12px;margin-bottom:8px;">${needNames}</div>
            ${req.contact ? `
              <a href="tel:${req.contact}" style="
                display:block;
                background:${isNeed ? '#dc2626' : '#16a34a'};
                color:#fff;
                text-align:center;
                padding:6px 12px;
                border-radius:8px;
                font-size:12px;
                font-weight:600;
                text-decoration:none;
              ">📞 ${req.contact}</a>
            ` : ''}
          </div>
        `;

        L.marker([req.location.lat, req.location.lng], { icon })
          .addTo(map)
          .bindPopup(popup, {
            className: 'elele-popup',
            closeButton: false,
            maxWidth: 220,
          });
      });
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
