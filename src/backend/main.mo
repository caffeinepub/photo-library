import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

// Specify the migration module in a with-clause
(with migration = Migration.run)
actor {
  // Initialize the authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module Photo {
    public type Photo = {
      id : Text;
      blob : Storage.ExternalBlob;
      name : Text;
      createdAt : Time.Time;
      caption : ?Text;
    };

    public func compareByCreatedAt(photo1 : Photo, photo2 : Photo) : Order.Order {
      if (photo1.createdAt < photo2.createdAt) { #less } else if (photo1.createdAt > photo2.createdAt) {
        #greater;
      } else { #equal };
    };
  };

  type Photo = Photo.Photo;

  type InternalAlbum = {
    id : Text;
    name : Text;
    photoIds : List.List<Text>;
    coverPhotoId : ?Text;
  };

  type SharedAlbum = {
    id : Text;
    name : Text;
    photoIds : [Text];
    coverPhotoId : ?Text;
  };

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  // Persistent state
  let allPhotos = Map.empty<Principal, List.List<Photo>>();
  let albums = Map.empty<Principal, Map.Map<Text, InternalAlbum>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextId = 0;
  let pageSize = 36;

  // Internal references (legacy code compatibility)
  let photos = allPhotos;

  // Blob storage mixin retained for potential future use.
  include MixinStorage();

  // Helper functions
  func getUserAlbums(caller : Principal) : Map.Map<Text, InternalAlbum> {
    switch (albums.get(caller)) {
      case (?userAlbums) { userAlbums };
      case (null) { Map.empty<Text, InternalAlbum>() };
    };
  };

  func toSharedAlbum(internal : InternalAlbum) : SharedAlbum {
    { internal with photoIds = internal.photoIds.toArray() };
  };

  // Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    verifyUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    verifyOwnerOrAdmin(caller, user);
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    verifyUser(caller);
    userProfiles.add(caller, profile);
  };

  // Photo Management
  public shared ({ caller }) func uploadMultiplePhotos(newPhotos : [Photo]) : async () {
    verifyUser(caller);
    nextId += newPhotos.size();

    let newPhotosList = listFromArray(newPhotos);

    // Combine new and existing photos
    let combinedPhotos = switch (allPhotos.get(caller)) {
      case (?existingPhotos) {
        let existingArray = existingPhotos.toArray();
        let newArray = newPhotosList.toArray();
        listFromArray(existingArray.concat(newArray));
      };
      case (null) { newPhotosList };
    };

    allPhotos.add(caller, combinedPhotos);
  };

  func getUserPhotosById(caller : Principal, userId : Principal) : List.List<Photo> {
    verifyOwnerOrAdmin(caller, userId);
    switch (photos.get(userId)) {
      case (?userPhotos) { userPhotos };
      case (null) { List.empty<Photo>() };
    };
  };

  func verifyOwnerOrAdmin(caller : Principal, owner : Principal) {
    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Operation requires owner or admin privileges");
    };
  };

  func verifyUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  func getUserPhotos(caller : Principal) : List.List<Photo> {
    switch (photos.get(caller)) {
      case (?userPhotos) { userPhotos };
      case (null) { List.empty<Photo>() };
    };
  };

  func listFromArray(array : [Photo]) : List.List<Photo> {
    let list = List.empty<Photo>();
    for (item in array.values()) {
      list.add(item);
    };
    list;
  };

  // Persistent Types for ListPhotosResponse
  public type ListPhotosResponse = {
    photos : [Photo];
    nextCursor : ?Nat;
  };

  public type ListAlbumPhotosResponse = {
    photos : [Photo];
    nextCursor : ?Nat;
  };

  func listPhotosForUser(caller : Principal, userId : Principal, cursor : ?Nat, size : ?Nat) : ListPhotosResponse {
    let userPhotos = getUserPhotosById(caller, userId);
    let totalSize = userPhotos.size();
    let start = switch (cursor) {
      case (null) { 0 };
      case (?c) { c };
    };
    let fetchSize = switch (size) {
      case (null) { pageSize };
      case (?s) { s };
    };

    if (start >= totalSize) {
      return {
        photos = [];
        nextCursor = null;
      };
    };

    let sortedPhotos = userPhotos.toArray().reverse();
    let endIndex = if (start + fetchSize > totalSize) { totalSize } else {
      start + fetchSize;
    };
    let photosSlice = sortedPhotos.sliceToArray(start, endIndex);
    let newCursor = if (endIndex >= totalSize) { null } else {
      ?endIndex;
    };

    {
      photos = photosSlice;
      nextCursor = newCursor;
    };
  };

  public query ({ caller }) func getUserPhotosPaginated(userId : Principal, cursor : ?Nat, size : ?Nat) : async ListPhotosResponse {
    verifyUser(caller);
    listPhotosForUser(caller, userId, cursor, size);
  };

  public query ({ caller }) func getAllPhotosPaginated(cursor : ?Nat, size : ?Nat) : async ListPhotosResponse {
    verifyUser(caller);
    switch (photos.get(caller)) {
      case (?userPhotos) {
        let totalSize = userPhotos.size();
        let start = switch (cursor) {
          case (null) { 0 };
          case (?c) { c };
        };
        let fetchSize = switch (size) {
          case (null) { pageSize };
          case (?s) { s };
        };

        if (start >= totalSize) {
          return {
            photos = [];
            nextCursor = null;
          };
        };

        let sortedPhotos = userPhotos.toArray().reverse();
        let endIndex = if (start + fetchSize > totalSize) {
          totalSize;
        } else { start + fetchSize };
        let photosSlice = sortedPhotos.sliceToArray(start, endIndex);
        let newCursor = if (endIndex >= totalSize) { null } else {
          ?endIndex;
        };

        {
          photos = photosSlice;
          nextCursor = newCursor;
        };
      };
      case (null) {
        {
          photos = [];
          nextCursor = null;
        };
      };
    };
  };

  public query ({ caller }) func getPhoto(photoId : Text) : async Photo {
    verifyUser(caller);

    let userPhotos = getUserPhotos(caller);
    let matching = userPhotos.filter(func(photo) { photoId == photo.id });
    if (matching.isEmpty()) {
      Runtime.trap("Photo does not exist");
    };
    switch (matching.first()) {
      case (null) { Runtime.trap("Photo does not exist") };
      case (?photo) { photo };
    };
  };

  public query ({ caller }) func getUserPhoto(userId : Principal, photoId : Text) : async Photo {
    verifyUser(caller);

    let userPhotos = getUserPhotosById(caller, userId);
    let matching = userPhotos.filter(func(photo) { photoId == photo.id });
    if (matching.isEmpty()) {
      Runtime.trap("Photo does not exist");
    };
    switch (matching.first()) {
      case (null) { Runtime.trap("Photo does not exist") };
      case (?photo) { photo };
    };
  };

  public shared ({ caller }) func deletePhoto(photoId : Text) : async () {
    verifyUser(caller);

    switch (photos.get(caller)) {
      case (?userPhotos) {
        let filteredPhotos = userPhotos.filter(func(photo) { photo.id != photoId });
        allPhotos.add(caller, filteredPhotos);

        // Update all albums that contain this photo
        let userAlbums = getUserAlbums(caller);
        for ((albumId, album) in userAlbums.entries()) {
          let photoExists = album.photoIds.any(func(id) { id == photoId });
          if (photoExists) {
            let updatedPhotoIds = album.photoIds.filter(func(id) { id != photoId });
            var newCoverPhotoId = album.coverPhotoId;

            // If the deleted photo was the cover, update to first photo or null
            if (album.coverPhotoId == ?photoId) {
              newCoverPhotoId := if (not updatedPhotoIds.isEmpty()) {
                ?updatedPhotoIds.toArray()[0];
              } else { null };
            };

            let updatedAlbum : InternalAlbum = {
              album with
              photoIds = updatedPhotoIds;
              coverPhotoId = newCoverPhotoId;
            };
            userAlbums.add(albumId, updatedAlbum);
          };
        };
        albums.add(caller, userAlbums);
      };
      case (null) {
        Runtime.trap("No photos found for user");
      };
    };
  };

  // Caption Functionality
  public shared ({ caller }) func updatePhotoCaption(photoId : Text, newCaption : ?Text) : async () {
    verifyUser(caller);

    switch (allPhotos.get(caller)) {
      case (?userPhotos) {
        let updatedPhotos = userPhotos.map<Photo, Photo>(
          func(photo) {
            if (photo.id == photoId) {
              { photo with caption = newCaption };
            } else {
              photo;
            };
          }
        );
        allPhotos.add(caller, updatedPhotos);
      };
      case (null) {
        Runtime.trap("No photos found for user");
      };
    };
  };

  // Album Management
  public shared ({ caller }) func createAlbum(name : Text) : async () {
    verifyUser(caller);

    let albumId = nextId.toText();
    nextId += 1;
    let newAlbum : InternalAlbum = {
      id = albumId;
      name;
      photoIds = List.empty<Text>();
      coverPhotoId = null;
    };

    let userAlbums = getUserAlbums(caller);
    userAlbums.add(albumId, newAlbum);
    albums.add(caller, userAlbums);
  };

  public shared ({ caller }) func renameAlbum(albumId : Text, newName : Text) : async () {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    switch (userAlbums.get(albumId)) {
      case (?album) {
        let updatedAlbum : InternalAlbum = { album with name = newName };
        userAlbums.add(albumId, updatedAlbum);
        albums.add(caller, userAlbums);
      };
      case (null) {
        Runtime.trap("Album not found");
      };
    };
  };

  public shared ({ caller }) func setAlbumCoverPhoto(albumId : Text, photoId : Text) : async () {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    switch (userAlbums.get(albumId)) {
      case (?album) {
        // Ensure the photo exists in the album
        let photoExists = album.photoIds.any(func(id) { id == photoId });
        if (not photoExists) {
          Runtime.trap("Photo does not exist in album");
        };
        let updatedAlbum : InternalAlbum = {
          album with coverPhotoId = ?photoId;
        };
        userAlbums.add(albumId, updatedAlbum);
        albums.add(caller, userAlbums);
      };
      case (null) {
        Runtime.trap("Album not found");
      };
    };
  };

  public shared ({ caller }) func deleteAlbum(albumId : Text) : async () {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    userAlbums.remove(albumId);
    albums.add(caller, userAlbums);
  };

  public query ({ caller }) func listAlbums() : async [SharedAlbum] {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    let albumIter = userAlbums.values();
    albumIter.map<InternalAlbum, SharedAlbum>(toSharedAlbum).toArray();
  };

  public shared ({ caller }) func addPhotosToAlbum(albumId : Text, photoIds : [Text]) : async () {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    switch (userAlbums.get(albumId)) {
      case (?album) {
        let newPhotoIdsList = List.empty<Text>();
        for (photoId in photoIds.values()) {
          newPhotoIdsList.add(photoId);
        };

        let combinedPhotoIds = switch (album.photoIds.isEmpty(), newPhotoIdsList.isEmpty()) {
          case (false, false) {
            let albumArray = album.photoIds.toArray();
            let newArray = newPhotoIdsList.toArray();
            let combinedArray = albumArray.concat(newArray);
            let combinedList = List.empty<Text>();
            for (item in combinedArray.values()) {
              combinedList.add(item);
            };
            combinedList;
          };
          case (false, true) { album.photoIds };
          case (true, false) { newPhotoIdsList };
          case (true, true) { List.empty<Text>() };
        };

        // If the new album has no cover photo, set the first photo as cover
        let albumWithPhotos = {
          album with
          photoIds = combinedPhotoIds : List.List<Text>;
        };
        let updatedAlbum : InternalAlbum = if (albumWithPhotos.coverPhotoId == null and not albumWithPhotos.photoIds.isEmpty()) {
          {
            albumWithPhotos with
            coverPhotoId = ?albumWithPhotos.photoIds.toArray()[0];
          };
        } else { albumWithPhotos };

        userAlbums.add(albumId, updatedAlbum);
        albums.add(caller, userAlbums);
      };
      case (null) {
        Runtime.trap("Album not found");
      };
    };
  };

  public shared ({ caller }) func removePhotoFromAlbum(albumId : Text, photoId : Text) : async () {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    switch (userAlbums.get(albumId)) {
      case (?album) {
        let updatedPhotoIds = album.photoIds.filter(func(id) { photoId != id });

        var newCoverPhotoId = album.coverPhotoId;
        if (album.coverPhotoId == ?photoId) {
          // Set to first photo or null if empty
          newCoverPhotoId := if (not updatedPhotoIds.isEmpty()) {
            ?updatedPhotoIds.toArray()[0];
          } else { null };
        };

        let updatedAlbum : InternalAlbum = {
          album with
          photoIds = updatedPhotoIds : List.List<Text>;
          coverPhotoId = newCoverPhotoId;
        };
        userAlbums.add(albumId, updatedAlbum);
        albums.add(caller, userAlbums);
      };
      case (null) {
        Runtime.trap("Album not found");
      };
    };
  };

  public query ({ caller }) func getAlbum(albumId : Text) : async SharedAlbum {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    switch (userAlbums.get(albumId)) {
      case (?album) {
        toSharedAlbum(album);
      };
      case (null) { Runtime.trap("Album not found") };
    };
  };

  public query ({ caller }) func getAlbumPhotosPaginated(albumId : Text, cursor : ?Nat, size : ?Nat) : async ListAlbumPhotosResponse {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    switch (userAlbums.get(albumId)) {
      case (?album) {
        let totalSize = album.photoIds.size();
        let start = switch (cursor) {
          case (null) { 0 };
          case (?c) { c };
        };
        let fetchSize = switch (size) {
          case (null) { pageSize };
          case (?s) { s };
        };

        if (start >= totalSize) {
          return {
            photos = [];
            nextCursor = null;
          };
        };

        let sortedPhotoIds = album.photoIds.toArray().reverse();
        let endIndex = if (start + fetchSize > totalSize) {
          totalSize;
        } else { start + fetchSize };
        let photoIdsSlice = sortedPhotoIds.sliceToArray(start, endIndex);

        let newCursor = if (endIndex >= totalSize) { null } else {
          ?endIndex;
        };

        let allUserPhotos = getUserPhotos(caller);
        let filteredPhotos = allUserPhotos.filter(
          func(photo) {
            photoIdsSlice.find(func(id) { id == photo.id }) != null;
          }
        );

        let albumPhotosArray = filteredPhotos.toArray();

        {
          photos = albumPhotosArray;
          nextCursor = newCursor;
        };
      };
      case (null) {
        Runtime.trap("Album does not exist");
      };
    };
  };

  public query ({ caller }) func getAlbumPhoto(albumId : Text, photoId : Text) : async Photo {
    verifyUser(caller);

    let userAlbums = getUserAlbums(caller);
    switch (userAlbums.get(albumId)) {
      case (?album) {
        let photosWithId = album.photoIds.filter(func(id) { photoId == id });
        if (photosWithId.isEmpty()) {
          Runtime.trap("Photo does not exist");
        } else {
          let allUserPhotos = getUserPhotos(caller);
          let lessonPhotos = allUserPhotos.filter(func(photo) { photo.id == photoId });
          if (lessonPhotos.isEmpty()) {
            Runtime.trap("Photo does not exist");
          } else {
            switch (lessonPhotos.first()) {
              case (null) {
                Runtime.trap("Photo does not exist");
              };
              case (?photo) { photo };
            };
          };
        };
      };
      case (null) {
        Runtime.trap("Album does not exist");
      };
    };
  };
};
