import { fireEvent, render, screen } from "@testing-library/react";

import NumberSpinner from "./NumberSpinner";

describe("NumberSpinner", () => {
  it("keeps a formatted integer valid and editable after repeated edits", () => {
    const onValueChange = jest.fn();
    render(
      <NumberSpinner
        label="Battle AP"
        value={2}
        allowDecimal={false}
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: "Battle AP",
    }) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.blur(input);

    expect(input.value).toBe("123,456");
    expect(input.validity.valid).toBe(true);
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(false);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "789012" } });
    fireEvent.blur(input);

    expect(input.value).toBe("789,012");
    expect(input.validity.valid).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith(789012);
  });

  it.each([
    [false, "numeric"],
    [true, "decimal"],
  ])(
    "uses the %s decimal setting without conflicting native validation",
    (allowDecimal, inputMode) => {
      render(
        <NumberSpinner
          label="Numeric value"
          value={1234.5}
          allowDecimal={allowDecimal}
        />,
      );

      const input = screen.getByRole("textbox", {
        name: "Numeric value",
      }) as HTMLInputElement;

      expect(input.inputMode).toBe(inputMode);
      expect(input.autocomplete).toBe("off");
      expect(input.hasAttribute("pattern")).toBe(false);
      expect(input.validity.valid).toBe(true);
    },
  );
});
