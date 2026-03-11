import tokens from '../../platform-config/design-tokens/tokens.json';

function App() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>MyTelco</h1>
        <p style={styles.subtitle}>Customer Web Portal</p>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Getting Started</h2>
          <p style={styles.text}>
            This is a base Vite + React + TypeScript template for the Telco Self-Care White-Label
            Platform.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Design Tokens</h2>
          <p style={styles.text}>
            This app uses shared design tokens from <code>platform-config/design-tokens/</code>
          </p>

          <div style={styles.tokenGrid}>
            <div style={styles.tokenCard}>
              <h3 style={styles.tokenTitle}>Primary Color</h3>
              <div style={styles.tokenPreview}>
                <div
                  style={{
                    backgroundColor: tokens.color.primary[500],
                    width: '100%',
                    height: '60px',
                    borderRadius: '8px',
                  }}
                />
              </div>
              <code style={styles.tokenValue}>{tokens.color.primary[500]}</code>
            </div>

            <div style={styles.tokenCard}>
              <h3 style={styles.tokenTitle}>Secondary Color</h3>
              <div style={styles.tokenPreview}>
                <div
                  style={{
                    backgroundColor: tokens.color.secondary[500],
                    width: '100%',
                    height: '60px',
                    borderRadius: '8px',
                  }}
                />
              </div>
              <code style={styles.tokenValue}>{tokens.color.secondary[500]}</code>
            </div>

            <div style={styles.tokenCard}>
              <h3 style={styles.tokenTitle}>Font Family</h3>
              <p style={styles.tokenValue}>{tokens.font.family.sans}</p>
            </div>

            <div style={styles.tokenCard}>
              <h3 style={styles.tokenTitle}>Shadow</h3>
              <div style={styles.tokenPreview}>
                <div
                  style={{
                    boxShadow: tokens.shadow.md,
                    width: '100%',
                    height: '60px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                  }}
                />
              </div>
              <code style={styles.tokenValue}>shadow-md</code>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Start Commands</h2>
          <pre style={styles.codeBlock}>
            <code>{`# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck

# Lint code
npm run lint

# Build for production
npm run build`}</code>
          </pre>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '24px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
    padding: '32px 0',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: tokens.color.primary[500],
  },
  subtitle: {
    fontSize: '16px',
    color: tokens.color.neutral[500],
    marginTop: '4px',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: tokens.color.neutral[800],
    marginBottom: '12px',
  },
  text: {
    fontSize: '14px',
    color: tokens.color.neutral[600],
    lineHeight: '1.6',
  },
  tokenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  tokenCard: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: tokens.shadow.sm,
  },
  tokenTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.color.neutral[700],
    marginBottom: '8px',
  },
  tokenPreview: {
    marginBottom: '8px',
  },
  tokenValue: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: tokens.color.neutral[500],
  },
  codeBlock: {
    backgroundColor: tokens.color.neutral[800],
    borderRadius: '8px',
    padding: '16px',
    overflow: 'auto',
  },
};

export default App;
