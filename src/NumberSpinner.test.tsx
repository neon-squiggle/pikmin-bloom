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

it.each(["1.5", "-2", "words"])(
  "preserves invalid integer input for correction: %s",
  (raw) => {
    const onChange = jest.fn();
    render(
      <NumberSpinner
        label="Days"
        value={0}
        allowDecimal={false}
        min={0}
        onValueChange={onChange}
      />,
    );
    const input = screen.getByRole("textbox", {
      name: "Days",
    }) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: raw } });
    fireEvent.blur(input);
    expect(input.value).toBe(raw);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Enter a whole number.")).not.toBeNull();
    expect(
      Number.isNaN(onChange.mock.calls[onChange.mock.calls.length - 1][0]),
    ).toBe(true);
    fireEvent.change(input, { target: { value: "2" } });
    expect(onChange).toHaveBeenLastCalledWith(2);
  },
);
it("does not silently clamp an out-of-range countdown", () => {
  render(
    <NumberSpinner
      label="Hours"
      value={0}
      min={0}
      max={23}
      allowDecimal={false}
    />,
  );
  const input = screen.getByRole("textbox", {
    name: "Hours",
  }) as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "24" } });
  fireEvent.blur(input);
  expect(input.value).toBe("24");
  expect(screen.getByText("Enter 0–23.")).not.toBeNull();
});

it.each(["de-DE", "fr-FR", "ar-EG"])(
  "keeps localized values unchanged on focus and blur in %s",
  (locale) => {
    const change = jest.fn();
    const view = render(
      <NumberSpinner
        locale={locale}
        label="AP"
        value={1234}
        allowDecimal={false}
        onValueChange={change}
      />,
    );
    const input = screen.getByRole("textbox", { name: "AP" });
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(change).toHaveBeenLastCalledWith(1234);
    expect(input.getAttribute("aria-invalid")).not.toBe("true");
    view.rerender(
      <NumberSpinner
        locale={locale}
        label="AP"
        value={1.5}
        onValueChange={change}
      />,
    );
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(change).toHaveBeenLastCalledWith(1.5);
  },
);
