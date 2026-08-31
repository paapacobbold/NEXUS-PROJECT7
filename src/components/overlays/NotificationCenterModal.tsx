import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { AppRoute } from '@/context/AppStoreContext';
import { brand } from '@/data/mockData';
import { styles, useThemeColors } from '@/styles/appStyles';
import { PrimaryButton } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';

export type NotificationCategory = 'All' | 'Unread' | 'Sessions' | 'Meetups';

export interface ActivityNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'Sessions' | 'Meetups' | 'Chat' | 'XP';
  unread: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  route: AppRoute;
}

export function NotificationCenterModal({
  visible,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}) {
  const colors = useThemeColors();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('All');
  const [notifications, setNotifications] = useState<ActivityNotification[]>([
    {
      id: 'notif-1',
      title: 'Live Tutoring Broadcast',
      message: 'Calculus III: Surface Integrals Review is now LIVE in Session Lobby!',
      time: '5m ago',
      category: 'Sessions',
      unread: true,
      icon: 'videocam',
      route: 'session-lobby',
    },
    {
      id: 'notif-2',
      title: 'Campus Meetup RSVP Update',
      message: '3 peer learners just RSVP’d to KNUST Main Library Study Circle.',
      time: '25m ago',
      category: 'Meetups',
      unread: true,
      icon: 'location',
      route: 'main-sessions',
    },
    {
      id: 'notif-3',
      title: 'Peer Chat Mention',
      message: 'Ama Owusu sent a message: "Thanks for sharing the study notes!"',
      time: '1h ago',
      category: 'Chat',
      unread: true,
      icon: 'chatbubble-ellipses',
      route: 'private-chat',
    },
    {
      id: 'notif-4',
      title: 'XP Bonus Awarded',
      message: 'You earned +50 XP for confirming your campus study meetup RSVP!',
      time: '3h ago',
      category: 'XP',
      unread: false,
      icon: 'trophy',
      route: 'leaderboard',
    },
  ]);

  if (!visible) return null;

  const categories: NotificationCategory[] = ['All', 'Unread', 'Sessions', 'Meetups'];

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === 'Unread') return n.unread;
    if (activeCategory === 'Sessions') return n.category === 'Sessions';
    if (activeCategory === 'Meetups') return n.category === 'Meetups';
    return true;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleSelectNotification = (n: ActivityNotification) => {
    // Mark item as read
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)));
    onClose();
    onNavigate(n.route);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Modal Header Bar */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Notification Center</Text>
              <Text style={styles.mutedCopySmall}>
                {unreadCount > 0 ? `${unreadCount} unread activity alerts` : 'All caught up!'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {unreadCount > 0 ? (
                <Pressable onPress={handleMarkAllRead}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: brand.primary }}>Mark All Read</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Category Filter Pills */}
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
            {categories.map((cat) => (
              <Pressable key={cat} onPress={() => setActiveCategory(cat)}>
                <Pill label={cat} active={activeCategory === cat} compact />
              </Pressable>
            ))}
          </View>

          {/* Notifications Feed */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
            {filteredNotifications.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <Ionicons name="notifications-off-outline" size={32} color={colors.muted} />
                <Text style={[styles.mutedCopy, { marginTop: 8 }]}>No activity alerts in this category.</Text>
              </View>
            ) : (
              filteredNotifications.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => handleSelectNotification(n)}
                  style={[styles.notificationRow, n.unread ? styles.notificationUnreadRow : undefined]}
                >
                  <View style={styles.notificationIconWrap}>
                    <Ionicons name={n.icon} size={20} color={brand.primary} />
                  </View>

                  <View style={styles.flexFill}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.communityName, { fontSize: 14 }]} numberOfLines={1}>{n.title}</Text>
                      <Text style={styles.mutedCopySmall}>{n.time}</Text>
                    </View>
                    <Text style={[styles.mutedCopySmall, { color: colors.text, marginTop: 2 }]} numberOfLines={2}>
                      {n.message}
                    </Text>
                  </View>

                  {n.unread ? <View style={styles.notificationUnreadDot} /> : null}
                </Pressable>
              ))
            )}
          </ScrollView>

          <PrimaryButton label="Close Center" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
