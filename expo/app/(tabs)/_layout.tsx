import { Tabs } from "expo-router";
import { Brain, Home, Sparkles, User, Wrench } from "lucide-react-native";
import React from "react";
import { useAppTheme } from "@/providers/ThemeProvider";

export default function TabLayout() {
  const { colors: palette } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.borderLight,
          borderTopWidth: 0.5,
          shadowColor: palette.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700' as const,
          letterSpacing: 0,
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Today",
          tabBarLabel: "Today",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          title: "Companion",
          tabBarLabel: "Companion",
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarLabel: "Insights",
          tabBarIcon: ({ color, size }) => <Brain size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarLabel: "Tools",
          tabBarIcon: ({ color, size }) => <Wrench size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
