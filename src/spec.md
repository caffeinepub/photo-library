# Specification

## Summary
**Goal:** Add simple per-user photo albums (create/rename/delete, add/remove photos) with an Albums tab, album covers, and an album grid view while keeping photos in the main Library.

**Planned changes:**
- Extend the backend data model to store per-user albums as references to existing photo IDs (photos can be in multiple albums and always remain in the main library).
- Add backend APIs to create/rename/delete/list albums, add/remove one-or-more photo IDs to/from an album, and fetch an album’s photos with deterministic ordering and pagination compatible with the existing grid.
- Update backend upgrade/migration logic to preserve existing data and initialize album state empty on upgrade.
- Add an Albums tab in the authenticated UI to switch between Library and Albums (mobile-first, English text).
- Implement Albums UI: albums list/grid with cover thumbnail (derived from album contents) + name, empty placeholder cover when no photos, and create/rename/delete flows with basic delete confirmation.
- Implement Album detail view: open an album to see a paginated photo grid; add photos from the library to the album and remove photos from the album without deleting/moving them from the main Library.
- Create a project checkpoint named PHOTO_APP_STAGE_2_ALBUMS after end-to-end integration.

**User-visible outcome:** Signed-in users can switch to an Albums tab, create/rename/delete albums, open an album to see its photos in a grid, and add/remove photos to albums while the Library remains unchanged and complete.
