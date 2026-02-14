# Specification

## Summary
**Goal:** Add fast local search on the Home screen, support editable per-photo captions, and ship a generated cartoon old-camera favicon.

**Planned changes:**
- Backend: extend the photo data model to persist an optional caption per photo (per user) and return it via existing photo list/get APIs.
- Backend: add an authenticated API to set/clear a caption for a caller-owned photo, preserving existing ordering and album membership; include upgrade/migration handling if needed so existing photos initialize with no caption.
- Frontend: add a caption field to the full-screen photo viewer to view/edit/save the current photo’s caption with loading and error states; update/invalidate cached photo data so captions are reflected elsewhere.
- Frontend: add a Home header search input that locally filters already-loaded data (Library: by caption + filename/name when available; Albums: by album name), case-insensitive, and restores results when cleared.
- Frontend: add a generated cartoonish old-camera favicon as a static asset and reference it from the app HTML.
- Docs: create checkpoint file `frontend/PHOTO_APP_STAGE_3_SEARCH.checkpoint.md` summarizing Search + Captions + Favicon and any API additions.

**User-visible outcome:** Users can edit captions in the full-screen viewer, and quickly search/filter their already-loaded photos and albums on Home; the app also displays a cartoon old-camera favicon in the browser tab.
