import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilePickerButton from "./FilePickerButton";

it.each(["{enter}", " "])(
  "opens the native file chooser from keyboard activation %s",
  (key) => {
    render(
      <FilePickerButton inputLabel="Choose files" onFiles={jest.fn()}>
        Import
      </FilePickerButton>,
    );
    const input = screen.getByLabelText("Choose files");
    const click = jest
      .spyOn(input as HTMLInputElement, "click")
      .mockImplementation(() => {});
    userEvent.tab();
    expect(screen.getByRole("button", { name: "Import" })).toHaveFocus();
    userEvent.keyboard(key);
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  },
);
