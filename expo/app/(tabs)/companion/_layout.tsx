import { Stack } from "expo-router";
import Colors from "@/constants/colors";
import CompanionErrorBoundary from "@/components/CompanionErrorBoundary";

export default function CompanionLayout() {
  return (
    <CompanionErrorBoundary>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
    </CompanionErrorBoundary>
  );
}
