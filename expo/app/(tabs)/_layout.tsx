import { Tabs } from "expo-router";
import { Home, BookOpen, Wrench, MessageSquare, Sparkles, Users, GraduationCap, User } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brandTeal,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FAFAF8',
          borderTopColor: 'rgba(27,40,56,0.05)',
          borderTopWidth: 0.5,
          shadowColor: 'rgba(27,40,56,0.06)',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, size }) => <Wrench size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          title: "Companion",
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
