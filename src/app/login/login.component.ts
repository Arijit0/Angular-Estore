import { Component } from '@angular/core';
import { HeadComponent } from '../header/head/head.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MasterService } from '../services/master.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    imports: [HeadComponent, ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {

  authForm!: FormGroup;

  constructor(
    private fireAuthService: AngularFireAuth, 
    private masterService: MasterService,
    private router: Router,
    private toastr: ToastrService
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
  async onLoginFormSubmit() {
    if (this.authForm.invalid) {
      return;
    }

    const { email, password } = this.authForm.value;

    try {
      const userCredential = await this.fireAuthService.signInWithEmailAndPassword(email, password);

       // Fetch user data
    const userData = userCredential.user;

      if (userData) {
        const user = {
          uid: userCredential.user?.uid,
          email: userCredential.user?.email,
          displayName: userCredential.user?.displayName || 'Guest'
        };

        // Store user data in localStorage
        this.masterService.storeUser(user);

        this.router.navigateByUrl('/personal-info');
    }
    } catch (error) {
      this.toastr.error('Email or password is incorrect', 'Failed');
    }
  }
}
