import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AppConstants } from '../AppConstants'
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Router } from '@angular/router';
import {  FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { isPlatformBrowser } from '@angular/common';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, sendEmailVerification, updateEmail } from '@angular/fire/auth';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  constructor(
    private http: HttpClient, 
    private router: Router,
    private fb: FormBuilder,
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    @Inject(PLATFORM_ID) private platformId: Object

  ) { }

  getCategories(): Observable<any> {
    return this.http.get(`${AppConstants.prodUrl}/products/categories`);
  }

  getAllProducts(): Observable<any> {
    return this.http.get(`${AppConstants.prodUrl}/products`);
  }

  getProductsByCategory(categoryName: string): Observable<any> {
    return this.http.get(`${AppConstants.prodUrl}/products/category/${categoryName}`);
  }

  getProductById(id: string): Observable<any> {
    return this.http.get(`${AppConstants.prodUrl}/products/${id}`);
  }

  isCartPage() {
    return this.router.url === '/viewcart';
  }

  cartItems():any[] {
    // return JSON.parse(localStorage.getItem('product') || '[]');
    // const product = localStorage.getItem('product');
    // return product ? JSON.parse(product) : null;

    if (isPlatformBrowser(this.platformId)) {
      const items: any = localStorage.getItem('product');
      return items ? JSON.parse(items) : [];
    }
      return []; // Return a default value for SSR

  }

  storeCart(arrCartItems: any) {
    localStorage.setItem('product', JSON.stringify(arrCartItems));
  }

  fetchProductDetailsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('productdetails') || '{}');
  }

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
    // const user = localStorage.getItem('user');
    // return user ? JSON.parse(user) : null;

    if (isPlatformBrowser(this.platformId)) {
      const user: any = localStorage.getItem('user');
      return user ? JSON.parse(user) : [];
    }
      return []; // Return a default value for SSR

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
  getUserDetails(uid: string): Observable<any> {
    return this.firestore.collection('users').doc(uid).valueChanges();
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
  
      // Step 3: Send verification email to the new email address
      console.log('Sending verification email to the new email address...');
      await sendEmailVerification(user);
      console.log('Verification email sent. Please verify the new email before proceeding.');
  
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
     sendVerificationEmail() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        sendEmailVerification(user)
          .then(() => {
            alert('Verification email sent. Please check your inbox.');
            return true;
          })
          .catch((error) => {
            console.error('Error sending verification email:', error);
            return false;
          });
      }
    }
  

    // Check if email is verified
    checkEmailVerificationStatus() {
      return this.auth.authState.pipe(
        map(user => user ? user.emailVerified : false)
      );
    }


}

