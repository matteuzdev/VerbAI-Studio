import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-brand-kit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brand-kit.component.html'
})
export class BrandKitComponent {
  store = inject(StoreService);

  fonts = ['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'];
  tones = ['Professional', 'Friendly', 'Playful', 'Technical', 'Luxury'];
  
  showSuccess = signal(false);

  saveSettings() {
    this.showSuccess.set(true);
    setTimeout(() => {
      this.showSuccess.set(false);
    }, 3000);
  }

  // Handle file selection
  onFileSelected(event: Event, type: 'logo' | 'favicon') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'logo') {
          this.store.updateBrandKit({ logoUrl: result });
        } else {
          this.store.updateBrandKit({ faviconUrl: result });
        }
      };

      reader.readAsDataURL(file);
      
      // Reset input so same file can be selected again if needed
      input.value = '';
    }
  }

  // Handle removal
  removeImage(type: 'logo' | 'favicon', event: Event) {
    event.stopPropagation(); // Prevent opening the file dialog
    if (type === 'logo') {
      this.store.updateBrandKit({ logoUrl: '' });
    } else {
      this.store.updateBrandKit({ faviconUrl: '' });
    }
  }
}