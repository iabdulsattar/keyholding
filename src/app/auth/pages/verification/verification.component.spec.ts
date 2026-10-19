import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationComponent } from './verification.component';

describe('VerificationComponent', () => {
  let component: VerificationComponent;
  let fixture: ComponentFixture<VerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('moves focus to the previous OTP input when Backspace is pressed in an empty input', () => {
    const inputs = fixture.nativeElement.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[1].focus();
    inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

    expect(document.activeElement).toBe(inputs[0]);
  });
});
