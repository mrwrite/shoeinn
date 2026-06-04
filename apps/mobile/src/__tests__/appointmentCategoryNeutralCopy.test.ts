import {
  customerAppointmentNextStepCopy,
  customerAppointmentStatusLabels,
  getReadableAppointmentStatus,
} from "../features/appointmentCopy";

describe("category-neutral appointment copy", () => {
  it("uses care/order language for active lifecycle statuses", () => {
    expect(customerAppointmentStatusLabels.cleaning).toBe("In care");
    expect(customerAppointmentStatusLabels.ready).toBe("Ready for return");
    expect(customerAppointmentNextStepCopy.cleaning).toBe("Your items are currently in care.");
    expect(customerAppointmentNextStepCopy.ready).toBe("Your order is ready for return.");
  });

  it("formats shared appointment status badges without shoe-only or cleaning-only wording", () => {
    expect(getReadableAppointmentStatus("cleaning")).toBe("In care");
    expect(getReadableAppointmentStatus("ready")).toBe("Ready for return");
    expect(getReadableAppointmentStatus("out_for_delivery")).toBe("Out for delivery");
  });
});
