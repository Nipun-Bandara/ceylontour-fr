'use client';

import L from 'leaflet';
import { useMemo } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { bandColors, neutralColors } from '@/design-tokens';
import type { DestinationSummary, PressureBand } from '@/types/api';
import 'leaflet/dist/leaflet.css';

/**
 * The Leaflet map itself (F7).
 *
 * This module is never imported directly — `MapView` pulls it in through
 * `next/dynamic` with `ssr: false`, because Leaflet reaches for `window` as
 * soon as it is evaluated and would break a server render.
 *
 * No GIS work, as F7 says. Fixed coordinates and the standard OSM tile layer.
 */

/** Roughly the middle of Sri Lanka, at a zoom that fits the whole island. */
const SRI_LANKA_CENTRE: [number, number] = [7.8731, 80.7718];
const ISLAND_ZOOM = 7.4;

/**
 * Keeps the map from being dragged off into the ocean. Generous enough not to
 * feel like a cage, tight enough that the island stays on screen.
 */
const ISLAND_BOUNDS: [[number, number], [number, number]] = [
  [5.5, 79.0],
  [10.2, 82.2],
];

/**
 * A marker drawn as an SVG pin, coloured by pressure band.
 *
 * Leaflet's default marker is an image loaded from a path that bundlers
 * rewrite, which is the usual reason markers silently vanish in a Next build.
 * Drawing our own sidesteps that entirely and is also the only way to colour
 * them from the design tokens.
 *
 * Nothing from the API is interpolated into this string. It is geometry and a
 * token colour, and it stays that way — the destination name goes on the
 * marker's `title`, which Leaflet sets as a DOM property rather than as HTML.
 */
/** Tap target size. The pin is smaller than this and sits inside it. */
const MARKER_HIT = 44;

function pinIcon(band: PressureBand): L.DivIcon {
  const fill = bandColors[band];
  return L.divIcon({
    className: 'ceylontour-pin',
    // The visible pin stays 26x34, but the element Leaflet makes clickable is
    // 44x44 — a finger-sized target around a map-sized marker. The pin is
    // pushed to the bottom of the box so the anchor below still lands on its
    // point.
    html: `<div style="width:${MARKER_HIT}px;height:${MARKER_HIT}px;display:flex;align-items:flex-end;justify-content:center">
      <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21C26 5.8 20.2 0 13 0z" fill="${fill}" stroke="${neutralColors.card}" stroke-width="2"/>
        <circle cx="13" cy="13" r="4.5" fill="${neutralColors.card}"/>
      </svg>
    </div>`,
    iconSize: [MARKER_HIT, MARKER_HIT],
    // Anchored at the point of the pin, so it sits on the coordinate rather
    // than beside it.
    iconAnchor: [MARKER_HIT / 2, MARKER_HIT],
  });
}

export default function DestinationMap({
  destinations,
  selectedId,
  onSelect,
}: {
  destinations: DestinationSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  // Rebuilding a DivIcon on every render would recreate every marker on the
  // map each time the selection changes.
  const icons = useMemo(
    () => ({
      low: pinIcon('low'),
      medium: pinIcon('medium'),
      high: pinIcon('high'),
    }),
    []
  );

  return (
    <MapContainer
      center={SRI_LANKA_CENTRE}
      zoom={ISLAND_ZOOM}
      minZoom={6}
      maxBounds={ISLAND_BOUNDS}
      maxBoundsViscosity={0.8}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      {/*
        The attribution is required by both the ODbL licence on the data and
        the OSM Foundation's tile usage policy. Leaflet renders it in the
        bottom-right corner of the map. Do not hide it, move it off screen or
        collapse it — it is a licence condition, not decoration.
      */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {destinations.map((destination) => (
        <Marker
          key={destination.id}
          position={[destination.lat, destination.lon]}
          icon={icons[destination.band]}
          // Set as a DOM property by Leaflet, so the name is never injected
          // as HTML.
          title={`${destination.name} — ${destination.band} pressure`}
          keyboard
          zIndexOffset={destination.id === selectedId ? 1000 : 0}
          eventHandlers={{
            click: () => onSelect(destination.id),
            keypress: () => onSelect(destination.id),
          }}
        />
      ))}
    </MapContainer>
  );
}
