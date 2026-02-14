import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module Photo {
    public type Photo = {
      id : Text;
      blob : Storage.ExternalBlob;
      name : Text;
      createdAt : Time.Time;
    };

    public func compareByCreatedAt(photo1 : Photo, photo2 : Photo) : Order.Order {
      if (photo1.createdAt < photo2.createdAt) { #less } else if (photo1.createdAt > photo2.createdAt) {
        #greater;
      } else { #equal };
    };
  };

  type Photo = Photo.Photo;

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  // Persistent state
  let allPhotos = Map.empty<Principal, List.List<Photo>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextId = 0;
  let pageSize = 36;

  include MixinStorage();
  let photos = allPhotos;

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Photo management functions
  public shared ({ caller }) func uploadMultiplePhotos(photos : [Photo]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload photos");
    };

    nextId += photos.size();
    let userPhotos = listFromArray(photos);
    allPhotos.add(caller, userPhotos);
  };

  func getUserPhotosById(caller : Principal, userId : Principal) : List.List<Photo> {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only fetch own photos");
    };

    switch (photos.get(userId)) {
      case (?userPhotos) {
        userPhotos;
      };
      case (null) {
        List.empty<Photo>();
      };
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

  type ListPhotosResponse = {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list photos");
    };
    listPhotosForUser(caller, userId, cursor, size);
  };

  public query ({ caller }) func getAllPhotosPaginated(cursor : ?Nat, size : ?Nat) : async ListPhotosResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list photos");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch photos");
    };

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

  public query ({ caller }) func getUserPhoto(callerId : Principal, photoId : Text) : async Photo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch photos");
    };

    let userPhotos = getUserPhotosById(caller, callerId);
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete photos");
    };

    switch (photos.get(caller)) {
      case (?userPhotos) {
        let filteredPhotos = userPhotos.filter(func(photo) { photo.id != photoId });
        allPhotos.add(caller, filteredPhotos);
      };
      case (null) {
        Runtime.trap("No photos found for user");
      };
    };
  };
};
