import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AppConstants } from '../AppConstants'
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Router } from '@angular/router';
import {  FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updateEmail } from '@angular/fire/auth';
import { BehaviorSubject, catchError, combineLatest, first, firstValueFrom, from, map, of, switchMap, tap, throwError } from 'rxjs';
import firebase from 'firebase/compat/app';
import { CartItem } from '../cart.model';
import { equals } from 'ramda';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  private emailVerifiedSubject = new BehaviorSubject<boolean>(false);  // holds the email verification status
  private CART_KEY = 'cartItems';

  private navigatedToCheckout = false;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private fb: FormBuilder,
    private auth: AngularFireAuth,
    private toastr: ToastrService,
    private firestore: AngularFirestore,
    private titleService: Title,
    private metaService: Meta,
    @Inject(PLATFORM_ID) private platformId: Object

  ) { 
    this.checkEmailVerificationStatus();
  }

  getCategories(): Observable<any> {
    return this.firestore.collection('categories').valueChanges();
  }

  getAllProducts(): Observable<any> {
    return this.firestore.collection('allProducts').valueChanges();
  }

  storeAllProductsToLocalStorage(allProducts: any) {
    localStorage.setItem('allProducts', JSON.stringify(allProducts));
  }

  fetchAllProductsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('allProducts') || '{}');
  }

  getProductsByCategory(categoryName: string): Observable<any> {
    return this.firestore
    .collection('allProducts', (ref) => ref.where('itemCategory', '==', categoryName))
    .valueChanges();
  }

  getProductsByCategoryWithWishlist(
    categoryName: string,
    userId: string
  ): Observable<any[]> {
    // Fetch all products in the specified category
    const categoryProducts$ = this.firestore
      .collection('allProducts', (ref) => ref.where('itemCategory', '==', categoryName))
      .valueChanges() as Observable<any[]>;
  
    // Fetch wishlist products for the user
    const userWishlist$ = this.firestore
      .collection('wishlists')
      .doc(userId)
      .valueChanges()
      .pipe(
        map((doc: any) => (doc ? doc.products : []))
      );
  
    // Combine data
    return combineLatest([categoryProducts$, userWishlist$]).pipe(
      map(([categoryProducts, wishlist]) => {
        // Mark products that are in the user's wishlist
        return categoryProducts.map((product) => ({
          ...product,
          isInWishlist: wishlist.includes(product.productId),
        }));
      })
    );
  }
  

  getProductById(productId: string): Observable<any>{
    return this.firestore
      .collection('allProducts')
      .doc(productId)
      .valueChanges();
  }

  isCartPage() {
    return this.router.url === '/viewcart';
  }

  cartItems():any[] {
    // return JSON.parse(localStorage.getItem('product') || '[]');
    // const product = localStorage.getItem('product');
    // return product ? JSON.parse(product) : null;

    if (isPlatformBrowser(this.platformId)) {
      const items: any = localStorage.getItem('cartItems');
      return items ? JSON.parse(items) : [];
    }
      return []; // Return a default value for SSR

  }

  storeCart(arrCartItems: any) {
    localStorage.setItem('product', JSON.stringify(arrCartItems));
  }

  // fetchProductDetailsFromLocalStorage() {
  //   return JSON.parse(localStorage.getItem('productdetails') || '{}');
  // }

  sendProductDetailsToLocalStorage(productDetails: any) {
    localStorage.setItem('productdetails', JSON.stringify(productDetails));
  }


   // Validator for Email
   emailValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const value = control.value;
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!value || emailPattern.test(value)) {
        return null; // Valid
      }
      return { invalidContact: true }; // Invalid
    };
  }

  // Validator for Mobile
  mobileValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const value = control.value;
      const mobilePattern = /^[6-9]\d{9}$/; // Indian mobile numbers start with 6-9 and have 10 digits.
  
      if (!value || mobilePattern.test(value)) {
        return null; // Valid
      }
      return { invalidMobile: true }; // Invalid
    };
  }

  // Create Form Group for Email/password input for both login and signup
  createContactForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, this.emailValidator()]], // Email
      password: ['', [Validators.required,Validators.minLength(6)]] // Password field
    });
  }
  
  // Get the current user from localStorage
  getUser() {

    if (isPlatformBrowser(this.platformId)) {
      const user: any = localStorage.getItem('user');
      return JSON.parse(user);
    }
      // return []; // Return a default value for SSR

  }

    // Clear user data on logout
    clearUser() {
      localStorage.removeItem('user');
    }

    onLogout() {
      this.auth.signOut()
        .then(() => {
          localStorage.removeItem('user'); // Clear localStorage
          console.log('User logged out and data cleared from localStorage');
          this.router.navigate(['/login']); // Redirect to login page
        })
        .catch((error) => {
          console.error('Error logging out:', error.message);
        });
    }

   // Save/update user details to Firestore
   saveUserDetails(uid: string, userDetails: any): Promise<void> {
    return this.firestore
      .collection('users')
      .doc(uid) // We are using the UID as the document ID
      .get() // Check if the document already exists
      .toPromise()
      .then((docSnapshot) => {
        if (docSnapshot!.exists) {
          // If document exists, update the document with new details
          return this.firestore
            .collection('users')
            .doc(uid)
            .update(userDetails);
        } else {
          // If document doesn't exist, create a new document with the details
          return this.firestore
            .collection('users')
            .doc(uid)
            .set(userDetails);
        }
      })
      .catch((error) => {
        console.error('Error saving user details:', error);
        throw error;
      });
  }
  

  // Fetch user details from Firestore
  getUserDetails(uid: string): Observable<any | null> {
    return this.firestore
      .collection('users')
      .doc(uid)
      .valueChanges()
      .pipe(
        map((data) => (data ? data : null)), // Return null if no data is found
        catchError((error) => {
          console.error('Error fetching user details:', error);
          return of(null); // Return null in case of an error
        })
      );
  }
  

  // Get the currently logged-in user
  getUserFromFirestore() {
    return this.auth.authState; // Returns user object as observable
  }

  storeUser(user: any) {
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user));
  }


 // Reauthenticate and update email
 async updateEmailAfterVerification(
  currentPassword: string,
  newEmail: string
): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No user is currently signed in.');
  }

  try {
    // Step 1: Check if the current email is verified
    console.log('Checking if the current email is verified...');
    if (user.emailVerified) {
      console.log('Current email is verified.');

      // Step 2: Reauthenticate the user with their current password
      console.log('Reauthenticating the user...');
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      console.log('Reauthentication successful.');
  
      // Step 4: Update the email after verification (if needed)
      console.log('Updating the email...');
      await updateEmail(user, newEmail);
      console.log('Email updated successfully!');
    } else {
      throw new Error('Your current email is not verified. Please verify it first.');
    }
  } catch (error: any) {
    console.error('Error updating email:', error.message);
    throw error;
  }
}

     // send verification email
     async sendVerificationEmail() {
      try {
        const user = await this.auth.currentUser;
        if (user && !user.emailVerified) {
          await user.sendEmailVerification();
          
          // Successfully sent verification email
          return { success: true, message: 'Verification email sent. Please check your inbox.' };
        } else {
          // Email is already verified or user is not logged in
          return { success: false, message: 'Your email is already verified or no user is logged in.' };
        }
      } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, message: 'Error sending verification email. Please try again later.' };
      }
    }

 // Check if email is verified
    checkEmailVerificationStatus() {
      this.auth.authState.subscribe(user => {
        if (user) {
          this.emailVerifiedSubject.next(user.emailVerified);  // Update the variable when state changes
        }
      });
    }

    get emailVerified$() {
      return this.emailVerifiedSubject.asObservable();  // Provide observable to subscribe to in components
    }

    async checkEmailVerification() {
      const user = await this.auth.currentUser;
      if (user) {
        return user.emailVerified;
      }
      return false;
    }

