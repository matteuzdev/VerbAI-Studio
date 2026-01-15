import { Component, inject, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { ChatWidgetComponent } from '../chat-widget/chat-widget.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ChatWidgetComponent, FormsModule],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  store = inject(StoreService);
  
  // Profile Modal State
  isProfileOpen = signal(false);
  activeTab = signal<'profile' | 'security' | 'team'>('profile');
  
  // Profile Form
  editName = signal('');
  
  // Security Form
  oldPassword = signal('');
  newPassword = signal('');
  
  // Team Form
  newMemberEmail = signal('');
  newMemberRole = signal('Editor');

  // Computed Status
  systemStatus = computed(() => {
    return this.store.backendOnline() 
      ? { label: 'Online (Cloud)', color: 'bg-green-500' }
      : { label: 'Demo Mode (Local)', color: 'bg-yellow-500' };
  });

  menuItems = computed(() => {
    const d = this.store.dict();
    // Removed "Clients" item
    return [
      { label: d.dashboard, path: '/admin/dashboard', icon: 'dashboard' },
      { label: d.brandKit, path: '/admin/brand', icon: 'palette' },
      { label: d.pageEditor, path: '/admin/editor', icon: 'edit_document' },
      { label: d.blog, path: '/admin/blog', icon: 'article' },
      { label: d.leads, path: '/admin/leads', icon: 'inbox' },
      { label: d.settings, path: '/admin/settings', icon: 'settings' },
    ];
  });

  switchTenant(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.store.updateTenant(target.value);
  }

  logout() {
    this.store.logout();
  }

  // --- Profile Modal Logic ---

  openProfile() {
    this.editName.set(this.store.currentUser()?.name || '');
    this.activeTab.set('profile');
    this.isProfileOpen.set(true);
  }

  closeProfile() {
    this.isProfileOpen.set(false);
    this.activeTab.set('profile');
  }

  setTab(tab: 'profile' | 'security' | 'team') {
    this.activeTab.set(tab);
  }

  // File Upload
  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.store.updateUser({ avatarUrl: result });
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    this.store.updateUser({ name: this.editName() });
    alert('Profile updated successfully.');
  }

  savePassword() {
    // Mock password change
    if (!this.oldPassword() || !this.newPassword()) return;
    alert('Password changed successfully (Mock).');
    this.oldPassword.set('');
    this.newPassword.set('');
  }

  inviteMember() {
    if (!this.newMemberEmail()) return;
    this.store.inviteMember(this.newMemberEmail(), this.newMemberRole());
    this.newMemberEmail.set('');
    alert('Invitation sent.');
  }

  removeMember(email: string) {
    if(confirm('Remove this user?')) {
        this.store.removeMember(email);
    }
  }
}