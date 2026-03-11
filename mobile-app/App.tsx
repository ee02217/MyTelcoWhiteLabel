import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>MyTelco</Text>
          <Text style={styles.subtitle}>White-Label Mobile App</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          <Text style={styles.text}>
            This is a base React Native + Expo template for the Telco Self-Care White-Label
            Platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}># Install dependencies</Text>
            <Text style={styles.code}>npm install</Text>
            <Text style={styles.code}>{''}</Text>
            <Text style={styles.code}># Start development server</Text>
            <Text style={styles.code}>npm run start</Text>
            <Text style={styles.code}>{''}</Text>
            <Text style={styles.code}># Run on Android</Text>
            <Text style={styles.code}>npm run android</Text>
            <Text style={styles.code}>{''}</Text>
            <Text style={styles.code}># Run on iOS</Text>
            <Text style={styles.code}>npm run ios</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Tokens</Text>
          <Text style={styles.text}>
            Shared design tokens are available in platform-config/design-tokens/
          </Text>
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
