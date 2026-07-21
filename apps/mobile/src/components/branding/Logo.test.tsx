import React from "react";
// @ts-expect-error The current Jest renderer dependency does not ship TypeScript declarations.
import renderer, { act } from "react-test-renderer";

import { Logo } from "./Logo";

describe("Logo", () => {
  it("exposes one useful accessible brand name", () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<Logo layout="horizontal" tone="brand" size={40} />);
    });

    expect(tree!.root.findByProps({ accessibilityLabel: "Skruhb" })).toBeTruthy();
  });

  it("can be marked decorative", () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<Logo layout="symbol" tone="light" decorative />);
    });

    expect(tree!.root.findByProps({ importantForAccessibility: "no" })).toBeTruthy();
  });
});