// Add a wishlist item
// addToWishlist(userId: string, product: any): Promise<void> {
//   const wishlistId = this.firestore.createId(); // Generate a unique ID
//   return this.firestore
//     .collection('wishlists')
//     .doc(wishlistId)
//     .set({
//       wishlistId,
//       userId,
//       itemId: product.id,
//       itemName: product.title,
//       itemPrice: product.price,
//       itemImage: product.image,
//       itemCategory: product.category,
//       itemRatingCount: product.rating.count,
//       itemRatingRate: product.rating.rate,
//       itemDescription: product.description,
//       addedAt: new Date(),
//     });
// }

isProductInWishlist(userId: string, productId: string): Promise<boolean> {
  const wishlistRef = this.firestore.collection('wishlists').doc<any>(userId);

  return firstValueFrom(wishlistRef.get()).then((doc) => {
    if (!doc.exists) return false;
    const data = doc.data();
    return data?.products.includes(productId) || false;
  }).catch((error) => {
    console.error('Error checking wishlist status:', error);
    return false;
  });
}


// Add a wishlist item
addToWishlist(userId: string, productId: string): Promise<void> {
  const wishlistRef = this.firestore.collection('wishlists').doc(userId);

  return wishlistRef
    .set(
      {
        products: firebase.firestore.FieldValue.arrayUnion(productId),
      },
      { merge: true }
    )
    .then(() => {
      console.log(`Product ${productId} added to wishlist for user ${userId}.`);
      // this.toastr.success('Added to Wishlist!');
    })
    .catch((error) => {
      console.error('Error adding product to wishlist:', error);
      this.toastr.error('Could not add to wishlist.');
    });
}

