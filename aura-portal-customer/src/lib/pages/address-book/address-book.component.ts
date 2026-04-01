import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AUTH_CONTRACT, PortalService, Address } from 'core';

@Component({
  selector: 'aura-address-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-book.component.html',
  styleUrl: './address-book.component.scss',
})
export class AddressBookComponent implements OnInit {
  private portalService = inject(PortalService);
  private authService = inject(AUTH_CONTRACT);
  private fb = inject(FormBuilder);

  // Estados UI y Data
  addresses = signal<Address[]>([]);
  isLoading = signal(true);
  isAddingNew = signal(false);
  isSaving = signal(false);

  addressForm!: FormGroup;

  async ngOnInit() {
    this.initForm();
    await this.loadAddresses();
  }

  private initForm() {
    this.addressForm = this.fb.group({
      alias: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      address1: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postcode: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$')]]
    });
  }

  async loadAddresses() {
    this.isLoading.set(true);
    const user = this.authService.currentUser();
    
    if (user?.id) {
      const data = await this.portalService.getAddresses(user.id.toString());
      
      // -- FAKE INJECTOR PARA LA DEMO UI SI LA CUENTA NO TIENE DIRECCIONES PREVIAS --
      if (data.length === 0) {
        this.addresses.set([
          {
            id: 991, 
            customerId: user.id as number, 
            alias: 'Mi Casa', 
            firstName: user.firstname || 'Admin', 
            lastName: user.lastname || 'Aura', 
            address1: 'Av. Paseo de la Reforma 222, Piso 4', 
            city: 'Ciudad de México', 
            postcode: '06600', 
            phone: '55 1234 5678'
          }
        ]);
      } else {
        this.addresses.set(data);
      }
    }
    
    this.isLoading.set(false);
  }

  showAddForm() {
    this.addressForm.reset();
    
    // Auto rellenar el nombre de quien recibe para agilizar
    const user = this.authService.currentUser();
    if (user) {
      this.addressForm.patchValue({
         firstName: user.firstname,
         lastName: user.lastname
      });
    }

    this.isAddingNew.set(true);
  }

  cancelAddForm() {
    this.isAddingNew.set(false);
  }

  async onSubmitAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const success = await this.portalService.saveAddress(this.addressForm.value);
    this.isSaving.set(false);

    if (success) {
      // Fake insert para actualizar el DOM reactivo sin recargar
      const newAddr: Address = {
        id: Math.floor(Math.random() * 1000) + 1000,
        customerId: this.authService.currentUser()?.id || 0,
        ...this.addressForm.value
      };
      
      // Update Signal array reactively
      this.addresses.update(current => [...current, newAddr]);
      this.isAddingNew.set(false);
    }
  }

  // Placeholder para borrar
  deleteAddress(id: number) {
    if (confirm('¿Seguro de borrar esta dirección?')) {
       this.addresses.update(current => current.filter(a => a.id !== id));
    }
  }
}
