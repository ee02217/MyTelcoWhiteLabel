import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';
import { Button, Card, Typography } from './src/design-system';

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

        {/* Design System Demo */}
        <View style={styles.section}>
          <Typography variant="h3" color="primary">
            Design System Components
          </Typography>
          <Typography variant="small" color="secondary" style={{ marginTop: 8 }}>
            Mobile app uses shared design system from src/design-system/
          </Typography>

          <Card padding="md" shadow="md" style={{ marginTop: 16 }}>
            <Typography variant="h4" color="primary">
              Button Variants
            </Typography>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button variant="primary" size="md" title="Primary" />
              <Button variant="secondary" size="md" title="Secondary" />
              <Button variant="outline" size="md" title="Outline" />
              <Button variant="ghost" size="md" title="Ghost" />
            </View>
          </Card>

          <Card padding="md" shadow="sm" style={{ marginTop: 16 }}>
            <Typography variant="h4" color="primary">
              Typography Scale
            </Typography>
            <View style={{ marginTop: 8 }}>
              <Typography variant="h1">Heading 1</Typography>
              <Typography variant="h2">Heading 2</Typography>
              <Typography variant="h3">Heading 3</Typography>
              <Typography variant="body">Body text</Typography>
              <Typography variant="small">Small text</Typography>
              <Typography variant="caption">Caption</Typography>
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
    backgroundColor: '#fafafa',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0073e6',
  },
  subtitle: {
    fontSize: 16,
    color: '#71717a',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#52525b',
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#f4f4f5',
    lineHeight: 20,
  },
});