// Fetch wishlist for a specific user
getUserWishlist(userId: string): Observable<string[]> {
  return this.firestore
    .collection('wishlists')
    .doc(userId)
    .valueChanges()
    .pipe(
      map((doc: any) => (doc ? doc.products : []))
    );
}

// combineProductsAndWishlist(userId: string): Observable<any> {
//   return combineLatest([this.getAllProducts(), this.getUserWishlist(userId)]).pipe(
//     map(([allProducts, wishlist]) => {
//       return allProducts.map((product: any) => ({
//         ...product,
//         isInWishlist: wishlist.includes(product.productId),
//       }));
//     })
//   );
// }



// Method to update the wishlist status for a specific user and product OR removing a wishlist
  async removeFromWishlist(userId: string, productId: string): Promise<void> {
  const wishlistRef = this.firestore.collection('wishlists').doc(userId);

 try {
    await wishlistRef
      .update({
        products: firebase.firestore.FieldValue.arrayRemove(productId),
      });
    console.log(`Product ${productId} removed from wishlist for user ${userId}.`);
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
  }
}

 // Fetch cart items (localStorage or Firestore)
 fetchCartItems(): Promise<any[]> {
  const user = this.getUser();

  if (user) {
    // If user is logged in, fetch from Firestore
    return this.firestore
      .collection('cartItems')
      .doc(user.uid)
      .get()
      .toPromise()
      .then((doc: any) => (doc.exists ? doc.data().products || [] : []));
  } else {
    
    if (isPlatformBrowser(this.platformId)) {
          // Fetch from localStorage
    const items = localStorage.getItem(this.CART_KEY);
    return Promise.resolve(items ? JSON.parse(items) : []);
    } else {
      console.warn('localStorage is not available on the server.');
    }
    return Promise.resolve([]); // Wrap the array in a resolved Promise
  }
}

// Save cart items (localStorage or Firestore)
saveCartItems(cartItems: any[]): void {
  const user = this.getUser();

  if (user) {
    // Save to Firestore for logged-in user
    this.firestore
      .collection('cartItems')
      .doc(user.uid)
      .set({ products: cartItems }, { merge: true })
      .then(() => console.log('Cart items saved to Firestore.'))
      .catch((error) => console.error('Error saving cart items:', error));
  } else {
    // Save to localStorage for guest user
    localStorage.setItem(this.CART_KEY, JSON.stringify(cartItems));
  }
}

// Method to remove cart items for the user after payment
clearCartItems(userId: string): Observable<any> {
  const cartItemsRef = this.firestore.collection('cartItems').doc(userId);

  return from(cartItemsRef.delete()).pipe(
    map(() => {
      console.log('Cart items removed successfully for user:', userId);
      return { success: true };
    }),
    catchError((error) => {
      console.error('Error removing cart items:', error);
      return throwError(() => new Error('Error removing cart items from Firestore'));
    })
  );
}

