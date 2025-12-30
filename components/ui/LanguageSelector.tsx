import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants';
import { SUPPORTED_LANGUAGES, Language } from '../../types';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelectLanguage: (language: Language) => void;
}

export default function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
}: LanguageSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const languages = Object.entries(SUPPORTED_LANGUAGES) as [Language, typeof SUPPORTED_LANGUAGES[Language]][];
  const selectedConfig = SUPPORTED_LANGUAGES[selectedLanguage];

  const handleSelectLanguage = (language: Language) => {
    onSelectLanguage(language);
    setIsModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.flag}>{selectedConfig.flag}</Text>
        <Text style={styles.languageName}>{selectedConfig.nativeName}</Text>
        <Text style={styles.chevronEmoji}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={languages}
              keyExtractor={([code]) => code}
              renderItem={({ item: [code, config] }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    code === selectedLanguage && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleSelectLanguage(code)}
                >
                  <Text style={styles.optionFlag}>{config.flag}</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionNativeName}>{config.nativeName}</Text>
                    <Text style={styles.optionName}>{config.name}</Text>
                  </View>
                  {code === selectedLanguage && (
                    <Text style={styles.checkEmoji}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  flag: {
    fontSize: 24,
  },
  languageName: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  languageOptionSelected: {
    backgroundColor: COLORS.surface,
  },
  optionFlag: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionNativeName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  optionName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  chevronEmoji: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  checkEmoji: {
    fontSize: 18,
    color: COLORS.gold,
  },
});
