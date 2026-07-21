import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup-form',
  imports: [
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signup-form.component.html',
  styles: ''
})
export class SignupFormComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.country = this.detectCountry();
  }

  private detectCountry(): string {
    try {
      const locale = (navigator.language || (navigator as any).userLanguage || '') as string;
      const parts = locale.split(/[-_]/);
      if (parts.length >= 2 && parts[1].length === 2) {
        return parts[1].toUpperCase();
      }
    } catch {
      // ignore
    }
    return '';
  }
  
  showPassword = false;
  confirmPassword = false;
  isCheckedOne = false;  
  isChecked = true;

  fname = '';
  lname = '';
  jtitle = '';
  cname = '';
  pnumber = '';
  selectedValue = '';
  email = '';
  password = '';
  confirmpassword = '';

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  errors = {
    fname: '',
    lname: '',
    jtitle: '',
    cname: '',
    pnumber: '',
    email: '',
    password: '',
    confirmpassword: ''
  };

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordVisibilityOne() {
    this.confirmPassword = !this.confirmPassword;
  }

  generateSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  validateForm(): boolean {
    let isValid = true;
    this.errors = {
      fname: '',
      lname: '',
      jtitle: '',
      cname: '',
      pnumber: '',
      email: '',
      password: '',
      confirmpassword: ''
    };

    const nameAlphaRegex = /^[A-Za-z]+$/;
    const employeeAllowed = new Set(['1-10', '11-50', '51-200', '201-500', '500+']);


    if (!this.fname.trim()) {
      this.errors.fname = 'First name is required';
      isValid = false;
    } else if (!nameAlphaRegex.test(this.fname.trim())) {
      this.errors.fname = 'First name must contain alphabets only';
      isValid = false;
    }

    if (!this.lname.trim()) {
      this.errors.lname = 'Last name is required';
      isValid = false;
    } else if (!nameAlphaRegex.test(this.lname.trim())) {
      this.errors.lname = 'Last name must contain alphabets only';
      isValid = false;
    }


    // Job Title (optional): do not enforce any character validation
    // (If provided, we only send it to the API as-is.)


    if (!this.cname.trim()) {
      this.errors.cname = 'Company name is required';
      isValid = false;
    } else {
      const companyRegex = /^[A-Za-z0-9\s\-\.,&()'"/]+$/;
      if (!companyRegex.test(this.cname.trim())) {
        this.errors.cname = 'Company name contains invalid characters';
        isValid = false;
      }
    }


    if (!this.pnumber.trim()) {
      this.errors.pnumber = 'Phone number is required';
      isValid = false;
    } else {
      const phoneDigitsRegex = /^[0-9]+$/;
      if (!phoneDigitsRegex.test(this.pnumber.trim())) {
        this.errors.pnumber = 'Phone number must contain digits only';
        isValid = false;
      }
    }


    if (!this.email.trim()) {
      this.errors.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.password) {
      this.errors.password = 'Password is required';
      isValid = false;
    } else {
      // Must include: uppercase, lowercase, number, special character
      const upperRegex = /[A-Z]/;
      const lowerRegex = /[a-z]/;
      const numberRegex = /[0-9]/;
      const specialRegex = /[^A-Za-z0-9]/;

      if (this.password.length < 12) {
        this.errors.password = 'Password must be at least 12 characters';
        isValid = false;
      } else if (!upperRegex.test(this.password) || !lowerRegex.test(this.password) || !numberRegex.test(this.password) || !specialRegex.test(this.password)) {
        this.errors.password = 'Password must include uppercase, lowercase, number, and special character';
        isValid = false;
      }
    }


    if (!this.confirmpassword) {
      this.errors.confirmpassword = 'Please confirm your password';
      isValid = false;
    } else if (this.password !== this.confirmpassword) {
      this.errors.confirmpassword = 'Passwords do not match';
      isValid = false;
    }

    // Number of Employees (optional): if selected, must be one of allowed values
    if (this.selectedValue && !employeeAllowed.has(this.selectedValue)) {
      this.isLoading = false;
      isValid = false;
    }

    if (!this.isChecked) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      isValid = false;
    }

    return isValid;
  }


  isValidEmail(email: string): boolean {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  }

  private extractOrgId(res: any): string | null {
    if (!res || typeof res !== 'object') return null;
    return (
      res?.membership?.id ||
      res?.organization?.id ||
      res?.orgId ||
      res?.organizationId ||
      res?.org?.id ||
      null
    );
  }
  
  // onSignIn() {
  // onSignUp() {
  //   console.log('First Name:', this.fname);
  //   console.log('Last Name:', this.lname);
  //   console.log('Job Title:', this.jtitle);
  //   console.log('Company Name:', this.cname);
  //   console.log('Country:', this.country);    
  //   console.log('Phone Number:', this.pnumber);
  //   console.log('Number of Employees:', this.selectedValue);
    
  //   console.log('Email:', this.email);
  //   console.log('Password:', this.password);
  //   console.log('Confirm Password:', this.confirmpassword);

  //   console.log('Remember Me:', this.isCheckedOne);
  //   console.log('Remember Me:', this.isChecked);
  // }

  onSignUp() {
    if (!this.validateForm()) {
      return;
    }

    const payload: any = {
      country: this.country,
      email: this.email,
      password: this.password,
      firstName: this.fname,
      lastName: this.lname,
      phoneNumber: this.pnumber,
      receiveProductUpdates: this.isCheckedOne,
      acceptedTerms: this.isChecked,
      organizationSlug: this.generateSlug(this.cname),
      organizationName: this.cname.trim(),
    };

    if (this.jtitle.trim()) payload.jobTitle = this.jtitle.trim();
    if (this.selectedValue) payload.employeeCount = this.selectedValue;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.signup(payload).subscribe({
      next: (res) => {
        console.log('Signup successful. Full response:', JSON.stringify(res, null, 2));

        const orgId = this.extractOrgId(res);
        const userEmail = res?.user?.email || this.email;

        if (orgId) {
          localStorage.setItem('org_id', orgId);
          localStorage.setItem('organizationId', orgId);
          const companyName = this.cname?.trim();
          if (companyName) {
            localStorage.setItem('organizationName', companyName);
            localStorage.setItem('org_name', companyName);
          }
        } else {
          console.warn('Organization ID not found in signup response. Available keys:', Object.keys(res || {}));
        }
        this.successMessage = 'Account created successfully! Please verify your email.';

        try {
          localStorage.setItem('verification_email', userEmail);
          sessionStorage.setItem('verification_password', this.password);
        } catch {
        }
        this.isLoading = false;
        this.router.navigate(['/verification']);
      },
      error: (err) => {
        console.error('Signup error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error body:', JSON.stringify(err.error, null, 2));
        console.error('Payload being sent:', JSON.stringify(payload, null, 2));

        if (err.status === 409) {
          this.errorMessage = err.error?.detail || 'Email or company name already registered. Please use a different email or sign in.';
        }

        this.isLoading = false;
      }
    });
  }
}

