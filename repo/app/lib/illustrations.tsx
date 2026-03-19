import React from 'react';
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

// ─── Tennis Ball Icon ────────────────────────────────────────────────
interface TennisBallIconProps {
  size?: number;
  opacity?: number;
}

export function TennisBallIcon({ size = 24, opacity = 1 }: TennisBallIconProps) {
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" opacity={opacity}>
      <Circle cx="24" cy="24" r="22" fill="#8B9A3C" />
      <Circle cx="24" cy="24" r="20" fill="#A3B04A" />
      {/* Classic tennis ball seam curves */}
      <Path
        d="M8 18 C14 22, 14 26, 8 30"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M40 18 C34 22, 34 26, 40 30"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M8 18 C18 10, 30 10, 40 18"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M8 30 C18 38, 30 38, 40 30"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Court Illustration ──────────────────────────────────────────────
export function CourtIllustration({ width = 200, height = 120 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 120">
      {/* Court surface */}
      <Rect x="10" y="10" width="180" height="100" rx="2" fill="#2d5a3d" />
      {/* Baselines */}
      <Line x1="20" y1="15" x2="20" y2="105" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <Line x1="180" y1="15" x2="180" y2="105" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      {/* Service lines */}
      <Line x1="65" y1="30" x2="65" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <Line x1="135" y1="30" x2="135" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      {/* Center service line */}
      <Line x1="65" y1="60" x2="135" y2="60" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      {/* Net */}
      <Line x1="100" y1="10" x2="100" y2="110" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeDasharray="4 3" />
      {/* Singles sidelines */}
      <Line x1="20" y1="30" x2="180" y2="30" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <Line x1="20" y1="90" x2="180" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      {/* Doubles sidelines */}
      <Line x1="20" y1="15" x2="180" y2="15" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      <Line x1="20" y1="105" x2="180" y2="105" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
    </Svg>
  );
}

// ─── Empty Matches Illustration ──────────────────────────────────────
export function EmptyMatchesIllustration({ size = 160 }: { size?: number }) {
  const scale = size / 160;
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <G opacity="0.6">
        {/* Racket handle */}
        <Rect
          x="30" y="100" width="50" height="12" rx="3"
          fill="#4a4a4a"
          transform="rotate(-35, 55, 106)"
        />
        {/* Racket head */}
        <Ellipse
          cx="90" cy="65"
          rx="28" ry="36"
          fill="none"
          stroke="#5a5a5a"
          strokeWidth="3"
          transform="rotate(-35, 90, 65)"
        />
        {/* Racket strings horizontal */}
        <Line x1="72" y1="48" x2="108" y2="48" stroke="#3a3a3a" strokeWidth="0.8" transform="rotate(-35, 90, 65)" />
        <Line x1="70" y1="58" x2="110" y2="58" stroke="#3a3a3a" strokeWidth="0.8" transform="rotate(-35, 90, 65)" />
        <Line x1="70" y1="68" x2="110" y2="68" stroke="#3a3a3a" strokeWidth="0.8" transform="rotate(-35, 90, 65)" />
        <Line x1="70" y1="78" x2="108" y2="78" stroke="#3a3a3a" strokeWidth="0.8" transform="rotate(-35, 90, 65)" />
        {/* Tennis ball */}
        <Circle cx="120" cy="110" r="16" fill="#6b7a3a" />
        <Path
          d="M110 104 C114 108, 114 112, 110 116"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M130 104 C126 108, 126 112, 130 116"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          fill="none"
        />
      </G>
      {/* Text */}
      <SvgText
        x="80" y="150"
        textAnchor="middle"
        fontSize="12"
        fill="#6b7280"
        fontWeight="500"
      >
        No matches
      </SvgText>
    </Svg>
  );
}

// ─── Empty Search Illustration ───────────────────────────────────────
export function EmptySearchIllustration({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <G opacity="0.6">
        {/* Magnifying glass */}
        <Circle cx="58" cy="55" r="28" fill="none" stroke="#5a5a5a" strokeWidth="3" />
        <Line x1="78" y1="75" x2="100" y2="97" stroke="#5a5a5a" strokeWidth="4" strokeLinecap="round" />
        {/* Tennis ball inside magnifier */}
        <Circle cx="58" cy="55" r="14" fill="#5a6a32" />
        <Path
          d="M50 50 C54 53, 54 57, 50 60"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          fill="none"
        />
        <Path
          d="M66 50 C62 53, 62 57, 66 60"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          fill="none"
        />
        {/* Question mark */}
        <SvgText
          x="110" y="48"
          fontSize="28"
          fill="#4a4a4a"
          fontWeight="700"
        >
          ?
        </SvgText>
      </G>
    </Svg>
  );
}

// ─── Empty Favorites Illustration ────────────────────────────────────
export function EmptyFavoritesIllustration({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <G opacity="0.55">
        {/* Heart shape */}
        <Path
          d="M70 110 C30 80, 10 50, 40 30 C55 22, 70 35, 70 45 C70 35, 85 22, 100 30 C130 50, 110 80, 70 110 Z"
          fill="none"
          stroke="#5a5a5a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Tennis ball in center */}
        <Circle cx="70" cy="65" r="16" fill="#5a6a32" />
        <Path
          d="M60 59 C64 63, 64 67, 60 71"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          fill="none"
        />
        <Path
          d="M80 59 C76 63, 76 67, 80 71"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          fill="none"
        />
      </G>
    </Svg>
  );
}

// ─── Trophy Illustration ─────────────────────────────────────────────
export function TrophyIllustration({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      {/* Trophy cup */}
      <Path
        d="M45 30 L50 80 Q70 95 90 80 L95 30 Z"
        fill="#b8860b"
        opacity={0.8}
      />
      {/* Left handle */}
      <Path
        d="M45 40 C25 40, 20 60, 40 70"
        fill="none"
        stroke="#b8860b"
        strokeWidth="4"
        opacity={0.7}
        strokeLinecap="round"
      />
      {/* Right handle */}
      <Path
        d="M95 40 C115 40, 120 60, 100 70"
        fill="none"
        stroke="#b8860b"
        strokeWidth="4"
        opacity={0.7}
        strokeLinecap="round"
      />
      {/* Trophy base */}
      <Rect x="60" y="85" width="20" height="18" fill="#a0750a" rx="2" />
      <Rect x="48" y="103" width="44" height="8" rx="3" fill="#a0750a" />
      {/* Star */}
      <Path
        d="M70 42 L73.5 53 L85 53 L76 60 L79 71 L70 64 L61 71 L64 60 L55 53 L66.5 53 Z"
        fill="#ffd700"
        opacity={0.85}
      />
      {/* Small stars */}
      <Path
        d="M30 20 L31.5 24 L36 24 L32.5 27 L34 31 L30 28 L26 31 L27.5 27 L24 24 L28.5 24 Z"
        fill="#ffd700"
        opacity={0.4}
      />
      <Path
        d="M110 18 L111.5 22 L116 22 L112.5 25 L114 29 L110 26 L106 29 L107.5 25 L104 22 L108.5 22 Z"
        fill="#ffd700"
        opacity={0.4}
      />
      <Path
        d="M95 8 L96 11 L99 11 L96.5 13 L97.5 16 L95 14 L92.5 16 L93.5 13 L91 11 L94 11 Z"
        fill="#ffd700"
        opacity={0.3}
      />
    </Svg>
  );
}
