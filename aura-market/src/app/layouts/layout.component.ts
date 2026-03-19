import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarLayoutComponent } from './navbar-layout/navbar-layout.component';
import { Footer } from "shared-ui";

@Component({
  selector: 'aura-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarLayoutComponent, Footer],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {

}
