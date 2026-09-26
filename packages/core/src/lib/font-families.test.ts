import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compareFontStyles,
  groupFontsByFamily,
  parseFamilyQueryParams,
} from "./font-families";
import type { FontFile } from "@typefolio/core/types";

function makeFont(overrides: Partial<FontFile> & Pick<FontFile, "id">): FontFile {
  return {
    id: overrides.id,
    originalName: overrides.originalName ?? `${overrides.id}.ttf`,
    storedName: overrides.storedName ?? `${overrides.id}.ttf`,
    sha256: overrides.sha256 ?? "abc",
    size: overrides.size ?? 1000,
    extension: overrides.extension ?? ".ttf",
    uploadedAt: overrides.uploadedAt ?? "2026-01-01T00:00:00.000Z",
    familyName: overrides.familyName ?? "Unknown",
    styleName: overrides.styleName,
    weight: overrides.weight,
    postscriptName: overrides.postscriptName,
  };
}

describe("compareFontStyles", () => {
  it("sorts by weight then style name", () => {
    const regular = makeFont({
      id: "1",
      familyName: "Inter",
      styleName: "Regular",
      weight: 400,
    });
    const bold = makeFont({
      id: "2",
      familyName: "Inter",
      styleName: "Bold",
      weight: 700,
    });

    assert.equal(compareFontStyles(regular, bold) < 0, true);
    assert.equal(compareFontStyles(bold, regular) > 0, true);
  });
});

describe("groupFontsByFamily", () => {
  it("groups fonts and sorts families alphabetically", () => {
    const fonts = [
      makeFont({
        id: "1",
        familyName: "Helvetica Neue",
        styleName: "Bold",
        weight: 700,
      }),
      makeFont({
        id: "2",
        familyName: "Inter",
        styleName: "Regular",
        weight: 400,
      }),
      makeFont({
        id: "3",
        familyName: "Inter",
        styleName: "Bold",
        weight: 700,
      }),
    ];

    const groups = groupFontsByFamily(fonts);

    assert.equal(groups.length, 2);
    assert.equal(groups[0].familyName, "Helvetica Neue");
    assert.equal(groups[1].familyName, "Inter");
    assert.equal(groups[1].styleCount, 2);
    assert.equal(groups[1].fonts[0].styleName, "Regular");
    assert.equal(groups[1].fonts[1].styleName, "Bold");
  });

  it("places fonts without family metadata in Unknown", () => {
    const fonts = [
      makeFont({ id: "1", familyName: "" }),
      makeFont({ id: "2", familyName: "Inter", styleName: "Regular" }),
    ];

    const groups = groupFontsByFamily(fonts);
    const unknown = groups.find((group) => group.familyName === "Unknown");

    assert.ok(unknown);
    assert.equal(unknown.styleCount, 1);
  });

  it("sorts families by most recent upload when requested", () => {
    const fonts = [
      makeFont({
        id: "1",
        familyName: "Older",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      }),
      makeFont({
        id: "2",
        familyName: "Newer",
        uploadedAt: "2026-02-01T00:00:00.000Z",
      }),
    ];

    const groups = groupFontsByFamily(fonts, {
      sortBy: "uploadedAt",
      order: "desc",
    });

    assert.equal(groups[0].familyName, "Newer");
    assert.equal(groups[1].familyName, "Older");
  });
});

describe("parseFamilyQueryParams", () => {
  it("defaults to family asc", () => {
    const params = parseFamilyQueryParams(new URLSearchParams());
    assert.deepEqual(params, { sort: "family", order: "asc" });
  });

  it("parses uploadedAt desc", () => {
    const params = parseFamilyQueryParams(
      new URLSearchParams("sort=uploadedAt&order=desc"),
    );
    assert.deepEqual(params, { sort: "uploadedAt", order: "desc" });
  });
});
