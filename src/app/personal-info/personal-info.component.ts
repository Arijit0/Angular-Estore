import { Component, OnDestroy, OnInit } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { HeadComponent } from "../header/head/head.component";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService } from '../services/master.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AppConstants } from '../AppConstants';

@Component({
    selector: 'app-personal-info',
    standalone: true,
    imports: [SidebarComponent, CommonModule, HeadComponent, FormsModule, ReactiveFormsModule],
    templateUrl: './personal-info.component.html',
    styleUrl: './personal-info.component.css'
})
export class PersonalInfoComponent implements OnInit, OnDestroy {

  activeSection: string = 'account';
  private paramsSubscription: any;

  isEditingPersonalForm:boolean = false; // Tracks whether the personal info form is in edit mode
  isEditingEmailForm: boolean = false;   // Tracks whether the email info form is in edit mode
  isEditingMobileForm:boolean = false;   // Tracks whether the number info form is in edit mode
  isEditingAddressForm: boolean = false; // Tracks whether the address info form is in edit mode

  isEmailVerified: boolean = false;
  isAddress: boolean = false;
  isWishlist: boolean = false; // Indicates if the wishlist exists

  orderList: any[] = [];

  metaTagdata:  any = '';

  itemToRemoveFromWishlist: any;

  allProducts: any;

  personalInfoForm!: FormGroup;
  emailInfoForm!: FormGroup;
  mobileInfoForm!: FormGroup;
  passwordForm!: FormGroup;
  addressForm!: FormGroup;

  modal: any;

  private unsubscribe$ = new Subject<void>();

  wishlistItems: any[] = []; // Stores wishlist data

  isLoading: boolean = false; // Indicates if the data is loading

  loadingMessages = [
    'Fetching your data...',
    'Almost there...',
    'Preparing your results...',
    'Just a moment, please...',
  ];
  loadingMessage: string = this.loadingMessages[0];

  newEmail: string = "";
  currentPassword: string = "";

  constructor( private route: ActivatedRoute, 
    private masterService: MasterService, 
    private fb:FormBuilder,
    private toastr: ToastrService,
    private router: Router
  ) {
    // Detect active section from the route
    this.route.params.subscribe((params) => {
      this.activeSection = params['section'];
    });
   
    this.initializeForms();
    this.fetchUserDetails();
    this.fetchOrders();
  }

  ngOnInit() {
    console.log('ngOnInit called');
    this.paramsSubscription = this.route.params.subscribe((params) => {
      this.activeSection = params['section'];
        AppConstants.profileURL.title = this.activeSection;
        this.setMetaTgs();
    });

    this.loading();
    this.checkEmailVerificationStatus();
    this.fetchWishlists();
  }

  setMetaTgs() {
    this.metaTagdata = AppConstants.profileURL;
  
      // Set SEO meta tags and page title
      this.masterService.setMetaTagsAndTitle(this.metaTagdata,undefined);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    console.log('ngOnDestroy called');
    if (this.paramsSubscription) {
      this.paramsSubscription.unsubscribe();
    }
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

  initializeForms(): void {
    this.isLoading = true;
         // Initializing the form controls for personal information
         this.personalInfoForm = this.fb.group({
          firstName: [{ value: '', disabled: true },[Validators.required]],
          lastName: [{ value: '', disabled: true }, [Validators.required]],
          gender: [{ value: 'male', disabled: true }, [Validators.required]]
        });

            // Initializing the form controls for email
   this.emailInfoForm = this.fb.group({
    email: [{ value: '', disabled: true },[Validators.required,this.masterService.emailValidator()]]
  });

      // Initializing the form controls for Mobile
      this.mobileInfoForm = this.fb.group({
        mobile: [{ value: '', disabled: true },[Validators.required,this.masterService.mobileValidator()]]
      });
    
         // Initializing the form controls for Mobile
   this.passwordForm = this.fb.group({
    password: ['',[Validators.required,Validators.minLength(6)]]
  });

  // Initializing the form controls for Address
  this.addressForm = this.fb.group({
    name: [{ value: '', disabled: true },[Validators.required]],
    mobilePhone: [
      { value: '', disabled: true },
      [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
    ],
    pinCode: [
      { value: '', disabled: true },
      [Validators.required, Validators.pattern(/^\d{6}$/)],
    ],
    mainAddress: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(10)]],
    city: [{ value: '', disabled: true }, Validators.required],
    state: [{ value: '', disabled: true }, Validators.required]
  });

  this.isLoading = false;
      
  }


