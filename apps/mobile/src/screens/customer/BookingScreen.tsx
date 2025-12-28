import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import ConfirmationScreen from "../../screens/ConfirmationScreen";
import CustomerInfoScreen from "../../screens/CustomerInfoScreen";
import SchedulerScreen from "../../screens/SchedulerScreen";
import ServiceDetailScreen from "../../screens/ServiceDetailScreen";
import { useBooking } from "../../state/bookingStore";
import { useCompanyStore } from "../../state/companyStore";

const ScreenWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
);

const BookingFlow: React.FC = () => {
  const navigation = useNavigation();
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
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
    if (!selectedCompany) {
      reset();
      navigation.navigate("CompanyPicker" as never);
    }
  }, [navigation, reset, selectedCompany]);

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
    if (!selectedService) {
      setStep("services");
      navigation.navigate("CompanyServices" as never);
      return;
    }

    if (step === "detail" && !selectedService) {
      reset();
      setStep("services");
    } else if (step === "schedule" && (!selectedService || !selectedDate)) {
      setStep("detail");
    } else if (step === "customer" && !hold) {
      setStep("schedule");
    }
  }, [hold, navigation, reset, selectedDate, selectedService, setStep, step]);

  if (
    !selectedService ||
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
          onBack={() => {
            setStep("services");
            navigation.navigate("CompanyServices" as never);
          }}
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
          navigation.navigate("CompanyServices" as never);
        }}
      />
    </ScreenWrapper>
  );
};

export default function BookingScreen() {
  return <BookingFlow />;
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
