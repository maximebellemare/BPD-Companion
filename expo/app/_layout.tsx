import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/providers/AppProvider";
import { AICompanionProvider } from "@/providers/AICompanionProvider";
import { ProfileProvider } from "@/providers/ProfileProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import Colors from "@/constants/colors";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="check-in"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="safety-mode"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="exercise"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="insights"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="relationship-insights"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="guided-regulation"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="daily-ritual"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="upgrade"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="relationship-spiral"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="weekly-reflection"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="emotional-loops"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="crisis-mode"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <AppProvider>
          <SubscriptionProvider>
            <ProfileProvider>
              <AICompanionProvider>
                <RootLayoutNav />
              </AICompanionProvider>
            </ProfileProvider>
          </SubscriptionProvider>
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
