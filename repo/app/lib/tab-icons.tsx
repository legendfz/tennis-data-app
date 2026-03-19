import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

interface TabIconProps {
  color: string;
  size?: number;
}

// Matches — scoreboard / VS style
export function MatchesIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Two circles with VS line */}
      <Circle cx="7" cy="12" r="5" stroke={color} strokeWidth="1.8" fill="none" />
      <Circle cx="17" cy="12" r="5" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// Players — person silhouette
export function PlayersIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
      {/* Body */}
      <Path
        d="M5 21 C5 17, 8 14, 12 14 C16 14, 19 17, 19 21"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Tournaments — trophy
export function TournamentsIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cup */}
      <Path
        d="M7 4 L8 14 Q12 17 16 14 L17 4 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Left handle */}
      <Path d="M7 6 C4 6, 3 10, 6 12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Right handle */}
      <Path d="M17 6 C20 6, 21 10, 18 12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Base */}
      <Line x1="10" y1="17" x2="14" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="9" y1="20" x2="15" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12" y2="20" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// H2H — two people facing each other
export function H2HIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Person 1 - left */}
      <Circle cx="7" cy="7" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M2 18 C2 15, 4 13, 7 13 C9 13, 10.5 14, 11 15" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Person 2 - right */}
      <Circle cx="17" cy="7" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M22 18 C22 15, 20 13, 17 13 C15 13, 13.5 14, 13 15" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* VS arrows */}
      <Line x1="10" y1="10" x2="14" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M13 8 L15 10 L13 12" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Fantasy — star/sparkles
export function FantasyIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Main star */}
      <Path
        d="M12 2 L14.5 9 L22 9.5 L16 14.5 L18 22 L12 17.5 L6 22 L8 14.5 L2 9.5 L9.5 9 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Sparkle top-right */}
      <Path d="M19 2 L19.5 4 L21 4.5 L19.5 5 L19 7 L18.5 5 L17 4.5 L18.5 4 Z" stroke={color} strokeWidth="1" fill={color} />
    </Svg>
  );
}

// Following — heart
export function FollowingIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20 C6 15, 2 11, 5 7 C6.5 5, 9 4.5, 12 7.5 C15 4.5, 17.5 5, 19 7 C22 11, 18 15, 12 20 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
