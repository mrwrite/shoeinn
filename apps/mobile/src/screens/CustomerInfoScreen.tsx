import { useAuthStore } from "../state/authStore";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { cancelAppointmentPayment, confirmAppointment, refreshAppointmentPayment } from "../api/http";
import { useBooking } from "../state/bookingStore";
import { useCompanyStore } from "../state/companyStore";
import type { Appointment } from "../types/booking";

interface Props {
  onConfirmed: () => void;
  onBack: () => void;
}

const CustomerInfoScreen: React.FC<Props> = ({ onConfirmed, onBack }) => {
  const fullName = useAuthStore((s) => s.fullName);
  const authEmail = useAuthStore((s) => s.email);

  React.useEffect(() => {
    if (fullName) setName(fullName);
    if (authEmail) setEmail(authEmail);
  }, [fullName, authEmail]);

  const nameLocked = Boolean(fullName);
  const emailLocked = Boolean(authEmail);

  const { hold, setAppointment } = useBooking();
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [servicePaymentAppointment, setServicePaymentAppointment] = React.useState<Appointment | null>(null);
  const [servicePaymentBusy, setServicePaymentBusy] = React.useState(false);

  const handleSubmit = async () => {
    if (!hold || !name || !phone || !selectedCompany) {
      return;
    }
    setSubmitting(true);
    try {
      const appointment = await confirmAppointment({
        hold_id: hold.id,
        company_id: selectedCompany.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        idempotencyKey: `app-${Date.now()}`,
      });
      console.log("[Booking] Appointment created", appointment.id);
      setAppointment(appointment);

      const paymentMode = appointment.payment_mode ?? "mock";
      const paymentStatus = appointment.payment_status ?? "pending";
      if (paymentMode === "mock" || paymentStatus === "succeeded") {
        onConfirmed();
        return;
      }

      if (paymentMode === "service") {
        setServicePaymentAppointment(appointment);
        return;
      }
    } catch (error: any) {
      console.warn("[Booking] Confirmation failed", error);
      Alert.alert(
        "Confirmation failed",
        error?.message ?? "Unable to confirm appointment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openCheckout = React.useCallback(async () => {
    if (!servicePaymentAppointment?.payment_checkout_url) {
      Alert.alert("Checkout unavailable", "This booking does not have a checkout URL.");
      return;
    }
    try {
      await Linking.openURL(servicePaymentAppointment.payment_checkout_url);
    } catch (error) {
      console.warn("[Booking] Unable to open checkout", error);
      Alert.alert("Unable to open checkout", "Please try again.");
    }
  }, [servicePaymentAppointment]);

  const refreshPayment = React.useCallback(async () => {
    if (!servicePaymentAppointment) {
      return;
    }
    setServicePaymentBusy(true);
    try {
      const latest = await refreshAppointmentPayment(servicePaymentAppointment.id);
      setAppointment(latest);
      setServicePaymentAppointment(latest);

      if (latest.payment_status === "succeeded") {
        onConfirmed();
        return;
      }
      if (latest.status === "cancelled" || latest.payment_status === "failed") {
        Alert.alert("Payment incomplete", latest.payment_message ?? "This booking was not paid.");
        return;
      }
      Alert.alert("Still waiting on payment", latest.payment_message ?? "Complete checkout, then check payment status again.");
    } catch (error: any) {
      console.warn("[Booking] Payment refresh failed", error);
      Alert.alert("Unable to refresh payment", error?.message ?? "Please try again.");
    } finally {
      setServicePaymentBusy(false);
    }
  }, [onConfirmed, servicePaymentAppointment, setAppointment]);

  const cancelServicePayment = React.useCallback(async () => {
    if (!servicePaymentAppointment) {
      return;
    }
    setServicePaymentBusy(true);
    try {
      const latest = await cancelAppointmentPayment(servicePaymentAppointment.id);
      setAppointment(latest);
      setServicePaymentAppointment(null);
      Alert.alert("Booking canceled", "Your unpaid booking was canceled.");
      onBack();
    } catch (error: any) {
      console.warn("[Booking] Payment cancellation failed", error);
      Alert.alert("Unable to cancel booking", error?.message ?? "Please try again.");
    } finally {
      setServicePaymentBusy(false);
    }
  }, [onBack, servicePaymentAppointment, setAppointment]);

  if (!hold) {
    return (
      <View style={styles.center}>
        <Text>No hold found. Please start over.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (servicePaymentAppointment) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.heading}>Complete payment</Text>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Secure checkout required</Text>
          <Text style={styles.paymentBody}>
            {servicePaymentAppointment.payment_message ?? "Open checkout to complete payment for this booking."}
          </Text>
          {selectedCompany ? (
            <Text style={styles.paymentMeta}>Company: {selectedCompany.name}</Text>
          ) : null}
          <Text style={styles.paymentMeta}>
            Status: {(servicePaymentAppointment.payment_status ?? "pending").replace("_", " ")}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, servicePaymentBusy && styles.disabledButton]}
          onPress={openCheckout}
          disabled={servicePaymentBusy}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Open secure checkout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, servicePaymentBusy && styles.disabledButton]}
          onPress={refreshPayment}
          disabled={servicePaymentBusy}
          accessibilityRole="button"
        >
          {servicePaymentBusy ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.secondaryText}>Check payment status</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostButton, servicePaymentBusy && styles.disabledButton]}
          onPress={cancelServicePayment}
          disabled={servicePaymentBusy}
          accessibilityRole="button"
        >
          <Text style={styles.ghostText}>Cancel unpaid booking</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          After paying in Stripe Checkout, ShoeInn should reopen automatically when supported. If it does not, return to the app and check payment status.
        </Text>
      </KeyboardAvoidingView>
    );
  }

  const disabled = submitting || !name || !phone;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>← Choose another time</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Your details</Text>
      <TextInput
        style={[styles.input, nameLocked && styles.lockedInput]}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        accessibilityLabel="Full name"
        editable={!nameLocked}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        accessibilityLabel="Phone number"
      />
      <TextInput
        style={[styles.input, emailLocked && styles.lockedInput]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email"
        editable={!emailLocked}
      />
      <TouchableOpacity
        style={[styles.primaryButton, disabled && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={disabled}
        accessibilityRole="button"
      >
        {submitting ? (
          <ActivityIndicator color="#f9fafb" />
        ) : (
          <Text style={styles.buttonText}>Confirm appointment</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.helperText}>
        Demo and staging environments may simulate payment after confirmation.
      </Text>
    </KeyboardAvoidingView>
  );
};

export default CustomerInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  back: {
    color: "#2563eb",
    fontWeight: "600",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "700",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  helperText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  paymentCard: {
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 8,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  paymentBody: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
  },
  paymentMeta: {
    color: "#6b7280",
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "600",
  },
  ghostButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  ghostText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  lockedInput: {
  backgroundColor: "#f3f4f6",
  color: "#111827",
  opacity: 0.9,
},

});
