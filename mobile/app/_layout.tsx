import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGate } from '../src/components/AuthGate';
import { PushTokenRegistrar } from '../src/components/PushTokenRegistrar';
import { AuthProvider } from '../src/hooks/useAuth';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGate />
          <PushTokenRegistrar />
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
