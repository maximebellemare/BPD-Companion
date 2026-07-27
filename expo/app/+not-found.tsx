import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import BrandLogo from '@/components/branding/BrandLogo';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function NotFoundScreen() {
  useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: localizedText('Not found', 'No encontrado') }} />
      <View style={styles.container}>
        <BrandLogo size={72} />
        <Text style={styles.title}>{localizedText('This page is not available', 'Esta página no está disponible')}</Text>
        <Text style={styles.body}>
          {localizedText(
            'The screen may have moved as BPD Companion was simplified for daily use.',
            'Es posible que esta pantalla se haya movido al simplificar BPD Companion para el uso diario.',
          )}
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{localizedText('Return to Today', 'Volver a Hoy')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  link: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  linkText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
