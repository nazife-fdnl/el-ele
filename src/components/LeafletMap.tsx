'use client';

import { useEffect, useRef } from 'react';
import type * as L from 'leaflet';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  color: string; // dairenin rengi
  text?: string; // dairenin içindeki kısa yazı / emoji
  size?: number;
  title?: string; // üzerine gelince/dokununca görünen ad
}

interface Props {
  points: MapPoint[];
  center?: { lat: number; lng: number };
  zoom?: number;
  user?: { lat: number; lng: number } | null;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * OpenStreetMap haritası (Leaflet). Ücretsizdir, anahtar gerektirmez.
 * Noktalar renkli daireler olarak çizilir; dokununca onSelect çağrılır.
 */
export default function LeafletMap({ points, center, zoom = 12, user, onSelect, className = '' }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const lib = useRef<typeof L | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  // Haritayı bir kez kur
  useEffect(() => {
    let alive = true;
    import('leaflet').then((mod) => {
      const Lf = (mod as unknown as { default?: typeof L }).default ?? (mod as unknown as typeof L);
      if (!alive || !box.current || map.current) return;
      lib.current = Lf;
      const c = center ?? { lat: 39.0, lng: 35.2 };
      const m = Lf.map(box.current, { center: [c.lat, c.lng], zoom, zoomControl: true, attributionControl: true });
      Lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(m);
      layer.current = Lf.layerGroup().addTo(m);
      map.current = m;
      setTimeout(() => m.invalidateSize(), 120);
      draw();
    });
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const Lf = lib.current;
    if (!Lf || !layer.current) return;
    layer.current.clearLayers();
    for (const p of points) {
      const s = p.size ?? 30;
      const icon = Lf.divIcon({
        className: '',
        iconSize: [s, s],
        iconAnchor: [s / 2, s / 2],
        html: `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${p.color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:${Math.round(s * 0.5)}px;color:#fff;font-weight:800">${p.text ?? ''}</div>`,
      });
      const mk = Lf.marker([p.lat, p.lng], { icon, title: p.title });
      mk.on('click', () => selectRef.current?.(p.id));
      layer.current.addLayer(mk);
    }
    if (user) {
      const me = Lf.circleMarker([user.lat, user.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#1D4ED8', fillOpacity: 1 });
      layer.current.addLayer(me);
    }
  }

  // Noktalar değişince yeniden çiz
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, user]);

  // Merkez değişince haritayı oraya taşı
  useEffect(() => {
    if (map.current && center) map.current.setView([center.lat, center.lng], zoom);
  }, [center?.lat, center?.lng, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} className={`relative z-0 overflow-hidden rounded-[6px] border border-line ${className}`} />;
}
