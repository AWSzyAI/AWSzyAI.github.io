# Apple Watch display asset

The homepage uses Apple’s own Apple Watch Series 11 artwork rather than a drawn device illustration.

- Official catalog: https://developer.apple.com/design/resources/#product-bezels
- Public source sprite: https://developer.apple.com/design/resources/images/thumbnails/Thumbnail-Bezel-AW-Series11_2x.png
- Local, byte-for-byte source: `apple-watch-series-11-bezels.png` (2046 × 1248 RGBA).
- The complete right-hand device is selected at `(1216, 184, 568, 888)`. The catalog sprite includes a neutral RGBA `(127,127,127,171)` preview matte. `watch-display.js` reverses that matte once in memory, preserving the original opaque product pixels and antialiased edges. The stored source is unchanged. No part of the product silhouette is cut off.
- The device stays front-facing with its original colors and proportions. Only the original screen UI changes over time; there is no product rotation, tint, added reflection or product shadow.
- The UI uses the page’s existing sample clock, state features and qualitative future scenario. It is a design exploration, not an existing App Store listing, a live wearable connection, a validated attention measure or a clinical forecast. The watch does not measure EEG; EEG remains a separate input.
- Apple product artwork is not covered by this repository’s code license or the brain mesh’s CC BY-SA license. Relevant Apple terms: https://developer.apple.com/app-store/marketing/guidelines/. The public catalog sprite is the asset used here; the separate downloadable disk-image agreement has not been accepted on the owner’s behalf. Any future App Store marketing deployment must independently meet Apple’s applicable usage terms.

Apple and Apple Watch are trademarks of Apple Inc., registered in the U.S. and other countries.
