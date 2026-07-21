import { Component, Input } from '@angular/core';
import { ModalService } from '../../../services/modal.service';

import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';

@Component({
  selector: 'app-user-info-card',
  imports: [
    InputFieldComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent
  ],
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent {

  constructor(public modal: ModalService) {}

  isOpen = false;
  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  @Input() user: any = {};

  handleSave() {
    console.log('Saving changes...', this.user);
    this.modal.closeModal();
  }
}