// Sync LocalStorage to Firestore
async syncCartToFirestore(): Promise<void> {
  const user = this.getUser();
  if (!user) return Promise.resolve();

  const localCart = localStorage.getItem(this.CART_KEY);
  if (!localCart) return Promise.resolve();
  const localCartItems = JSON.parse(localCart);

  try {
    const userCartDoc = this.firestore.collection('cartItems').doc(user.uid);

    const docSnapshot: any = await userCartDoc.get().pipe(first()).toPromise(); // Resolve Observable to Promise
    let firestoreCartItems: any[] = [];

    if (docSnapshot.exists) {
      firestoreCartItems = docSnapshot.data()?.products || [];
    }

    // Merge local cart into Firestore cart
    localCartItems.forEach((localItem: any) => {
      const existingItem = firestoreCartItems.find(
        (item: any) => item.productId === localItem.productId
      );

      if (existingItem) {
        // Update quantity if the product exists
        existingItem.quantity += localItem.quantity;
      } else {
        // Add new product to Firestore cart
        firestoreCartItems.push(localItem);
      }
    });

    // Save merged cart back to Firestore
    await userCartDoc.set({ products: firestoreCartItems });

    // Clear local storage after successful sync
    localStorage.removeItem(this.CART_KEY);
    console.log('LocalStorage synced to Firestore.');
  } catch (error) {
    console.error('Error syncing cart to Firestore:', error);
  }
}

  // Save cart items to Firestore
  saveCartItemsToFirestoreForCheckout(
    cartItems: CartItem[], 
    total: number, 
    personalDetails: any
  ): Observable<any> {
    const userId = this.getUser().uid;
    const email = this.getUser().email;
  
    const checkoutDocRef = this.firestore.collection('checkoutItems').doc(userId);
  
    return from(checkoutDocRef.get()).pipe(
      switchMap((docSnapshot: any) => {
        if (docSnapshot.exists) {
          const existingData = docSnapshot.data();

          const isDataSame =
          equals(existingData.products, cartItems) &&
          existingData.totalAmount === total &&
          equals(existingData.personalDetails, personalDetails);
  
          if (isDataSame) {
            console.log('No changes detected. Skipping update.');
            return of(null); // No update needed
          }
        }
  
        // Data has changed or document does not exist; update Firestore
        return from(
          checkoutDocRef.set({
            userId: userId,
            totalAmount: total,
            products: cartItems,
            personalDetails: personalDetails,
            userEmail: email,
            updatedAt: new Date(),
          })
        ).pipe(
          map(() => {
            console.log('Cart items saved successfully.');
            return { success: true };
          })
        );
      }),
      catchError((error) => {
        console.error('Error saving cart items:', error);
        return throwError(() => error);
      })
    );
  }
  
    // Get cart items from Firestore
    fetchCheckoutItemByUserId(userId: string): Observable<any> {
      return this.firestore
        .collection('checkoutItems')
        .doc(userId)
        .valueChanges()
        .pipe(
          tap(data => console.log('Checkout Item:', data)),  // Debugging
          catchError(error => {
            console.error('Error fetching checkout items:', error);
            return of(null); // or handle the error as needed
          })
        );
    }
    

    setNavigatedToCheckout(flag: boolean): void {
      this.navigatedToCheckout = flag;
    }
  
    getNavigatedToCheckout(): boolean {
      return this.navigatedToCheckout;
    }

    getHeaderStatusForCheckout() {
      const currentPage = this.router.url; // Example: Fetch the current route
      return currentPage.includes('/checkout');
    }

    storeOrderDetailsInFirestore(orderData: any): Observable<any> {
      const userId = orderData.userId;
    
      // Reference to the user's orders sub-collection
      const ordersRef = this.firestore.collection('orders');
    
      // Add a new document to the sub-collection
      return from(ordersRef.add(orderData)).pipe(
        map((docRef) => {
          console.log(`Order saved with ID: ${docRef.id}`);
          return { success: true, orderId: docRef.id };
        }),
        catchError((error) => {
          console.error('Error saving order:', error);
          return throwError(() => new Error('Error saving order to Firestore'));
        })
      );
    }

    getUserOrders(userId: string): Observable<any[]> {
      // Reference to the user's orders collection with a filter on userId
      const ordersRef = this.firestore.collection('orders', (ref) => 
        ref.where('userId', '==', userId) // Filter by userId
      );
    
      return ordersRef.snapshotChanges().pipe(
        map((actions) =>
          actions
            .map((a) => {
              const data: any = a.payload.doc.data();
              const id = a.payload.doc.id; // Capture the document ID
              return { id, ...data }; // Return the document data with its ID
            })
            .sort((a, b) => {
              // Convert Firestore timestamp to milliseconds and compare
              const dateA = a.orderDate?.seconds * 1000 || 0;
              const dateB = b.orderDate?.seconds * 1000 || 0;
              return dateB - dateA; // Descending order
            })
        ),
        catchError((error) => {
          console.error('Error fetching orders:', error);
          return throwError(() => new Error('Error fetching user orders from Firestore'));
        })
      );
    }
    
    setMetaTagsAndTitle(data?: any, product?: any) {
      if (data) {
        this.titleService.setTitle(data.title);
        this.metaService.addTags([
          { name: 'description', content: data.description },
          { property: 'og:title', content: data.title },
          { property: 'og:description', content: data.description },
          { property: 'og:image', content: data.image },
          { property: 'og:url', content: window.location.href },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: data.title },
          { name: 'twitter:description', content: data.description },
          { name: 'twitter:image', content: data.image },
          { name: 'twitter:image:alt', content: data.description}
        ]);
      }else {
              // Set dynamic page title and meta tags for SEO
      this.titleService.setTitle(product.itemName);
      this.metaService.addTags([
        { name: 'description', content: product.itemDescription },
        { property: 'og:title', content: product.itemName },
        { property: 'og:description', content: product.itemDescription },
        { property: 'og:image', content: product.itemImage },
        { property: 'og:url', content: window.location.href },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: product.itemName },
        { name: 'twitter:description', content: product.itemDescription },
        { name: 'twitter:image', content: product.itemImage },
        { name: 'twitter:image:alt', content: product.itemDescription}
      ]);
      }
    }
    

}
