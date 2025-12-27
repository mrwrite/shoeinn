import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ConfirmationScreen from "../../screens/ConfirmationScreen";
import CustomerInfoScreen from "../../screens/CustomerInfoScreen";
import SchedulerScreen from "../../screens/SchedulerScreen";
import ServiceDetailScreen from "../../screens/ServiceDetailScreen";
import ServicesListScreen from "../../screens/ServicesListScreen";
import { BookingProvider, useBooking } from "../../state/bookingStore";

const ScreenWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
);

const BookingFlow: React.FC = () => {
  const {
    step,
    selectedService,
    selectedDate,
    hold,
    setStep,
    setService,
    setDate,
    setStartTime,
    setHold,
    setAppointment,
    reset,
  } = useBooking();

  useEffect(() => {
    console.log("[UI] Step", step);
  }, [step]);

  useEffect(() => {
    (async () => {
      const { API_URL } = await import("../../api/http");
      console.log("🔎 Using API_URL:", API_URL);
      try {
        const res = await fetch(`${API_URL}/health`);
        console.log("🔎 /health status:", res.status);
      } catch (error: any) {
        console.log("🔎 /health ERROR:", error?.message ?? error);
      }
    })();
  }, []);

  useEffect(() => {
    if (step === "detail" && !selectedService) {
      reset();
      setStep("services");
    } else if (step === "schedule" && (!selectedService || !selectedDate)) {
      setStep("detail");
    } else if (step === "customer" && !hold) {
      setStep("schedule");
    }
  }, [step, selectedService, selectedDate, hold, reset, setStep]);

  if (
    (step === "detail" && !selectedService) ||
    (step === "schedule" && (!selectedService || !selectedDate)) ||
    (step === "customer" && !hold)
  ) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </ScreenWrapper>
    );
  }

  if (step === "services") {
    return (
      <ScreenWrapper>
        <ServicesListScreen
          onSelect={(service) => {
            setService(service);
            setDate(undefined);
            setStartTime(undefined);
            setHold(undefined);
            setAppointment(undefined);
            setStep("detail");
          }}
        />
      </ScreenWrapper>
    );
  }

  if (step === "detail" && selectedService) {
    return (
      <ScreenWrapper>
        <ServiceDetailScreen
          service={selectedService}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setDate(date);
          }}
          onContinue={() => setStep("schedule")}
          onBack={() => setStep("services")}
        />
      </ScreenWrapper>
    );
  }

  if (step === "schedule" && selectedService && selectedDate) {
    return (
      <ScreenWrapper>
        <SchedulerScreen onHoldCreated={() => setStep("customer")} onBack={() => setStep("detail")} />
      </ScreenWrapper>
    );
  }

  if (step === "customer") {
    return (
      <ScreenWrapper>
        <CustomerInfoScreen onConfirmed={() => setStep("confirmation")} onBack={() => setStep("schedule")} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ConfirmationScreen
        onDone={() => {
          reset();
          setStep("services");
        }}
      />
    </ScreenWrapper>
  );
};

export default function BookingScreen() {
  return (
    <BookingProvider>
      <BookingFlow />
    </BookingProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
