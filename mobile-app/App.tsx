import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Typography } from './src/design-system';
import { rnTokens } from '../platform-config/design-system/tokens';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" color="primary">
            MyTelco
          </Typography>
          <Typography variant="body" color="secondary">
            White-Label Mobile App
          </Typography>
        </View>

        <View style={styles.section}>
          <Typography variant="h3">Mobile Design System Demo</Typography>
          <Typography variant="small" color="secondary" style={{ marginTop: 8 }}>
            Shared React Native primitives consuming platform-config/design-system/tokens.ts
          </Typography>

          <Card padding="md" shadow="md" style={{ marginTop: 16 }}>
            <Typography variant="h4">Button Variants</Typography>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button variant="primary" size="md" title="Primary action" />
              <Button variant="secondary" size="md" title="Secondary action" />
              <Button variant="outline" size="md" title="Outline action" />
            </View>
          </Card>
        </View>

        <StatusBar style="auto" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rnTokens.colors.semantic.background.primary,
  },
  content: {
    padding: rnTokens.spacingPx[6],
  },
  header: {
    marginBottom: rnTokens.spacingPx[8],
    alignItems: 'center',
  },
  section: {
    marginBottom: rnTokens.spacingPx[6],
  },
});
