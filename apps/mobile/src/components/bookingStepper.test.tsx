import React from "react";

import { BookingStepper } from "./ui/BookingStepper";

const renderer = require("react-test-renderer");
const { act } = renderer;

describe("BookingStepper", () => {
  it("renders booking step labels", () => {
    let tree: { toJSON: () => unknown } | undefined;

    act(() => {
      tree = renderer.create(
        <BookingStepper
          currentIndex={2}
          steps={[
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            { key: "details", label: "Details" },
            { key: "pay", label: "Pay" },
          ]}
        />,
      );
    });

    const output = JSON.stringify(tree?.toJSON());
    expect(output).toContain("Date");
    expect(output).toContain("Time");
    expect(output).toContain("Details");
    expect(output).toContain("Pay");
  });
});
