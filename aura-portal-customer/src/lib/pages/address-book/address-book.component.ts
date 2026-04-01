import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AUTH_CONTRACT, PortalService, Address, MEXICO_STATES } from '@aura-store-front/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'aura-address-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-book.component.html',
  styleUrl: './address-book.component.scss',
})
export class AddressBookComponent implements OnInit, OnDestroy {
  private portalService = inject(PortalService);
  private authService = inject(AUTH_CONTRACT);
  private fb = inject(FormBuilder);

  // Estados UI y Data
  addresses = signal<Address[]>([]);
  isLoading = signal(true);
  isAddingNew = signal(false);
  isSaving = signal(false);
  mexicoStates = MEXICO_STATES; 

  addressForm!: FormGroup;
  private formSub?: Subscription;

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
      address2: [''], // Opcional
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: [{ value: 'México', disabled: true }, [Validators.required]],
      postcode: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$')]],
      
      // Datos Fiscales
      requiresInvoice: [false], 
      company: [''],
      vatNumber: [''],
      dni: [''], // Adicional para uso CFDI o INE si se requiere
    });

    // Validadores Dinámicos: Si solicita factura, obligar campos
    this.formSub = this.addressForm.get('requiresInvoice')?.valueChanges.subscribe(reqFac => {
       const companyCtrl = this.addressForm.get('company');
       const vatCtrl = this.addressForm.get('vatNumber');
       
       if (reqFac) {
         companyCtrl?.setValidators([Validators.required]);
         vatCtrl?.setValidators([Validators.required, Validators.pattern('^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$')]); // Patrón RFC Mexicano Básico
       } else {
         companyCtrl?.clearValidators();
         vatCtrl?.clearValidators();
         // Limpiar el texto si se arrepiente
         companyCtrl?.setValue('');
         vatCtrl?.setValue('');
       }
       companyCtrl?.updateValueAndValidity();
       vatCtrl?.updateValueAndValidity();
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
            address2: 'Col. Juárez',
            city: 'Ciudad de México', 
            state: 'Ciudad de México',
            country: 'México',
            postcode: '06600', 
            phone: '55 1234 5678',
            requiresInvoice: false
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
    
    // Preparar el Payload clonado
    const payload = this.addressForm.getRawValue(); // getRawValue para incluir disables como Country
    
    // Inyección del requerimiento: RFC Genérico si no factura
    if (!payload.requiresInvoice) {
       payload.vatNumber = 'XAXX010101000';
       payload.company = '';
    }

    const success = await this.portalService.saveAddress(payload);
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

  ngOnDestroy() {
    this.formSub?.unsubscribe();
  }
}
