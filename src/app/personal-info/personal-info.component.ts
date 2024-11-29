import { Component, Input } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeadComponent } from "../header/head/head.component";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService } from '../services/master.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [SidebarComponent, CommonModule, HeadComponent,FormsModule,ReactiveFormsModule],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.css'
})
export class PersonalInfoComponent {

  activeSection = 'account'; // Default section
  isEditingPersonalForm:boolean = false; // Tracks whether the personal info form is in edit mode
  isEditingEmailForm: boolean = false;   // Tracks whether the email info form is in edit mode
  isEditingMobileForm:boolean = false;   // Tracks whether the number info form is in edit mode

  isEmailVerified: boolean = false;

  personalInfoForm!: FormGroup;
  emailInfoForm!: FormGroup;
  mobileInfoForm!: FormGroup;
  passwordForm!: FormGroup;

  modal: any;

  newEmail: string = "";
  currentPassword: string = "";

  constructor(private route: ActivatedRoute, 
    private masterService: MasterService, 
    private fb:FormBuilder,
    private toastr: ToastrService
  ) {
    // Detect active section from the route
    this.route.params.subscribe((params) => {
      this.activeSection = params['section'] || 'account';
    });
    this.initContactForm();
    this.initEmailForm();
    this.initMobileForm();
    this.initPasswordForm();
    this.fectUserdetails();
    this.checkEmailVerificationStatus();
  }

  initContactForm() {
     // Initializing the form controls for personal information
    this.personalInfoForm = this.fb.group({
      firstName: [{ value: '', disabled: true },[Validators.required]],
      lastName: [{ value: '', disabled: true }, [Validators.required]],
      gender: [{ value: 'male', disabled: true }, [Validators.required]]
    });
  
  }

  initEmailForm() {
    // Initializing the form controls for email
   this.emailInfoForm = this.fb.group({
     email: [{ value: '', disabled: true },[Validators.required,this.masterService.emailValidator()]]
   });
 
 }

  initMobileForm() {
    // Initializing the form controls for Mobile
   this.mobileInfoForm = this.fb.group({
     mobile: [{ value: '', disabled: true },[Validators.required,this.masterService.mobileValidator()]]
   });
 
 }

  initPasswordForm() {
    // Initializing the form controls for Mobile
   this.passwordForm = this.fb.group({
     password: ['',[Validators.required,Validators.minLength(6)]]
   });
 
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
    } else if (clickState === 'email') {
      this.isEditingEmailForm = !this.isEditingEmailForm;
      toggleForm(this.emailInfoForm, ['email'], this.isEditingEmailForm);
    } else {
      this.isEditingMobileForm = !this.isEditingMobileForm;
      toggleForm(this.mobileInfoForm, ['mobile'], this.isEditingMobileForm);
    }
  }

  // Handle the cancel action
  cancel(clickState: string) {
    if (clickState === 'personal-form') {
      this.personalInfoForm.reset({ firstName: '', lastName: '', gender: 'male' });
      this.toggleEdit('personal-form'); // Ensure fields are disabled after reset
    } else if (clickState === 'email') {
      this.emailInfoForm.reset({ email: '' });
      this.toggleEdit('email'); // Ensure fields are disabled after reset
    } else {
      this.mobileInfoForm.reset({ mobile: '' });
      this.toggleEdit('mobile'); // Ensure fields are disabled after reset
    }
  }

  checkEmailVerificationStatus() {
    this.masterService.checkEmailVerificationStatus().subscribe(res => {
      console.log(res);
      this.isEmailVerified = res;
    }, error => {
      this.isEmailVerified = error;
    })
  }

   fectUserdetails() {
    if(this.masterService.getUser()) {
          // Fetch user data if logged in
    this.masterService.getUserFromFirestore().subscribe((user: any) => {
      if (user) {
        if(this.masterService.getUser()) {

          const userEmail = this.masterService.getUser().email;
            // Update the email information form with locastorage user details
          this.emailInfoForm.patchValue({
            email: userEmail || ''
          });

           // Fetch details from Firestore
        this.masterService.getUserDetails(this.masterService.getUser().uid).subscribe({
          next: (details) => {
            if (details) {
              // Update the personal information form with user details
              this.personalInfoForm.patchValue({
                firstName: details.firstName || '',
                lastName: details.lastName || '',
                gender: details.gender || 'male'
              });

              // Update the mobile information form with user details
              this.mobileInfoForm.patchValue({
                mobile: details.mobile || ''
              });
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

    // Save or update user personal details in Firestore
    onContactFormSubmit() {
      if (this.masterService.getUser() && this.personalInfoForm.valid) {
        const userDetails = this.personalInfoForm.value; // Get form values
        this.masterService.saveUserDetails(this.masterService.getUser().uid, userDetails)
          .then(() => {
            this.toastr.success('Account details updated!', 'success');
            this.toggleEdit('personal-form'); // Disable the fields after saving
          })
          .catch((error) => {
            console.error('Error saving details:', error);
            alert('Failed to save details. Please try again.');
            this.toggleEdit('personal-form'); // Disable the fields after saving
          });
      } else {
        this.toastr.error('Oops! It seems some information is missing or incorrect!', 'Failed');
        this.fectUserdetails();
        this.toggleEdit('personal-form'); // Disable the fields after saving
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
      this.toggleEdit('email'); // Disable the fields after saving
    }

    async onPasswordFormSubmit() {

      if (this.passwordForm.invalid) {
        return;
      }

      this.currentPassword = JSON.stringify(this.passwordForm.value);
  
      try {
        await this.masterService.updateEmailAfterVerification(this.passwordForm.value.password,this.newEmail);
        this.hideModal();
        this.toastr.success('Email successfully updated!', 'success');
      } catch (error) {
        this.hideModal();
        // alert('Failed to update email: ' + error.message);
        this.toastr.error(`${error}'`);
        console.log(error);
      }

    }

        // Save or update user personal details in Firestore
    onMobileFormSubmit() {
      if (this.masterService.getUser() && this.mobileInfoForm.valid) {
        const userDetails = this.mobileInfoForm.value; // Get form values
        this.masterService.saveUserDetails(this.masterService.getUser().uid, userDetails)
          .then(() => {
            this.toastr.success('Account details updated!', 'success');
            this.toggleEdit('mobile'); // Disable the fields after saving
          })
          .catch((error) => {
            console.error('Error saving details:', error);
            alert('Failed to save details. Please try again.');
            this.toggleEdit('mobile'); // Disable the fields after saving
          });
      } else {
        this.toastr.error('Oops! It seems some information is missing or incorrect!', 'Failed');
        this.fectUserdetails();
        this.toggleEdit('mobile'); // Disable the fields after saving
      }
    }

    emailVerify() {
      this.masterService.sendVerificationEmail();
      this.checkEmailVerificationStatus(); // Refresh the status
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

    hideModal(): void {
      if (this.modal) {
        // Hide the modal
        this.modal.hide();
    
        // Ensure the backdrop is removed
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.parentNode?.removeChild(backdrop);
        }
    
        // Dispose of the modal instance to prevent memory leaks
        this.modal.dispose();
        this.modal = null;
      }
    }
    

}
