import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Form Components
import { InputFieldComponent } from './components/form/input/input-field.component';
import { LabelComponent } from './components/form/label/label.component';
import { CheckboxComponent } from './components/form/input/checkbox.component';
import { SelectComponent } from './components/form/select/select.component';

// UI Components
import { ButtonComponent } from './components/ui/button/button.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputFieldComponent,
    LabelComponent,
    CheckboxComponent,
    SelectComponent,
    ButtonComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputFieldComponent,
    LabelComponent,
    CheckboxComponent,
    SelectComponent,
    ButtonComponent
  ]
})
export class SharedModule { }