 get password() {
  return this.passwordForm.get('password');
}

 get email() {
  return this.emailInfoForm.get('email');
}

   // Toggle between Edit and Cancel
   toggleEdit(clickState: string) {
    const toggleForm = (form: any, controls: string[], editingFlag: boolean) => 
      controls.forEach(control => form.get(control)?.[editingFlag ? 'enable' : 'disable']());
  
    if (clickState === 'personal-form') {
      this.isEditingPersonalForm = !this.isEditingPersonalForm;
      toggleForm(this.personalInfoForm, ['firstName', 'lastName', 'gender'], this.isEditingPersonalForm);
    } 
    if (clickState === 'email') {
      this.isEditingEmailForm = !this.isEditingEmailForm;
      toggleForm(this.emailInfoForm, ['email'], this.isEditingEmailForm);
    } 
    if (clickState === 'mobile') {
      this.isEditingMobileForm = !this.isEditingMobileForm;
      toggleForm(this.mobileInfoForm, ['mobile'], this.isEditingMobileForm);
    }
    if (clickState === 'address-form') {
      this.isEditingAddressForm = !this.isEditingAddressForm;
      toggleForm(this.addressForm, ['name', 'mobilePhone', 'pinCode','mainAddress','city','state'], this.isEditingAddressForm);
    } 
  }

  // Handle the cancel action
  cancel(clickState: string) {
    if (clickState === 'personal-form') {
      this.personalInfoForm.reset({ firstName: '', lastName: '', gender: 'male' });
      this.fetchUserDetails();
      this.toggleEdit('personal-form'); // Ensure fields are disabled after reset
    } 
    if (clickState === 'email') {
      this.emailInfoForm.reset({ email: '' });
      this.fetchUserDetails();
      this.toggleEdit('email'); // Ensure fields are disabled after reset
    } 
    if(clickState === 'mobile') {
      this.mobileInfoForm.reset({ mobile: '' });
      this.fetchUserDetails();
      this.toggleEdit('mobile'); // Ensure fields are disabled after reset
    }
    if(clickState === 'address-form') {
      this.addressForm.reset({ name: '', mobilePhone: '', pinCode: '', mainAddress: '', city: '', state: ''});
      this.fetchUserDetails();
      this.toggleEdit('address-form'); // Ensure fields are disabled after reset
    }
  }

  checkEmailVerificationStatus() {
    // Subscribe to the email verification status observable
    this.masterService.emailVerified$.subscribe((verified) => {
      this.isEmailVerified = verified;  // Update the variable when the email verification status changes
    });
  }

  fetchUserDetails(): void {
    this.isLoading = true;
      const currentUser = this.masterService.getUser();
      if (currentUser) {
        this.masterService
          .getUserFromFirestore()
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe({
            next: (user: any) => {
              if (user) {
                this.emailInfoForm.patchValue({
                  email: currentUser.email || '',
                });

                this.masterService
                  .getUserDetails(currentUser.uid)
                  .pipe(takeUntil(this.unsubscribe$))
                  .subscribe({
                    next: (details) => {
                      // if (details) {
                        this.personalInfoForm.patchValue({
                          firstName: details?.firstName || '',
                          lastName: details?.lastName || '',
                          gender: details?.gender || 'male'
                        });

                        this.mobileInfoForm.patchValue({
                          mobile: details?.mobile || ''
                        });

                        this.addressForm.patchValue({
                          name: details?.address?.name || '',
                          mobilePhone: details?.address?.mobilePhone || '',
                          pinCode: details?.address?.pinCode || '',
                          mainAddress: details?.address?.mainAddress || '',
                          city: details?.address?.city || '',
                          state: details?.address?.state || ''
                        });
                        
                        console.log(details);
                        this.isLoading = false;
                      // }
                      // this.isLoading = false;
                    },
                    error: (err) => {
                      console.error('Error fetching user details:', err);
                      alert('Unable to fetch user details. Please try again later.');
                      this.isLoading = false;
                    },
                  });
              }
            },
            error: (err) => {
              console.error('Error fetching user data:', err);
              this.isLoading = false;
            },
          });
      } else {
        this.isLoading = false;
      }
  }
  

