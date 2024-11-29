import { Component } from '@angular/core';
import { HeadComponent } from "../header/head/head.component";
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router, RouterLink } from '@angular/router';
import { MasterService } from '../services/master.service';
import { ToastrService } from 'ngx-toastr';
import { getAuth, sendEmailVerification } from '@angular/fire/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [HeadComponent,CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {

  authForm!: FormGroup;

  constructor(private fireAuthService: AngularFireAuth, 
    private masterService: MasterService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.initForm();
  }

  initForm() {
    this.authForm = this.masterService.createContactForm(); // Initialize the Contact form
  }
  
  // Getter for email and password fields
  get contact() {
    return this.authForm.get('email');
  }

  get password() {
    return this.authForm.get('password');
  }

  // Submit the form
  onContactFormSubmit() {
    if (this.authForm.invalid) return;
    const { email, password } = this.authForm.value;
    // phoneNumber =this.masterService.formatPhoneNumber(phoneNumber);

     // Check if the user already exists
     this.fireAuthService.fetchSignInMethodsForEmail(email).then((methods) => {
      if (methods.length > 0) {
        // console.log('User already exists. Email:', email);
        this.toastr.error('You are already registered. Please log in', 'Failed');
      } else {
        // Create a new user
        this.fireAuthService.createUserWithEmailAndPassword(email, password)
          .then(async (userCredential) => {
            console.log('User signed up:', userCredential.user);

            const auth = getAuth();
            const userLoginState: any = auth.currentUser;

            sendEmailVerification(userLoginState)
              .then(() => {
                console.log('Verification email sent!');
                this.toastr.success('Verification email sent successfully', 'Send');
              })
              .catch((error) => {
                this.toastr.error('Failed to send verification email. Please try again.', 'Error');
                console.error('Error sending verification email:', error);
              });

            const user = {
              uid: userCredential.user?.uid,
              email: userCredential.user?.email,
              displayName: userCredential.user?.displayName || 'Guest'
            };
          
            this.fireAuthService.signInWithEmailAndPassword(email, password);
          
            // Store user data in localStorage
            this.masterService.storeUser(user);
          
            this.router.navigateByUrl('/personal-info');

          })
          .catch((error) => {
            console.error('Error signing up:', error.message);
            this.toastr.error('You are already registered. Please log in', 'Failed');
            this.router.navigate(['/login']);
          });
      }
    }).catch((error) => {
      console.error('Error checking user existence:', error);
    });
  }
}
