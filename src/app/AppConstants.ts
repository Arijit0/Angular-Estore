import { InjectionToken } from "@angular/core";


export let APP_CONFIG = new InjectionToken("app.config");

export class AppConstants {


    public static get prodUrl(): string {return  'https://fakestoreapi.com';}


    public static readonly metaURL = {
        title: 'Online Shopping India Mobile, Cameras, Lifestyle & more Online @ Flipkart.com',
        description: "India's biggest online store for Mobiles, Fashion (Clothes/Shoes), Electronics, Home Appliances, Books, Home, Furniture, Grocery, Jewelry, Sporting goods, Beauty & Personal Care and more! Find the largest selection from all brands at the lowest prices in India. Payment options - COD, EMI, Credit card, Debit card & more.",
        image: 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/logo_lite-cbb357.png'
      };


      public static readonly cartURL = {
        title: 'Shopping Cart | Flipcart.com',
        description: "Shop for electronics, apparels & more using our Flipkart app Free shipping & COD.",
        image: 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/logo_lite-cbb357.png'
      };
    
      public static readonly checkoutURL = {
        title: 'Flipkart.com: Secure Payment: Login > Select Shipping Address > Review Order > Place Order',
        description: "Shop for electronics, apparels & more using our Flipkart app Free shipping & COD.",
        image: 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/logo_lite-cbb357.png'
      };

      public static readonly profileURL = {
        title: 'My Profile',
        description: "Shop for electronics, apparels & more using our Flipkart app Free shipping & COD.",
        image: 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/logo_lite-cbb357.png'
      };
    
    
}