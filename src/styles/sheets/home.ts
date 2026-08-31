/**
 * The home dashboard.
 */
import { StyleSheet } from 'react-native';
import { brand } from '@/data/mockData';
import { shadowSm, space } from '../tokens';
import { shadow } from '../theme';
import type { ThemeColors } from '../theme';

export const homeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    titleLarge: {
      fontSize: 34,
      fontWeight: '800',
      color: c.text,
    },
    topActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    liveCard: {
      backgroundColor: brand.primary,
      borderRadius: 22,
      padding: 18,
      gap: 10,
      ...shadow,
      ...shadowSm,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF655E',
    },
    liveBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
    },
    liveTitle: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '800',
    },
    liveMeta: {
      color: 'rgba(255,255,255,0.82)',
      fontSize: 14,
    },
    inlineButton: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    inlineButtonText: {
      color: '#fff',
      fontWeight: '700',
    },
    sectionLink: {
      fontSize: 13,
      color: brand.primary,
      fontWeight: '800',
    },
    horizontalList: {
      gap: 12,
    },
    sessionCard: {
      width: 220,
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: c.border,
      ...shadow,
      ...shadowSm,
    },
    sessionTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '800',
      color: c.text,
    },
    sessionParticipants: {
      color: c.muted,
      fontSize: 12,
    },
    communityRowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 18,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      ...shadowSm,
    },
    communityThumb: {
      width: 54,
      height: 54,
      borderRadius: 14,
    },
    streakCard: {
      backgroundColor: c.card,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      marginVertical: 10,
      gap: 10,
    },
    streakDaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    streakDayItem: {
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: '#F4F2EE',
      minWidth: 40,
    },
    streakDayItemActive: {
      backgroundColor: '#FFF4EB',
      borderWidth: 1,
      borderColor: '#FFE4D1',
    },
    streakDayName: {
      fontSize: 11,
      fontWeight: '700',
      color: c.muted,
    },
    goalTaskCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
    },
    goalTaskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
  });
