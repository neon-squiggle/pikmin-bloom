import { fireEvent, render, screen } from "@testing-library/react";
import MushroomTypeField from "./MushroomTypeField";

it.each(["pink", "gray"])("keeps a partially typed %s search when focus is interrupted", (query) => {
  render(<MushroomTypeField variant="preset" value={null} onChange={jest.fn()} />);
  const input = screen.getByRole("combobox", { name: "Mushroom type" }) as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query.slice(0, 2) } });
  fireEvent.blur(input);
  fireEvent.focus(input);
  expect(input.value).toBe(query.slice(0, 2));
  fireEvent.change(input, { target: { value: query } });
  expect(screen.getByRole("option", { name: `Large ${query === "pink" ? "Pink" : "Gray"}` })).not.toBeNull();
});

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
