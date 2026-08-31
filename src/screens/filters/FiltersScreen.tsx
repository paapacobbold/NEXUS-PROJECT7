import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, Text } from '@/components/ui';
import { FilterKey, useAppStore } from '@/context/AppStoreContext';
import { filterSections } from '@/data/mockData';
import { styles, useThemeColors } from '@/styles/appStyles';

function toTitleCase(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

export function FiltersScreen({
  onBack,
  onApply,
}: {
  onBack: () => void;
  onApply: () => void;
}) {
  const colors = useThemeColors();
  const { selectedFilters, toggleFilter, resetFilters } = useAppStore();

  return (
    <SafeAreaView style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.formScreen}>
        <View style={styles.screenHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle}>Filters</Text>
          <Pressable onPress={resetFilters}>
            <Text style={styles.helperLink}>Reset</Text>
          </Pressable>
        </View>

        {(Object.keys(filterSections) as FilterKey[]).map((section) => (
          <View key={section} style={styles.filterSection}>
            <Text style={styles.filterTitle}>{toTitleCase(section)}</Text>
            <View style={styles.filterWrap}>
              {filterSections[section].map((option) => (
                <Pressable
                  key={option}
                  onPress={() => toggleFilter(section, option)}
                  style={[
                    styles.filterChip,
                    selectedFilters[section].includes(option) ? styles.filterChipActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilters[section].includes(option) ? styles.filterChipTextActive : undefined,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <PrimaryButton label="Apply Filters" onPress={onApply} />
      </ScrollView>
    </SafeAreaView>
  );
}
