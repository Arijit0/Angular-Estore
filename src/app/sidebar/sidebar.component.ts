import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { MasterService } from '../services/master.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink,RouterModule,CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  userDetails: any = {};

  constructor(private masterService: MasterService) {
    this.fectUserdetails();
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
            }else {
              this.userDetails = {
                firstName: 'Guest',
                lastName: '',
                gender: 'male'
              };
            }
          },
          error: (err) => {
            console.error('Failed to fetch user details:', err);
            // Handle error, e.g., show an error message to the user
            alert('Unable to fetch user details. Please try again later.');
          }
        });
        }
      }
    });
    }
   }

   logOut() {
    this.masterService.onLogout();
  }

}
