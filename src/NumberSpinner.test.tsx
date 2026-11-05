import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import NumberSpinner from "./NumberSpinner";

describe("NumberSpinner", () => {
  it("allows deleting and replacing individual digits after grouped formatting", () => {
    const Field = () => {
      const [value, setValue] = useState<number | null>(123456);
      return <>
        <NumberSpinner label="Health" value={value} allowDecimal={false} onValueChange={setValue} />
        <output aria-label="Current health">{String(value)}</output>
      </>;
    };
    render(<Field />);
    const input = screen.getByRole("textbox", { name: "Health" }) as HTMLInputElement;
    expect(input.value).toBe("123,456");
    userEvent.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    userEvent.type(input, "{backspace}", { skipClick: true });
    expect(screen.getByLabelText("Current health").textContent).toBe("12345");
    expect(input.getAttribute("aria-invalid")).not.toBe("true");
    userEvent.tab();
    expect(input.value).toBe("12,345");

    userEvent.click(input);
    input.setSelectionRange(2, 3);
    userEvent.type(input, "9", { skipClick: true });
    expect(screen.getByLabelText("Current health").textContent).toBe("12945");
    userEvent.tab();
    expect(input.value).toBe("12,945");
  });

  it("keeps the focus selection available for replacing a formatted value", () => {
    const onChange = jest.fn();
    render(<NumberSpinner label="AP" value={123456} allowDecimal={false} onValueChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "AP" }) as HTMLInputElement;
    userEvent.click(input);
    userEvent.type(input, "42", { skipClick: true });
    expect(input.value).toBe("42");
    expect(onChange).toHaveBeenLastCalledWith(42);
  });

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
    fireEvent.focus(input);
    expect(input.value).toBe(raw);
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

it.each(["en-US", "de-DE", "fr-FR", "hi-IN", "ar-EG"])(
  "allows individual edits with localized grouping and decimals in %s",
  (locale) => {
    const onChange = jest.fn();
    const formatted = (value: number, useGrouping = true) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: 3, useGrouping }).format(value);
    const view = render(<NumberSpinner locale={locale} label="AP" value={1234567}
      allowDecimal={false} onValueChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "AP" }) as HTMLInputElement;
    expect(input.value).toBe(formatted(1234567));
    userEvent.click(input);
    expect(input.value).toBe(formatted(1234567, false));
    input.setSelectionRange(input.value.length, input.value.length);
    userEvent.type(input, "{backspace}", { skipClick: true });
    expect(onChange).toHaveBeenLastCalledWith(123456);
    userEvent.tab();
    expect(input.value).toBe(formatted(123456));

    view.rerender(<NumberSpinner locale={locale} label="AP" value={1234.5}
      onValueChange={onChange} />);
    userEvent.click(input);
    expect(input.value).toBe(formatted(1234.5, false));
    input.setSelectionRange(input.value.length, input.value.length);
    userEvent.type(input, "7", { skipClick: true });
    expect(onChange).toHaveBeenLastCalledWith(1234.57);
    userEvent.tab();
    expect(input.value).toBe(formatted(1234.57));
  },
);

it("keeps read-only numbers grouped when focused", () => {
  render(<NumberSpinner label="Calculated health" value={1234567} readOnly />);
  const input = screen.getByRole("textbox", { name: "Calculated health" }) as HTMLInputElement;
  fireEvent.focus(input);
  expect(input.value).toBe("1,234,567");
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
