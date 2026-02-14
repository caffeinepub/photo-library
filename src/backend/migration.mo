import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type Photo = {
    id : Text;
    blob : Storage.ExternalBlob;
    name : Text;
    createdAt : Int;
  };

  type Actor = {
    allPhotos : Map.Map<Principal, List.List<Photo>>;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
