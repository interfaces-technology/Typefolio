import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractFontMetadata } from "./font-metadata";

describe("extractFontMetadata filename fallback", () => {
  it("parses family and style from hyphenated filenames", () => {
    const metadata = extractFontMetadata(
      Buffer.from("not-a-font"),
      "Inter-Bold.ttf",
    );

    assert.equal(metadata.familyName, "Inter");
    assert.equal(metadata.styleName, "Bold");
    assert.equal(metadata.weight, 700);
  });

  it("parses italic style tokens", () => {
    const metadata = extractFontMetadata(
      Buffer.from("not-a-font"),
      "HelveticaNeue-BoldItalic.otf",
    );

    assert.equal(metadata.familyName, "Helvetica Neue");
    assert.equal(metadata.styleName, "Bold Italic");
    assert.equal(metadata.weight, 700);
  });

  it("returns Unknown for empty filenames", () => {
    const metadata = extractFontMetadata(Buffer.from("not-a-font"), ".ttf");
    assert.equal(metadata.familyName, "Unknown");
  });
});
