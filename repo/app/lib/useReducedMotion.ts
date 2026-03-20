import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const mq = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
      if (mq) {
        setReduceMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      }
    } else {
      AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
      const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
      return () => sub.remove();
    }
  }, []);

  return reduceMotion;
}
