/**
 * Recorded lecture browsing and playback.
 */
import { StyleSheet } from 'react-native';
import { brand } from '@/data/mockData';
import { space } from '../tokens';
import type { ThemeColors } from '../theme';

export const recordingsStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    videoModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'flex-end',
    },
    videoPlayerCard: {
      backgroundColor: '#13141E',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '90%',
      gap: 14,
    },
    videoPlayerScreen: {
      width: '100%',
      height: 210,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    videoPlayOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoProgressBarWrap: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    videoProgressBarFill: {
      height: '100%',
      backgroundColor: brand.primary,
    },
    videoControlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 6,
    },
    speedPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    speedPillActive: {
      backgroundColor: brand.primary,
    },
    speedPillText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
      fontWeight: '700',
    },
    speedPillTextActive: {
      color: '#fff',
    },
    chapterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    chapterTimeText: {
      color: '#E07038',
      fontSize: 12,
      fontWeight: '800',
    },
  });
