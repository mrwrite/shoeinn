import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingScreen from "../screens/customer/BookingScreen";

export type CustomerStackParamList = {
  Booking: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
