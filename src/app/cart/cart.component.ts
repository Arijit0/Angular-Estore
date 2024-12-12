import { Component, OnInit } from '@angular/core';
import { HeadComponent } from "../header/head/head.component";
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MasterService } from '../services/master.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { CartItem } from '../cart.model';
import { AppConstants } from '../AppConstants';

@Component({
    selector: 'app-cart',
    imports: [HeadComponent, FormsModule, CommonModule, NgxSkeletonLoaderModule],
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  iscartEmpty: boolean = true;
  allcartItems: any[] = [];
  personalDetails: any[] = [];
  total: number = 0;
  modal: any;
  finalCartItems: CartItem[] | undefined; // Use the Product interface

  cartItemToRemove: any;
  cartItemToRemoveIndex: number = 0;

  isLoading: boolean = false; // Indicates if the data is loading

  loadingMessages = [
    'Fetching your data...',
    'Almost there...',
    'Preparing your results...',
    'Just a moment, please...',
  ];
  loadingMessage: string = this.loadingMessages[0];

  constructor(
    private router: Router,
    private masterService: MasterService,
    private toastr: ToastrService
  ){
    // this.masterService.syncCartToFirestore(); // Sync cart on login
    this.fetchCartItems();
  }
  // ngOnChanges(changes: SimpleChanges): void {
  //   this.masterService.syncCartToFirestore(); // Sync cart on login
  // }

  ngOnInit(): void {
    this.setMetaTgs();
    this.loading();
    this.fetchCartItems();
  }

  setMetaTgs() {
    const data = AppConstants.cartURL;
  
      // Set SEO meta tags and page title
      this.masterService.setMetaTagsAndTitle(data,undefined);
  }

  loading() {
    let index = 0;
    setInterval(() => {
      if (index < this.loadingMessages.length - 1) {
        index++;
      } else {
        index = 0;
      }
      this.loadingMessage = this.loadingMessages[index];
    }, 1000); // Change messages every .5 seconds
  }

  fetchCartItems(): void {
    this.isLoading = true;
    this.masterService.fetchCartItems().then((items) => {
      this.allcartItems = items;
      this.iscartEmpty = this.allcartItems.length === 0;
      this.calculateTotal();
      this.masterService.syncCartToFirestore(); // Sync cart on login
      this.isLoading = false;
    });
  }

  // fetchCartItems() {
  //   if(!this.masterService.cartItems() || this.masterService.cartItems().length == 0) {
  //     this.iscartEmpty = true;
  //   } else {
  //     if (this.masterService.getUser()) {
        
  //     }
  //     // const item = localStorage.getItem('productdetails') ? JSON.parse('productdetails') : null;
  //     this.allcartItems = this.masterService.cartItems();
  //     this.calculateTotal();
  //     this.iscartEmpty = false;
  //   }
  // }

  goTohome() {
    this.router.navigate(['/']);
  }

  removeItem(confirmValue: any) {
     if (this.cartItemToRemoveIndex !== -1 && confirmValue) {
      this.allcartItems.splice(this.cartItemToRemoveIndex, 1);
      this.masterService.saveCartItems( this.allcartItems);
      this.fetchCartItems();
      this.modal.hide();
      this.calculateTotal();
      this.toastr.success(`Successfully removed ${this.cartItemToRemove.itemName} from your cart`);
     }
  }

  remove(item: any,index: number) {
    // Open the confirmation modal
    this.modal = new (window as any).bootstrap.Modal(document.getElementById('confirmationModal'));
    //modal.toglle();
    //modal.show();
    //modal.hide();
    //modal.dispose();
    this.modal.show();
    this.cartItemToRemove = item;
    this.cartItemToRemoveIndex  = index;
  }

  goToDetails(item: any) {
    this.router.navigate(['/products', item.productId, item.itemName]);
  }

  incrementQuantity(item: any): void {
    item.quantity ++;
    this.finalcart(item);
  }

  decrementQuantity(item: any): void {
    if (item.quantity > 1) {
      item.quantity --;
      this.finalcart(item);
    }
  }

  calculateTotal(): void {
    this.total = this.allcartItems.reduce((acc, item) => {
      return acc + (item.itemPrice * item.quantity);
    }, 0);
  }

  finalcart(item: any) {
    this.allcartItems.forEach((element,index) => {
      if(element.itemName == item.itemName) {
        this.allcartItems[index].quantity = item.quantity;
          this.masterService.saveCartItems( this.allcartItems);
          this.iscartEmpty = true;
          this.toastr.success(`You've changed ${this.allcartItems[index].itemName} QUANTITY to '${item.quantity}'`);
          this.fetchCartItems();
      }
    });
  }

  // goToCheckout() {

  //   const user = this.masterService.getUser();

  //   if (user) {
  //     this.masterService.getUserDetails(user.uid).subscribe({
  //       next: (value) => {
  //         if (value.firstName === undefined 
  //           || value.gender === undefined 
  //           || value.lastName === undefined
  //           || value.mobile === undefined
  //           || value.address.city === undefined
  //           || value.address.mainAddress === undefined
  //           || value.address.mobilePhone === undefined
  //           || value.address.name === undefined
  //           || value.address.pinCode === undefined
  //           || value.address.state === undefined) {

  //             this.toastr.warning('Some personal details are missing. Please update your information.');
  //                 this.router.navigate(['personal-info/account']);


  //               //             // Check if specific fields in 'value' are undefined
  //               // if (value.firstName === undefined 
  //               //   || value.gender === undefined 
  //               //   || value.lastName === undefined
  //               //   || value.mobile === undefined
  //               //   || value.address.city === undefined
  //               //   || value.address.mainAddress === undefined
  //               //   || value.address.mobilePhone === undefined
  //               //   || value.address.name === undefined
  //               //   || value.address.pinCode === undefined
  //               //   || value.address.state === undefined
  //               //   ) {
  //               //   this.toastr.warning('Some personal details are missing. Please update your information.');
  //               //   this.router.navigate(['personal-info/account']);
  //               //  } 
  //           }else {
  //                 this.personalDetails = value;
  
  //                 // Save the cart items to Firestore
  //                 this.masterService.saveCartItemsToFirestoreForCheckout(this.allcartItems,this.total,this.personalDetails).subscribe({
  //                   next: (data) => {
  //                     this.masterService.setNavigatedToCheckout(true);
  //                         // Navigate to the checkout page only after saving is successful
  //                       this.router.navigate(['/checkout'], {
  //                         queryParams: { init: 'view=FLIPKART', loginFlow: 'false' }
  //                       });
  //                   },
  //                   error: (error) => {
  //                     // Handle any errors during the save operation
  //                     console.error('Error saving cart to Firestore:', error);
  //                     this.toastr.error('Failed to save cart. Please try again.');
  //                   },
  //                 });
  //               }
  
  //         } 
  //         // else {
  //         //   this.toastr.warning(`Please fill up your personal details`);
  //         //   this.router.navigate(['personal-info/account']);
  //         // }
  //       },
  //       error: (err) => {
  //         console.log(err);
  //       },
  //     })
  //   // } else {
  //   //   this.toastr.info(`Please signup or login to checkout`);
  //   //   this.router.navigate(['login']);
  //   // }

  // }



  goToCheckout() {
    const user = this.masterService.getUser();
  
    if (!user) {
      // User is not logged in
      this.toastr.info('Please sign up or log in to proceed to checkout.');
      this.router.navigate(['login']);
      return;
    }
  
    this.masterService.getUserDetails(user.uid).subscribe({
      next: (value) => {
        console.log(value);
        // Check for missing personal details
        if (
          !value ||
          !value.firstName ||
          !value.lastName ||
          !value.gender ||
          !value.mobile ||
          !value.address ||
          !value.address.city ||
          !value.address.mainAddress ||
          !value.address.mobilePhone ||
          !value.address.name ||
          !value.address.pinCode ||
          !value.address.state
        ) {
          this.toastr.warning('Some personal details are missing. Please update your information.');
          this.router.navigate(['personal-info/account']);
          return;
        }
  
        // All details are valid, proceed to save cart items
        this.personalDetails = value;
  
        this.masterService.saveCartItemsToFirestoreForCheckout(this.allcartItems, this.total, this.personalDetails).subscribe({
          next: (data) => {
            this.masterService.setNavigatedToCheckout(true);
            // Navigate to the checkout page after successfully saving cart
            this.router.navigate(['/checkout'], {
              queryParams: { init: 'view=FLIPKART', loginFlow: 'false' },
            });
          },
          error: (error) => {
            console.error('Error saving cart to Firestore:', error);
            this.toastr.error('Failed to save cart. Please try again.');
          },
        });
      },
      error: (err) => {
        console.error('Error fetching user details:', err);
        this.toastr.error('Failed to fetch user details. Please try again.');
      },
    });
  }
  

}
