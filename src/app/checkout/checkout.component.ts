import { AfterViewInit, Component, OnInit } from '@angular/core';
import { HeadComponent } from "../header/head/head.component";
import { MasterService } from '../services/master.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CheckoutItems } from '../CheckoutItems';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Fireworks } from 'fireworks-js'
import { AppConstants } from '../AppConstants';
declare var Razorpay: any; // Declare the Razorpay global object


@Component({
  selector: 'app-checkout',
  imports: [HeadComponent,CommonModule,ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit,AfterViewInit{

  checkoutItems: any = {};  // Define checkoutItems as an array of CheckoutItems

  paymentForm!: FormGroup;

  orderData: any = {};

  isOrderSuccessful: boolean = false;
  
  isLoading: boolean = false; // Indicates if the data is loading

  loadingMessages = [
    'Fetching your data...',
    'Almost there...',
    'Preparing your results...',
    'Just a moment, please...',
  ];
  loadingMessage: string = this.loadingMessages[0];


  constructor(
    private masterService: MasterService,
    private router: Router,
    private fb:FormBuilder,
    private toaster: ToastrService
  ) {}


  ngAfterViewInit(): void {
    if (this.isOrderSuccessful) {
      this.loadFireworks();
    }
  }

  ngOnInit(): void {
    this.setMetaTgs();
    this.loading();
    this.fetchItems();
    this.initializeForm();
  }

  setMetaTgs() {
    const data = AppConstants.checkoutURL;
  
      // Set SEO meta tags and page title
      this.masterService.setMetaTagsAndTitle(data,undefined);
  }

  onOrderSuccess() {
    this.isOrderSuccessful = true;
    this.startFireworks();
  }

  loadFireworks() {
    // Wait for the Fireworks script to load and then run the fireworks animation
    const container = document.getElementById('fireworks-container');
    if (container) {
      this.startFireworks();
    } else {
      // If Fireworks is not available yet, retry after a small delay
      setTimeout(() => this.loadFireworks(), 10);
    }
  }

    // Method to trigger fireworks animation
    startFireworks() {
      const container = document.getElementById('fireworks-container');
  
      if (container) {
        const fireworks = new Fireworks(container, {
              autoresize: true,
              opacity: 1,
              acceleration: 1.05,
              friction: 0.97,
              gravity: 1.5,
              particles: 50,
              traceLength: 3,
              traceSpeed: 10,
              explosion: 5,
              intensity: 30,
              flickering: 50,
              lineStyle: 'round',
              hue: {
                min: 0,
                max: 360
              },
              delay: {
                min: 30,
                max: 60
              },
              rocketsPoint: {
                min: 50,
                max: 50
              },
              lineWidth: {
                explosion: {
                  min: 1,
                  max: 3
                },
                trace: {
                  min: 1,
                  max: 2
                }
              },
              brightness: {
                min: 50,
                max: 80
              },
              decay: {
                min: 0.015,
                max: 0.03
              },
              mouse: {
                click: false,
                move: false,
                max: 1
              }
        });
  
        // fireworks.start();



        // Start the fireworks after a slight delay
        setTimeout(() => {
          console.log('Starting fireworks show!');
          fireworks.start();

           // Play the sound when fireworks start
          //  fireworks.playSound();

          
          // Stop the fireworks after 10 seconds
          setTimeout(() => {
            console.log('Stopping fireworks show.');
            fireworks.stop();
            this.router.navigateByUrl('personal-info/my-orders');
          }, 5000); // 10 seconds
        }, 1000); // 1-second delay to ensure everything loads properly

      } 
      else {
        console.error('Fireworks container not found.');
      }
    }

  initializeForm() {
      // Initializing the form controls for personal information
    this.paymentForm = this.fb.group({
      paymentMethod: ['',[Validators.required]]
    });
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

  fetchItems(): void {

    this.isLoading = true;

    const user = this.masterService.getUser();

    if (!this.masterService.getNavigatedToCheckout()) {
      this.router.navigate(['viewcart']); // Redirect if accessed directly via URL
      this.isLoading = false;
    } else {
      this.masterService.setNavigatedToCheckout(false); // Reset after access

      this.masterService.fetchCheckoutItemByUserId(user.uid).subscribe({
        next: (value: any[]| undefined) => {
          if (value) {
            this.checkoutItems = value;  // Assign the full CheckoutItems array
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.log('fetching failed', err);
          this.isLoading = false;
        },
      })
    }
  }

  onPaymentFormSubmit() {
    this.isLoading = true;
    if (this.masterService.getUser() && this.paymentForm.valid && this.checkoutItems) {
      const paymentDetails = this.paymentForm.value; // Get form values
      // console.log(paymentDetails);
      // console.log(this.paymentForm.value);
      // paymentDetails.paymentMethod == 'cod'
      // paymentDetails.paymentMethod == 'razorpay'
      if(paymentDetails.paymentMethod == 'cod') {

        this.orderData = this.checkoutItems;

        // Dynamically set the payment method in orderData
          this.orderData.paymentMethod = paymentDetails.paymentMethod;

          // Add the current time as the order date when the payment method is selected
          this.orderData.orderDate = new Date();
          
          this.masterService.storeOrderDetailsInFirestore(this.orderData).subscribe({
            next: (data) => {
              if (data) {
                this.masterService.clearCartItems(this.orderData.userId).subscribe({
                  next: (value) => {
                    if (value) {
                      this.isOrderSuccessful = true;
                      this.loadFireworks(); // Start the animation when the order is successful
                      this.toaster.success('Order Placed successfully!');
                      // this.router.navigateByUrl('personal-info/my-orders');
                    }
                  },
                  error: (err) => {
                    this.toaster.error(err);
                    this.isLoading = false;
                  },
                })
              }
            },
            error: (err) => {
              this.toaster.error(err);
            },
          })
      } else if (paymentDetails.paymentMethod === 'razorpay') {
        // Razorpay Integration
        this.initializeRazorpay();
      }
    } 
  }

  initializeRazorpay() {
    const razorpayOptions = {
      key: 'rzp_test_ElRvj66LGdXerw', // Replace with your actual test key
      key_id: 'rzp_test_ElRvj66LGdXerw',   // Replace with Razorpay key_id
      key_secret: 'v59V185Vk00UaEhbjeD5U2Vj', // Replace with Razorpay key_secret
      amount: this.checkoutItems.totalAmount * 100, // Convert to paise
      currency: 'INR',
      name: 'Angular-Estore',
      description: 'Test Transaction',
      handler: (response: any) => {
        // Handle successful payment
        this.orderData = this.checkoutItems;
        this.orderData.paymentMethod = 'Razorpay';
        this.orderData.orderDate = new Date();
        this.orderData.paymentId = response.razorpay_payment_id;
  
        this.masterService.storeOrderDetailsInFirestore(this.orderData).subscribe({
          next: () => {
            this.masterService.clearCartItems(this.orderData.userId).subscribe({
              next: (value) => {
                if (value) {
                  this.isOrderSuccessful = true;
                  this.loadFireworks(); // Start the animation when the order is successful
                  this.toaster.success('Order Placed successfully!');
                  // this.isLoading = false;
                  // this.router.navigateByUrl('personal-info/my-orders');
                }
              },
              error: (err) => {
                this.toaster.error(err);
                this.isLoading = false;
              },
            })

            // this.isOrderSuccessful = true;
            // this.loadFireworks();
            // this.toaster.success('Order placed successfully!');
          },
          error: (err) => this.toaster.error(err),
        });
      },
      prefill: {
        name: this.checkoutItems.personalDetails.firstName,
        email: this.checkoutItems.userEmail,
        contact: this.checkoutItems.personalDetails.mobile, // Dummy contact for testing
      },
      theme: {
        color: '#3399cc',
      },
      modal: {
        // Triggered when the modal is closed, including cancellations (e.g., user cancels the payment)
        ondismiss: () => {
          console.warn('Payment modal closed by the user.');
          this.toaster.error('Payment failed. Please try again.');
          // Perform any necessary actions, such as resetting UI or updating logs
          this.router.navigateByUrl('viewcart');
        }
      }
    };
  
    const rzp = new Razorpay(razorpayOptions);

    // Handle payment failure 
    rzp.on('payment.failed', (response: any) => {
      console.error('Payment Failed:', response);
      this.toaster.error('Payment failed. Please try again.');
    });
    rzp.open();
  }


}
