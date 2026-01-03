import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminCompaniesScreen from "../screens/admin/AdminCompaniesScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";

export type AdminStackParamList = {
  AdminCompanies: undefined;
  AdminUsers: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminCompanies" component={AdminCompaniesScreen} options={{ title: "Companies" }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: "Users" }} />
    </Stack.Navigator>
  );
}
