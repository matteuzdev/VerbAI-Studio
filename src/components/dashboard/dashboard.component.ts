import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  store = inject(StoreService);
  router = inject(Router);
  
  stats = computed(() => {
    const d = this.store.dict();
    return [
      { label: d.stat_leads, value: '1,284', change: '+12%', isPositive: true },
      { label: d.stat_views, value: '45.2k', change: '+5%', isPositive: true },
      { label: d.stat_bounce, value: '42%', change: '-2%', isPositive: true },
      { label: d.stat_session, value: '2m 14s', change: '-5s', isPositive: false },
    ];
  });
  
  recentActivity = [
    { user: 'Sarah M.', action: 'Updated Homepage Hero', time: '2 mins ago', icon: 'edit' },
    { user: 'Mike T.', action: 'Published new Blog Post', time: '1 hour ago', icon: 'publish' },
    { user: 'System', action: 'Backup completed', time: '4 hours ago', icon: 'backup' },
  ];

  viewSite() {
    // Open the generated client site view instead of just the agency home
    this.router.navigate(['/site-preview']);
  }

  navigateToNewPost() {
    this.router.navigate(['/admin/blog']);
  }
}