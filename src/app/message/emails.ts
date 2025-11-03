export interface Email {
  subject: string;
  html: string;
  text: string;
  date: string; // eg 2024-11-08T23:20:29.000Z
  from: Address;
  read: boolean;
  reading: boolean;
}

interface Address {
  address: string;
  name: string;
}