   // Fetch user's wishlist
   fetchWishlists(): void {
    const user = this.masterService.getUser();
  
    if (user) {
      this.isLoading = true; // Start loading indicator
  
      // Fetch user wishlist by product IDs
      this.masterService.getUserWishlist(user.uid).subscribe({
        next: (wishlistIds) => {
          // 'wishlistIds' is an array of product IDs from the user's wishlist
  
          console.log('User Wishlist IDs:', wishlistIds);
  
          // Fetch all products from the 'allProducts' collection
          this.masterService.getAllProducts().subscribe({
            next: (allProducts) => {
              // Filter products that are in the wishlist and map the required product details
              this.wishlistItems = allProducts.filter((product: any) => wishlistIds.includes(product.productId))
                                               .map((product: any) => ({
                                                productId: product.productId,
                                                itemImage: product.itemImage,    // Adjust according to your data structure
                                                itemName: product.itemName,         // Adjust according to your data structure
                                                itemCategory: product.itemCategory, // Adjust according to your data structure
                                                itemPrice: product.itemPrice,       // Adjust according to your data structure
                                                itemRatingRate: product.itemRatingRate, // Adjust according to your data structure
                                                 itemRatingCount: product.itemRatingCount, // Adjust according to your data structure
                                               }));
  
              // If no products are in the wishlist, show an empty state
              if (this.wishlistItems.length === 0) {
                console.log('No products in the wishlist');
              }
  
              this.isLoading = false; // Stop loading indicator
              console.log('Filtered Wishlist Products:', this.wishlistItems);
            },
            error: (error) => {
              console.error('Error fetching products:', error);
              this.isLoading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error fetching wishlist:', error);
          this.isLoading = false;
        },
      });
    } else {
      console.warn('No user logged in!');
      this.isLoading = false;
    }
  }

  // Remove from wishlist
  removeProductFromWishList(state: boolean) {
    if (state) {
      this.masterService.removeFromWishlist(this.masterService.getUser().uid,this.itemToRemoveFromWishlist.productId)    
      .then(() => {
        // this.hideModal();
        this.modal.hide();
        this.toastr.success('Removed from Wishlist!');
      })
      .catch(err => {
        // this.hideModal();
        this.modal.hide();
        console.error('Error adding to wishlist:', err);
        this.toastr.error('Could not remove from wishlist.');
  
      });
    }
  } 

  removePopup(wishlist:any) {
    // Open the confirmation modal
    this.modal = new (window as any).bootstrap.Modal(document.getElementById('confirmationModal'));
    //modal.toglle();
    //modal.show();
    //modal.hide();
    //modal.dispose();
    this.modal.show();
    this.itemToRemoveFromWishlist = wishlist;
  }

  
    // Save or update user personal details in Firestore
    onContactFormSubmit() {
      if (this.masterService.getUser() && this.personalInfoForm.valid) {
        const userDetails = this.personalInfoForm.value; // Get form values
        this.masterService.saveUserDetails(this.masterService.getUser().uid, userDetails)
          .then(() => {
            this.toastr.success('Account details updated!', 'success');
            this.cancel('personal-form'); // Disable the fields after saving
          })
          .catch(() => {
            this.toastr.error('Failed to save details. Please try again', 'error');
            this.cancel('personal-form'); // Disable the fields after saving
          });
      } else {
        if (this.personalInfoForm.invalid) {
          this.toastr.error('Please enter full name', 'error');
          this.fetchUserDetails();
          this.cancel('personal-form'); // Disable the fields after saving
        } else {
          this.toastr.error('Oops! It seems some information is missing or incorrect!', 'Failed');
          this.fetchUserDetails();
          this.cancel('personal-form'); // Disable the fields after saving
        }
      }
    }

        // Save or update user email in Firestore
    onEmailFormSubmit() {

      if (this.emailInfoForm.invalid) {
        return;
      }

      this.openPasswordMOdal();
  
      this.newEmail = this.emailInfoForm.value.email;

      this.openPasswordMOdal();
      this.cancel('email'); // Disable the fields after saving
    }

    async onPasswordFormSubmit() {

      if (this.passwordForm.invalid) {
        return;
      }

      const { password } = this.passwordForm.value;
  
      try {
        await this.masterService.updateEmailAfterVerification(password,this.newEmail);
        this.modal.hide();
        this.toastr.success('Email successfully updated!', 'success');
      } catch (error) {
        this.modal.hide();
        // alert('Failed to update email: ' + error.message);
        this.toastr.error(`${error}'`);
        console.log(error);
      }

    }

        // Save or update user mobile number`q in Firestore
    onMobileFormSubmit() {
      if (this.masterService.getUser() && this.mobileInfoForm.valid) {
        const userDetails = this.mobileInfoForm.value; // Get form values
        this.masterService.saveUserDetails(this.masterService.getUser().uid, userDetails)
          .then(() => {
            this.toastr.success('Mobile number updated!', 'success');
            this.cancel('mobile'); // Disable the fields after saving
          })
          .catch((error) => {
            console.error('Error saving details:', error);
            alert('Failed to save details. Please try again.');
            this.cancel('mobile'); // Disable the fields after saving
          });
      } else {
        if(this.mobileInfoForm.invalid) {
          this.toastr.error('Please enter a valid 10-digit mobile number', 'Error');
          this.fetchUserDetails();
          this.cancel('mobile'); // Disable the fields after saving
        }else {
          this.toastr.error('Oops! It seems some information is missing or incorrect!', 'error');
          this.fetchUserDetails();
          this.cancel('mobile'); // Disable the fields after saving
        }
      }
    }

    onAddressFormSubmit() {
      if (this.masterService.getUser() && this.addressForm.valid) {

         // Object to store form values
        const addressData: { [key: string]: any } = {};

      // Store form values in the object
      addressData['address'] = this.addressForm.value;

        this.masterService.saveUserDetails(this.masterService.getUser().uid, addressData)
          .then(() => {
            this.toastr.success('Address updated!', 'success');
            this.cancel('address-form'); // Disable the fields after saving
          })
          .catch((error) => {
            console.error('Error saving details:', error);
            this.toastr.error(`${error}`, 'error');
            this.cancel('address-form'); // Disable the fields after saving
          });
       } else {
           this.toastr.error('Oops! It seems some information is missing or incorrect!', 'error');
           this.fetchUserDetails();
           this.cancel('address-form'); // Disable the fields after saving
        }
    }

    async onSendVerificationEmail() {
        const result = await this.masterService.sendVerificationEmail();
      if (result.success) {
        this.toastr.success(result.message, 'Email Sent');
        this.checkEmailVerificationStatus(); // Refresh the status
      } else {
        this.toastr.error(result.message, 'Error');
        this.checkEmailVerificationStatus(); // Refresh the status
      }
    }

    openPasswordMOdal() {
          // Open the confirmation modal
        this.modal = new (window as any).bootstrap.Modal(document.getElementById('passwordModal'));
        //modal.toglle();
        //modal.show();
        //modal.hide();
        //modal.dispose();
        this.modal.show();
    }

    // hideModal(): void {
    //   if (this.modal) {
    //     // Hide the modal
    //     this.modal.hide();
    
    //     // Ensure the backdrop is removed
    //     const backdrop = document.querySelector('.modal-backdrop');
    //     if (backdrop) {
    //       backdrop.parentNode?.removeChild(backdrop);
    //     }
    
    //     // Dispose of the modal instance to prevent memory leaks
    //     this.modal.dispose();
    //     this.modal = null;
    //   }
    // }

    goToDetails(item: any) {
      this.router.navigate(['/products', item.productId, item.itemName]);
    }
    
    fetchOrders() {
      this.isLoading = true;
      this.masterService.getUserOrders(this.masterService.getUser().uid).subscribe({
        next: (orders) => {
          // console.log(orders);
          // this.orderList = orders;
          this.orderList = orders.map((order) => ({
            ...order,
            orderDate: new Date(order.orderDate.seconds * 1000), // Convert Firestore timestamp to JS Date
          }));
          this.isLoading = false;
          console.log(this.orderList);
        },
        error: (err) => {
          console.log(err);
          this.isLoading = false;
        },
      })
    }

}
