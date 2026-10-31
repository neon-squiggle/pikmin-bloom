import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import SectionAccordion from "./SectionAccordion";
it("links each disclosure header to its named content region without nested headings", () => {
  render(<><SectionAccordion title="Settings">Preferences</SectionAccordion><SectionAccordion title="Additional players">Join time</SectionAccordion></>);
  for (const name of ["Settings", "Additional players"]) {
    const header = screen.getByRole("button", { name });
    fireEvent.click(header);
    const region = screen.getByRole("region", { name });
    expect(header).toHaveAttribute("aria-controls", region.id);
    expect(region).toHaveAttribute("aria-labelledby", header.id);
    expect(screen.getAllByRole("heading", { name })).toHaveLength(1);
  }
});
