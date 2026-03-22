import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface TabBarProps {
  activeTab: 'surah' | 'juz';
  onTabChange: (tab: 'surah' | 'juz') => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onTabChange('surah')}
        style={[
          styles.tab,
          activeTab === 'surah' && styles.activeTab,
        ]}
        accessibilityLabel="Surah tab"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'surah' }}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'surah' && styles.activeTabText,
          ]}
        >
          Surah
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onTabChange('juz')}
        style={[
          styles.tab,
          activeTab === 'juz' && styles.activeTab,
        ]}
        accessibilityLabel="Juz tab"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'juz' }}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'juz' && styles.activeTabText,
          ]}
        >
          Juz
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#0D7377',
  },
  tabText: {
    fontSize: theme.typography.label.size,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.surface,
  },
});
