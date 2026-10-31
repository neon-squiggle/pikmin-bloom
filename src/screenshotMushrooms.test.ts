import {
  getScreenshotEndTime,
  screenshotMushrooms,
  sortByScreenshotEndTime,
} from "./testFixtures/screenshotMushrooms";

describe("screenshot end times", () => {
  it("adds each captured countdown to the original capture instant", () => {
    expect(
      screenshotMushrooms.map((mushroom) =>
        getScreenshotEndTime(mushroom).toISOString(),
      ),
    ).toEqual([
      "2026-11-01T18:34:45.000Z",
      "2026-11-02T02:04:43.000Z",
      "2026-11-04T10:58:21.000Z",
      "2026-11-04T10:35:07.000Z",
      "2026-11-06T14:08:45.000Z",
    ]);
  });

  it("sorts by finish instant, including the two November 4 mushrooms", () => {
    expect(
      sortByScreenshotEndTime(screenshotMushrooms).map(({ id }) => id),
    ).toEqual(["IMG_4082", "IMG_4083", "IMG_4085", "IMG_4084", "IMG_4086"]);
    expect(screenshotMushrooms[2].id).toBe("IMG_4084");
  });
});
