export interface RSLImportSchedule {
  eventid: string;
  setnum: string;
  campname: string;
  partyaddress: string;
  partyname: string;
  starttime: string;
  djname: string;
  endtime: string;
  artcarname: string;
  altlocationdescription: string;
}

export interface RSLImportCamp {
  campname: string;
  location: string;
  altlocation: string;
  wheelchairfriendly: string;
  mobilitynotes: string;
  uid: string;
}
