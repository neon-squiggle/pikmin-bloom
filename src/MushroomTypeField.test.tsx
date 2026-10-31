import { fireEvent, render, screen } from "@testing-library/react";
import MushroomTypeField from "./MushroomTypeField";

it("offers generic Event presets without adding Halloween suggestions from screenshots", () => {
  render(
    <MushroomTypeField
      value=""
      onChange={jest.fn()}
      types={["Giant Halloween Mushroom"]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open" }));
  expect(
    screen.getByRole("option", { name: "Giant Event Mushroom" }),
  ).not.toBeNull();
  expect(
    screen.queryByRole("option", { name: "Giant Halloween Mushroom" }),
  ).toBeNull();
});
