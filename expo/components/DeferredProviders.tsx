import React, { useState, useEffect, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function DeferredProviders({ children, fallback }: Props) {
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      fallback ?? (
        <View style={styles.container}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
