import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { COLORS, SPACING, FONTS } from '../constants';

export default function AboutScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'About',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.appName}>Rosary Together</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.text}>
              Rosary Together connects Catholics worldwide in synchronized prayer.
              Never pray alone again - join others in real-time as you pray the
              Holy Rosary together, united in faith across borders and time zones.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <Text style={styles.text}>
              1. Select your language{'\n'}
              2. Tap "I'm Ready to Pray" to join the queue{'\n'}
              3. Pray together with others in real-time{'\n'}
              4. Use voice chat to pray aloud with your community
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <Text style={styles.text}>
              {'\u2022'} Real-time synchronized prayer{'\n'}
              {'\u2022'} Live voice chat with other participants{'\n'}
              {'\u2022'} Multiple language support{'\n'}
              {'\u2022'} Daily mysteries based on Church tradition{'\n'}
              {'\u2022'} Beautiful, distraction-free interface
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Holy Rosary</Text>
            <Text style={styles.text}>
              The Rosary is a Scripture-based prayer that begins with the Apostles'
              Creed and consists of decades of Hail Marys, each preceded by the
              Our Father and followed by the Glory Be. As we pray, we meditate on
              the mysteries of Christ's life, death, and resurrection.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Mysteries</Text>
            <Text style={styles.text}>
              {'\u2022'} Sunday: Glorious Mysteries{'\n'}
              {'\u2022'} Monday: Joyful Mysteries{'\n'}
              {'\u2022'} Tuesday: Sorrowful Mysteries{'\n'}
              {'\u2022'} Wednesday: Glorious Mysteries{'\n'}
              {'\u2022'} Thursday: Luminous Mysteries{'\n'}
              {'\u2022'} Friday: Sorrowful Mysteries{'\n'}
              {'\u2022'} Saturday: Joyful Mysteries
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.text}>
              Questions or feedback? We'd love to hear from you.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:support@rosarytogether.app')}
            >
              <Text style={styles.link}>support@rosarytogether.app</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Made with prayer and love
            </Text>
            <Text style={styles.copyright}>
              {'\u00A9'} 2025 Rosary Together
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  appName: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gold,
    marginBottom: SPACING.xs,
  },
  version: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  text: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  link: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  copyright: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
});
