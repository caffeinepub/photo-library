# Specification

## Summary
**Goal:** Ensure photo uploads never overwrite previously stored photos, and improve the upload flow with an accumulating pre-upload preview.

**Planned changes:**
- Backend: Update `uploadMultiplePhotos` to append newly uploaded photos to the caller’s existing stored photo list (no replacement/removal), while maintaining strict per-user scoping.
- Backend: Ensure `getAllPhotosPaginated` returns photos newest-first, including newly uploaded photos at the top, while retaining older photos.
- Frontend: Change photo selection so multiple file-picker selections accumulate into a single “pending upload” list rather than replacing previous selections.
- Frontend: Display thumbnail previews for all pending photos (including those selected in earlier picker sessions) and show a clear pending count in a mobile-first minimal UI (English text).
- Frontend/Backend flow: Upload action uploads only the current pending selection; on success clear pending previews; on failure keep pending previews for retry; gallery remains unchanged except for newly added photos.

**User-visible outcome:** Users can select photos multiple times, see all pending thumbnails before uploading, and upload to add photos to their existing gallery without any previously uploaded photos disappearing.
