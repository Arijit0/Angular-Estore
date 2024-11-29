import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MasterService } from '../../services/master.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-head',
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './head.component.html',
    styleUrl: './head.component.css'
})
export class HeadComponent {

  userDetails: any;
  isUserLoggedIn: boolean = false;

  constructor(private router: Router,private masterService: MasterService){
    this.showingCartIcon();
    this.fectUserdetails();
  }

  isHovering: boolean = false;
  searchTerm: any = "";
  showCartIcon = true;
  cartItems: any;
  cartItemCount: number = 0;

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
    this.showCartIcon = !this.masterService.isCartPage();
    this.cartItemsCount();
  }

  cartItemsCount() {
    // this.cartItems = JSON.parse(localStorage.getItem('product') || '{}');
    if(this.masterService.cartItems()) {
      this.cartItems = this.masterService.cartItems();
      this.cartItemCount = this.cartItems.length;
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
                firstName: details.firstName || '',
                lastName: details.lastName || '',
                gender: details.gender || 'male'
              };
              console.log('User details fetched successfully:', details);
              this.isUserLoggedIn = true;
            }else {
              this.userDetails = {
                firstName: 'Guest',
                lastName: '',
                gender: 'male'
              };
              this.isUserLoggedIn = true;
            }
          },
          error: (err) => {
            console.error('Failed to fetch user details:', err);
            // Handle error, e.g., show an error message to the user
            alert('Unable to fetch user details. Please try again later.');
            this.isUserLoggedIn = false;
          }
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
