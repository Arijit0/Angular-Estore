import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MasterService } from '../services/master.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule,RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  userDetails: any = {};

  isSidebarActive = false;

  isLoading: boolean = true;

  constructor(private masterService: MasterService) {
    this.fectUserdetails();
  }

  toggleSidebar() {
    this.isSidebarActive = !this.isSidebarActive;
  }

  fectUserdetails() {

        // Simulate data fetching with a delay
        setTimeout(() => {
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
                this.isLoading = false;
              }else {
                this.userDetails = {
                  firstName: 'Guest',
                  lastName: '',
                  gender: 'male'
                };
                this.isLoading = false;
              }
            },
            error: (err) => {
              console.error('Failed to fetch user details:', err);
              // Handle error, e.g., show an error message to the user
              alert('Unable to fetch user details. Please try again later.');
              this.isLoading = false;
            }
          });
          }
        }
      });
      }
          
        }, 3000); // Simulate 3-second loading

   }

   logOut() {
    this.masterService.onLogout();
  }

}
