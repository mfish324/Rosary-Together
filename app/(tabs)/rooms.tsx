import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, PUBLIC_ROOM_IDS } from '../../constants';
import { Room, Language, SUPPORTED_LANGUAGES } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPublicRooms, subscribeToRoomCount } from '../../services/rooms';

interface RoomCardProps {
  room: Room;
  participantCount: number;
  onPress: () => void;
}

function RoomCard({ room, participantCount, onPress }: RoomCardProps) {
  const langConfig = SUPPORTED_LANGUAGES[room.language];

  return (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomFlag}>{langConfig.flag}</Text>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomLanguage}>{langConfig.nativeName}</Text>
        </View>
      </View>
      <View style={styles.roomStats}>
        <View style={styles.participantBadge}>
          <Text style={styles.participantIcon}>👥</Text>
          <Text style={styles.participantCount}>{participantCount}</Text>
        </View>
        <Text style={styles.joinText}>Join</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RoomsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load public rooms
  const loadRooms = async () => {
    try {
      const rooms = await getAllPublicRooms();
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRooms();

    // Subscribe to room counts for all public rooms
    const unsubscribers: (() => void)[] = [];
    const languages: Language[] = ['en', 'es', 'pt', 'tl'];

    languages.forEach((lang) => {
      const roomId = PUBLIC_ROOM_IDS[lang];
      const unsub = subscribeToRoomCount(roomId, (count) => {
        setRoomCounts((prev) => ({ ...prev, [roomId]: count }));
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRooms();
  };

  const handleJoinRoom = (room: Room) => {
    router.push({
      pathname: '/pray',
      params: { mode: 'room', roomId: room.id, language: room.language },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading rooms...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🏛️</Text>
          <Text style={styles.title}>{t('rooms.title', 'Prayer Rooms')}</Text>
          <Text style={styles.subtitle}>
            {t('rooms.subtitle', 'Join a room to pray with others')}
          </Text>
        </View>

        {/* Public Rooms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('rooms.publicRooms', 'Public Rooms')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t('rooms.publicRoomsDesc', 'Open to everyone, organized by language')}
          </Text>

          <View style={styles.roomsList}>
            {publicRooms.length > 0 ? (
              publicRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  participantCount={roomCounts[room.id] || 0}
                  onPress={() => handleJoinRoom(room)}
                />
              ))
            ) : (
              // Fallback: show language options even if rooms not yet created
              (['en', 'es', 'pt', 'tl'] as Language[]).map((lang) => {
                const langConfig = SUPPORTED_LANGUAGES[lang];
                const roomId = PUBLIC_ROOM_IDS[lang];
                return (
                  <TouchableOpacity
                    key={lang}
                    style={styles.roomCard}
                    onPress={() =>
                      router.push({
                        pathname: '/pray',
                        params: { mode: 'room', roomId, language: lang },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.roomHeader}>
                      <Text style={styles.roomFlag}>{langConfig.flag}</Text>
                      <View style={styles.roomInfo}>
                        <Text style={styles.roomName}>
                          {langConfig.name} Prayer Room
                        </Text>
                        <Text style={styles.roomLanguage}>
                          {langConfig.nativeName}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.roomStats}>
                      <View style={styles.participantBadge}>
                        <Text style={styles.participantIcon}>👥</Text>
                        <Text style={styles.participantCount}>
                          {roomCounts[roomId] || 0}
                        </Text>
                      </View>
                      <Text style={styles.joinText}>Join</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Groups Section Teaser */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.groupsTeaser}
            onPress={() => router.push('/groups')}
            activeOpacity={0.8}
          >
            <Text style={styles.groupsEmoji}>👨‍👩‍👧‍👦</Text>
            <View style={styles.groupsInfo}>
              <Text style={styles.groupsTitle}>
                {t('rooms.myGroups', 'My Prayer Groups')}
              </Text>
              <Text style={styles.groupsSubtitle}>
                {t('rooms.createOrJoin', 'Create or join a private prayer group')}
              </Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  roomsList: {
    gap: SPACING.md,
  },
  roomCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  roomFlag: {
    fontSize: 32,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  roomLanguage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
  },
  participantIcon: {
    fontSize: 14,
  },
  participantCount: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  joinText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.primary,
  },
  groupsTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  groupsEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  groupsInfo: {
    flex: 1,
  },
  groupsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
  },
  groupsSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 24,
    color: COLORS.primary,
  },
});
