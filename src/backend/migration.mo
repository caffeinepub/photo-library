import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldPhoto = {
    id : Text;
    blob : Storage.ExternalBlob;
    name : Text;
    createdAt : Int;
  };

  type NewPhoto = {
    id : Text;
    blob : Storage.ExternalBlob;
    name : Text;
    createdAt : Int;
    caption : ?Text;
  };

  type OldActor = {
    allPhotos : Map.Map<Principal, List.List<OldPhoto>>;
    albums : Map.Map<Principal, Map.Map<Text, { id : Text; name : Text; photoIds : List.List<Text>; coverPhotoId : ?Text }>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextId : Nat;
    pageSize : Nat;
    photos : Map.Map<Principal, List.List<OldPhoto>>;
  };

  type NewActor = {
    allPhotos : Map.Map<Principal, List.List<NewPhoto>>;
    albums : Map.Map<Principal, Map.Map<Text, { id : Text; name : Text; photoIds : List.List<Text>; coverPhotoId : ?Text }>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextId : Nat;
    pageSize : Nat;
    photos : Map.Map<Principal, List.List<NewPhoto>>;
  };

  public func run(old : OldActor) : NewActor {
    let newAllPhotos = old.allPhotos.map<Principal, List.List<OldPhoto>, List.List<NewPhoto>>(
      func(_principal, oldPhotosList) {
        oldPhotosList.map<OldPhoto, NewPhoto>(
          func(oldPhoto) {
            { oldPhoto with caption = null };
          }
        );
      }
    );

    let newPhotos = old.photos.map<Principal, List.List<OldPhoto>, List.List<NewPhoto>>(
      func(_principal, oldPhotosList) {
        oldPhotosList.map<OldPhoto, NewPhoto>(
          func(oldPhoto) {
            { oldPhoto with caption = null };
          }
        );
      }
    );

    {
      old with
      allPhotos = newAllPhotos;
      photos = newPhotos;
    };
  };
};
