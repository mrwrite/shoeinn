import React from "react";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

import { RewardsCard } from "./ui/RewardsCard";

const renderer = require("react-test-renderer");
const { act } = renderer;

describe("RewardsCard", () => {
  it("renders static membership copy without requiring backend rewards data", () => {
    let tree: { toJSON: () => unknown } | undefined;

    act(() => {
      tree = renderer.create(
        <RewardsCard title="ShoeInn Care Club" subtitle="Premium care, pickup, and delivery" value="Member" />,
      );
    });

    const output = JSON.stringify(tree?.toJSON());
    expect(output).toContain("ShoeInn Care Club");
    expect(output).toContain("Premium care, pickup, and delivery");
    expect(output).toContain("Member");
  });
});
