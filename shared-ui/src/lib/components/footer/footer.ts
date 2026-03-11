import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'aura-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  currentYear = new Date().getFullYear();
}
