import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS } from '../../constants';
import { SUPPORTED_LANGUAGES, Language } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../../components/ui/LanguageSelector';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAnonymous, updateUser, logout, linkToEmail } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [showLocation, setShowLocation] = useState(user?.preferences?.showLocation ?? true);
  const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    user?.preferredLanguage || 'en'
  );

  const handleSaveDisplayName = async () => {
    await updateUser({ displayName: displayName || undefined });
    Alert.alert('Saved', 'Display name updated');
  };

  const handleLanguageChange = async (language: Language) => {
    setSelectedLanguage(language);
    await updateUser({ preferredLanguage: language });
  };

  const handleToggleShowLocation = async (value: boolean) => {
    setShowLocation(value);
    await updateUser({
      preferences: {
        ...user?.preferences,
        showLocation: value,
        notifications: notifications,
        audioGuided: user?.preferences?.audioGuided ?? false,
      },
    });
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotifications(value);
    await updateUser({
      preferences: {
        ...user?.preferences,
        showLocation: showLocation,
        notifications: value,
        audioGuided: user?.preferences?.audioGuided ?? false,
      },
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? If you have an anonymous account, you will lose your progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {isAnonymous && (
            <View style={styles.anonymousBanner}>
              <Text style={styles.warningEmoji}>⚠️</Text>
              <Text style={styles.anonymousBannerText}>
                You're using a guest account. Create an account to save your progress.
              </Text>
            </View>
          )}

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Display Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter name (optional)"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveDisplayName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Language</Text>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelectLanguage={handleLanguageChange}
            />
          </View>

          <View style={styles.settingRowSwitch}>
            <View>
              <Text style={styles.settingLabel}>Show Location</Text>
              <Text style={styles.settingDescription}>
                Let others see your country flag
              </Text>
            </View>
            <Switch
              value={showLocation}
              onValueChange={handleToggleShowLocation}
              trackColor={{ false: COLORS.surface, true: COLORS.primaryLight }}
              thumbColor={showLocation ? COLORS.primary : COLORS.textMuted}
            />
          </View>

          <View style={styles.settingRowSwitch}>
            <View>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Get reminded to pray
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.surface, true: COLORS.primaryLight }}
              thumbColor={notifications ? COLORS.primary : COLORS.textMuted}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/about')}>
            <Text style={styles.linkEmoji}>ℹ️</Text>
            <Text style={styles.linkText}>About Rosary Together</Text>
            <Text style={styles.chevronEmoji}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkEmoji}>❤️</Text>
            <Text style={styles.linkText}>Support the App</Text>
            <Text style={styles.chevronEmoji}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkEmoji}>📄</Text>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.chevronEmoji}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutEmoji}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  anonymousBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  anonymousBannerText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.warning,
  },
  settingRow: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  settingRowSwitch: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  linkText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  signOutText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    fontWeight: FONTS.weights.medium,
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  warningEmoji: {
    fontSize: 18,
  },
  linkEmoji: {
    fontSize: 22,
  },
  chevronEmoji: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  signOutEmoji: {
    fontSize: 18,
  },
});
