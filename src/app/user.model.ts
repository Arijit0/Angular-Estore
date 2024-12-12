export interface User {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    phoneNumber: string;
    address: Address;
    // Add any other personal info or preferences here
  }
  
  export interface Address {
    name: string;
    mobile: number;
    zipCode: string;
    mainAddress: string;
    city: string;
    state: string;
  }