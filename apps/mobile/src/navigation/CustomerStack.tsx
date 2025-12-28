import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingScreen from "../screens/customer/BookingScreen";
import CompanyPickerScreen from "../screens/customer/CompanyPickerScreen";
import CompanyServicesScreen from "../screens/customer/CompanyServicesScreen";
import { BookingProvider } from "../state/bookingStore";

export type CustomerStackParamList = {
  CompanyPicker: undefined;
  CompanyServices: undefined;
  Booking: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerStack() {
  return (
    <BookingProvider>
      <Stack.Navigator initialRouteName="CompanyPicker">
        <Stack.Screen name="CompanyPicker" component={CompanyPickerScreen} options={{ headerShown: true }} />
        <Stack.Screen name="CompanyServices" component={CompanyServicesScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </BookingProvider>
  );
}
