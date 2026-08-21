import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { ChangePlanRequest } from '../../core/models/subscription.models';

declare global {
  interface Window {
    Stripe: any;
  }
}

@Component({
  selector: 'app-complete-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './complete-subscription.component.html',
  styles: ``
})
export class CompleteSubscriptionComponent implements OnInit, OnDestroy {
  plan: any = null;
  isLoading = false;
  errorMessage = '';
  billingForm: FormGroup;
  stripe: any = null;
  cardElement: any = null;
  cardErrors: string = '';
  private destroy$ = new Subscription();

  @ViewChild('cardNumber', { static: false }) cardNumberRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.billingForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      billingEmail: ['', [Validators.required, Validators.email]],
      billingAddress: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', Validators.required],
      postcode: ['', Validators.required],
      country: ['GB', Validators.required],
      cardHolderName: ['', Validators.required],
      vatNumber: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const planEncoded = params['plan'];
      if (planEncoded) {
        try {
          this.plan = JSON.parse(atob(planEncoded));
        } catch {
          this.plan = null;
        }
      }
    });

    this.loadStripe();
  }

  ngOnDestroy(): void {
    this.destroy$.unsubscribe();
    if (this.cardElement) {
      this.cardElement.unmount();
    }
  }

  loadStripe(): void {
    if (window.Stripe) {
      this.initStripe();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => this.initStripe();
    document.head.appendChild(script);
  }

  initStripe(): void {
    try {
      this.stripe = window.Stripe('pk_test_51RdXPoIcFjCeeaggwPWJMyzNbjLZS24qSHpJRkgxEJAHCoNAKmsbE4dPYaCJRyKrQtEzWrJhgRt3RBQHzeCAWOAM00Ib97iV3O');
      
      const elements = this.stripe.elements({
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }]
      });

      const style = {
        base: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#1e293b',
          '::placeholder': { color: '#94a3b8' }
        },
        invalid: { color: '#dc2626' }
      };

      const cardNumber = elements.create('cardNumber', { 
        style,
        placeholder: '4242 4242 4242 4242',
        showIcon: true
      });
      
      const cardExpiry = elements.create('cardExpiry', { style, placeholder: 'MM / YY' });
      const cardCvc = elements.create('cardCvc', { style, placeholder: '123' });

      setTimeout(() => {
        const cardNumberEl = document.getElementById('stripe-card-number');
        const cardExpiryEl = document.getElementById('stripe-card-expiry');
        const cardCvcEl = document.getElementById('stripe-card-cvc');
        
        if (cardNumberEl) cardNumber.mount(cardNumberEl);
        if (cardExpiryEl) cardExpiry.mount(cardExpiryEl);
        if (cardCvcEl) cardCvc.mount(cardCvcEl);

        cardNumber.on('change', (event: any) => {
          this.cardErrors = event.error ? event.error.message : '';
        });
      }, 100);

      this.cardElement = { cardNumber, cardExpiry, cardCvc, unmount: () => {
        cardNumber.unmount();
        cardExpiry.unmount();
        cardCvc.unmount();
      }};
    } catch (e) {
      console.error('Stripe init error', e);
    }
  }

  getPlanName(): string {
    return this.plan?.name || 'Pro';
  }

  getPlanPrice(): number {
    if (this.plan?.monthlyPriceCents) {
      return this.plan.monthlyPriceCents / 100;
    }
    return 9.99;
  }

  getVat(): number {
    return this.getPlanPrice() * 0.2;
  }

  getTotal(): number {
    return this.getPlanPrice() + this.getVat();
  }

  getOrgId(): string | null {
    return localStorage.getItem('org_id') || localStorage.getItem('organizationId');
  }

  get f() { return this.billingForm.controls as any; }

  activatePlan() {
    if (this.billingForm.invalid) {
      this.markFormGroupTouched(this.billingForm);
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    const orgId = this.getOrgId();
    if (!orgId || !this.plan?.id) {
      this.errorMessage = 'Missing organization or plan information. Please try again.';
      return;
    }

    if (!this.stripe || !this.cardElement) {
      this.errorMessage = 'Payment system is loading. Please wait a moment and try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cardErrors = '';

    const billingEmail = this.billingForm.get('billingEmail')?.value;
    const billingAddress = this.billingForm.get('billingAddress')?.value;
    const city = this.billingForm.get('city')?.value;
    const postcode = this.billingForm.get('postcode')?.value;
    const country = this.billingForm.get('country')?.value;
    const companyName = this.billingForm.get('companyName')?.value;
    const cardHolderName = this.billingForm.get('cardHolderName')?.value;

    const createPayment = () => {
      return this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement.cardNumber,
        billing_details: {
          name: cardHolderName,
          email: billingEmail,
          address: {
            line1: billingAddress,
            city: city,
            postal_code: postcode,
            country: country
          }
        }
      });
    };

    const startSubscriptionCall = (paymentMethodId: string) => {
      return this.subscriptionService.startSubscription(orgId, {
        planId: this.plan.id,
        billingPeriod: 'MONTHLY',
        useTrial: false,
        paymentMethodId: paymentMethodId
      });
    };

    const saveBillingInfoCall = () => {
      return this.subscriptionService.saveBillingInfo(orgId, {
        companyName,
        billingEmail,
        billingAddress,
        city,
        postcode,
        country,
        vatNumber: this.billingForm.get('vatNumber')?.value
      });
    };

    const handlePaymentResult = (result: any) => {
      if (result.error) {
        this.isLoading = false;
        this.cardErrors = result.error.message || 'Card validation failed.';
        this.errorMessage = 'Payment failed. Please check your card details.';
      } else {
        this.subscriptionService.getSubscription(orgId, 'key-vault').subscribe({
          next: (res: any) => {
            const payload = res?.data ?? res ?? {};
            const sub = payload.subscription ?? payload ?? {};
            const status = sub?.status?.toUpperCase();
            const hasActiveSubscription = ['ACTIVE', 'TRIALING', 'TRIAL', 'PENDING'].includes(status);

            const subscriptionCall = hasActiveSubscription
              ? this.subscriptionService.changePlan(orgId, 'key-vault', {
                  newPlanId: this.plan.id,
                  billingPeriod: 'MONTHLY',
                  config: { paymentMethodId: result.paymentMethod.id }
                })
              : startSubscriptionCall(result.paymentMethod.id);

            subscriptionCall.subscribe({
              next: () => {
                saveBillingInfoCall().subscribe({
                  next: () => {
                    this.isLoading = false;
                    window.location.href = '/';
                  },
                  error: () => {
                    this.isLoading = false;
                    window.location.href = '/';
                  }
                });
              },
              error: (err) => {
                this.isLoading = false;
                this.errorMessage = err?.error?.detail || 'Payment failed. Please try again.';
              }
            });
          },
          error: () => {
            startSubscriptionCall(result.paymentMethod.id).subscribe({
              next: () => {
                saveBillingInfoCall().subscribe({
                  next: () => {
                    this.isLoading = false;
                    window.location.href = '/';
                  },
                  error: () => {
                    this.isLoading = false;
                    window.location.href = '/';
                  }
                });
              },
              error: (err) => {
                this.isLoading = false;
                this.errorMessage = err?.error?.detail || 'Payment failed. Please try again.';
              }
            });
          }
        });
      }
    };

    createPayment().then(handlePaymentResult).catch((err: any) => {
      this.isLoading = false;
      this.errorMessage = err?.message || 'Payment processing failed. Please try again.';
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}
