
export interface CheckoutItems {
  personalDetails: {
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    address: {
      city: string;
      mainAddress: string;
      pinCode: string;
      state: string;
      mobilePhone: string;
      name: string;
    };
  };
  userEmail: string;
  products: {
    itemName: string;
    itemCategory: string;
    itemImage: string;
    itemPrice: number;
    itemRatingRate: number;
    itemRatingCount: number;
    quantity: number;
  }[];
  totalAmount: number;
  updatedAt: any;
}
