import { fireEvent, within } from "@testing-library/react";

// Exercise MUI's visible section editing, rather than its legacy text input.
export const setDateField = (field: HTMLElement, value: string) => {
  const section = within(field).getAllByRole("spinbutton")[0];
  fireEvent.focus(section);
  fireEvent.paste(section, { clipboardData: { getData: () => value } });
};
export const readDateField = (field: HTMLElement) =>
  (within(field).getByRole("textbox", { hidden: true }) as HTMLInputElement).value;
