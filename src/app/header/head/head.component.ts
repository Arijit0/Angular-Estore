import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { MasterService } from '../../services/master.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-head',
    imports: [FormsModule, CommonModule,RouterModule],
    templateUrl: './head.component.html',
    styleUrl: './head.component.css'
})
export class HeadComponent implements OnInit{

  userDetails: any;
  isUserLoggedIn: boolean = false;

  isLoading: boolean = true; // Initially loading

  activeSection = 'account'; // Default section

  HeaderForCheckoutPageStatus: boolean = false;

  isHovering: boolean = false;
  searchTerm: any = "";
  showCartIcon = true;
  cartItems: any;
  cartItemCount: number = 0;

  constructor(private router: Router,
    private masterService: MasterService,
    private route: ActivatedRoute
  ) {
    this.showingCartIcon();
    this.fectUserdetails();
  }
  ngOnInit(): void {
    this.applyHeaderForCheckoutPage();
  }
   
  applyHeaderForCheckoutPage() {
    this.HeaderForCheckoutPageStatus = this.masterService.getHeaderStatusForCheckout();
    console.log(this.HeaderForCheckoutPageStatus);
  }

  mouseEnter() {
    this.isHovering = true;
  }

  mouseLeave() {
    this.isHovering = false;
  }

  search() {
   this.router.navigate([`/search/${this.searchTerm}`]);
  }

  showingCartIcon() {
    this.isLoading = true;
    this.showCartIcon = !this.masterService.isCartPage();
    this.cartItemsCount();
  }

  // async cartItemsCount() {
  //   // this.cartItems = JSON.parse(localStorage.getItem('product') || '{}');
  //   if(await this.masterService.fetchCartItems()) {
  //     this.masterService.fetchCartItems().then((items) => {
  //       this.cartItemCount = items.length;
  //     });
  //   }
  // }

  async cartItemsCount() {
    try {
      const items = await this.masterService.fetchCartItems();
      this.cartItemCount = items.length;
      this.isLoading = false;
    } catch (error) {
      console.error('Error fetching cart items count:', error);
      this.cartItemCount = 0; // Fallback to 0 in case of an error
      this.isLoading = false;
    }
  }

  fectUserdetails() {
    if(this.masterService.getUser()) {
          // Fetch user data if logged in
    this.masterService.getUserFromFirestore().subscribe((user: any) => {
      if (user) {
        if(this.masterService.getUser()) {
                  // Fetch details from Firestore
        this.masterService.getUserDetails(this.masterService.getUser().uid).subscribe({
          next: (details) => {
            if (details) {
              this.userDetails = {
                firstName: details.firstName || 'Guest',
                lastName: details.lastName || '',
                gender: details.gender || 'male'
              };
              console.log('User details fetched successfully:', details);
              this.isUserLoggedIn = true;
              this.isLoading = false;
            }else {
              this.userDetails = {
                firstName: 'Guest',
                lastName: '',
                gender: 'male'
              };
              this.isUserLoggedIn = true;
              this.isLoading = false;
            }
          },
          error: (err) => {
            console.error('Failed to fetch user details:', err);
            // Handle error, e.g., show an error message to the user
            alert('Unable to fetch user details. Please try again later.');
            this.isUserLoggedIn = false;
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false; // Stop the spinner after loading is complete
          },
        });
        }
      }
    });
    }
   }

  logOut() {
    this.masterService.onLogout();
    this.isUserLoggedIn = false;
  }
}
