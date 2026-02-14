# Specification

## Summary
**Goal:** Build a mobile-first, per-user private photo library where authenticated users can upload, view, paginate through, and delete their own photos.

**Planned changes:**
- Add Internet Identity authentication (sign in/sign out) and gate all gallery screens behind auth.
- Implement a single Motoko main actor backend with per-user photo storage keyed by caller Principal (list/fetch/delete restricted to owner).
- Add backend APIs for multi-image upload, newest-first listing with pagination/cursor, and secure fetch/delete by photo id.
- Build a minimal mobile-first Home screen with newest-first photo grid, pagination/infinite-scroll style loading, and an Upload button for multi-select.
- Add a full-screen photo viewer with next/previous navigation and a Delete action that updates viewer flow and the grid immediately.
- Apply a coherent minimal visual theme (colors/typography/spacing) and keep UI fast and simple with English-only messages, including basic upload error feedback.

**User-visible outcome:** Users can sign in with Internet Identity to access a private photo grid, upload multiple images that appear immediately at the top, open photos in a full-screen viewer with next/prev navigation, and delete photos so they disappear from both the viewer and the grid.
