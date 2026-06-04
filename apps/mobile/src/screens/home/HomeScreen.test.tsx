import React from "react";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: (props: any) => <View {...props} />,
  };
});

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  __mockNavigation: {
    navigate: jest.fn(),
    parentNavigate: jest.fn(),
  },
  useNavigation: () => {
    const mockNavigation = require("@react-navigation/native").__mockNavigation;
    return {
      navigate: mockNavigation.navigate,
      getParent: () => ({
        navigate: mockNavigation.parentNavigate,
      }),
    };
  },
}));

jest.mock("../../api/http", () => ({
  listCareCategories: jest.fn(),
  listCompanies: jest.fn(),
  getMyAppointments: jest.fn(),
  getAppointmentAssignment: jest.fn(),
}));

jest.mock("../../auth/demoLogins", () => ({
  shouldShowDemoLogins: () => false,
  getDemoMarketDiscoveryLocation: () => ({
    label: "Nearby",
    city: null,
    state: "TN",
  }),
}));

jest.mock("../../hooks/useCityState", () => ({
  useCityState: () => ({
    city: "Nashville",
    state: "TN",
    loading: false,
  }),
}));

jest.mock("../../state/authStore", () => ({
  useAuthStore: (selector: (state: { fullName: string | null; token: string | null }) => unknown) =>
    selector({ fullName: "Anthony Davis", token: "token-1" }),
}));

import { useQuery } from "@tanstack/react-query";

import HomeScreen from "./HomeScreen";

const renderer = require("react-test-renderer");
const { act } = renderer;

function renderComponent(element: React.ReactElement) {
  let tree: any;
  act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

describe("HomeScreen", () => {
  beforeEach(() => {
    (useQuery as any).mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
      const key = String(queryKey[0]);
      if (key === "care-categories") {
        return {
          data: [
            { id: "shoes", slug: "shoes", name: "Shoes", icon_key: "footprints", is_active: true, display_order: 1 },
            { id: "laundry", slug: "laundry", name: "Laundry", icon_key: "shirt", is_active: true, display_order: 2 },
          ],
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      if (key === "companies") {
        return {
          data: [
            {
              id: "company-1",
              name: "The Shoe Lounge",
              city: "Nashville",
              state: "TN",
              offered_categories: [{ id: "shoes", slug: "shoes", name: "Shoes", icon_key: "footprints" }],
            },
            {
              id: "company-2",
              name: "Pristine Cleaners",
              city: "Nashville",
              state: "TN",
              offered_categories: [
                { id: "dry-cleaning", slug: "dry-cleaning", name: "Dry Cleaning", icon_key: "sparkles" },
                { id: "laundry", slug: "laundry", name: "Laundry", icon_key: "shirt" },
              ],
            },
          ],
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      if (key === "my-appointments") {
        return {
          data: [
            {
              id: "appointment-1",
              customer_name: "Anthony Davis",
              customer_phone: "555-0101",
              service_id: "service-1",
              service_name: "Sneaker Deep Clean",
              category_id: "shoes",
              category_slug: "shoes",
              category_name: "Shoes",
              category_icon_key: "footprints",
              start_time: "2025-05-24T15:00:00.000Z",
              status: "confirmed",
              payment_status: "succeeded",
              payment_mode: "service",
              payment_checkout_url: null,
              payment_message: null,
            },
          ],
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      if (key === "appointment-assignment") {
        return {
          data: { provider_name: "The Shoe Lounge" },
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }

      return { data: [], isLoading: false, isError: false, refetch: jest.fn() };
    });
  });

  it("renders the luxury marketplace home screen and booking CTA", () => {
    const tree = renderComponent(<HomeScreen />);
    const output = JSON.stringify(tree.toJSON());

    expect(output).toContain("ShoeInn");
    expect(output).toContain("Good Morning, ");
    expect(output).toContain("Anthony");
    expect(output).toContain("What needs care today?");
    expect(output).toContain("Trusted local providers");
    expect(output).toContain("The Shoe Lounge");
    expect(output).toContain("Sneaker Deep Clean");
    expect(output).toContain("Active appointment");
  });

  it("preserves the book a service navigation CTA", () => {
    const tree = renderComponent(<HomeScreen />);
    const bookButton = tree.root.findByProps({ accessibilityLabel: "Book a Service" });
    const navigation = require("@react-navigation/native").__mockNavigation;

    act(() => {
      bookButton.props.onPress();
    });

    expect(navigation.navigate.mock.calls[0][0]).toBe("ProviderMenu");
    expect(navigation.navigate.mock.calls[0][1].company.id).toBe("company-1");
    expect(navigation.navigate.mock.calls[0][1].categorySlug).toBe(null);
    expect(navigation.navigate.mock.calls[0][1].categoryName).toBe(null);
  });
});
