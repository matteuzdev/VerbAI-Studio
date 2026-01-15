import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html'
})
export class ClientsComponent {
  store = inject(StoreService);
  router = inject(Router);

  // --- ACTIONS ---

  accessBackoffice(tenantId: string) {
      if(confirm(`Switch context to managing ${tenantId}?`)) {
          this.store.updateTenant(tenantId);
          // Force reload of dashboard component by navigating
          this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
              this.router.navigate(['/admin/dashboard']);
          });
      }
  }

  viewClientSite(tenantId: string) {
      // Switch context temporarily to show the correct data on the preview
      this.store.updateTenant(tenantId);
      this.router.navigate(['/site-preview']);
  }

  getInitials(name: string): string {
      return name ? name.substring(0, 2).toUpperCase() : '??';
  }
}