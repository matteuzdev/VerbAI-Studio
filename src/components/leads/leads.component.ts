import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Lead, LeadStatus } from '../../services/store.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leads.component.html'
})
export class LeadsComponent {
  store = inject(StoreService);

  isModalOpen = signal(false);
  
  // Current Lead being edited/created
  editingLead: Lead = this.getEmptyLead();

  getEmptyLead(): Lead {
      return {
          id: '',
          name: '',
          email: '',
          phone: '',
          company: '',
          message: '',
          status: 'new',
          source: 'manual', // Created via backoffice
          createdAt: new Date().toISOString()
      };
  }

  openNewLeadModal() {
      this.editingLead = this.getEmptyLead();
      this.isModalOpen.set(true);
  }

  editLead(lead: Lead) {
      this.editingLead = JSON.parse(JSON.stringify(lead)); // Deep copy
      this.isModalOpen.set(true);
  }

  closeModal() {
      this.isModalOpen.set(false);
  }

  saveLead() {
      if (!this.editingLead.name || !this.editingLead.email) {
          alert('Name and Email are required.');
          return;
      }
      
      if (!this.editingLead.id) {
          this.editingLead.id = 'lead_' + Date.now();
      }
      
      this.store.saveLead(this.editingLead);
      this.isModalOpen.set(false);
  }

  updateStatus(id: string, status: any) {
    this.store.updateLeadStatus(id, status);
  }

  deleteLead(id: string) {
      if(confirm('Delete this lead permanently?')) {
          this.store.deleteLead(id);
      }
  }

  exportCsv() {
      const leads = this.store.leads();
      if (leads.length === 0) {
          alert("No leads to export.");
          return;
      }
      
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Date', 'Message'];
      const csvContent = [
          headers.join(','),
          ...leads.map(l => [
              l.id, 
              `"${l.name}"`, 
              l.email, 
              l.phone || '', 
              `"${l.company || ''}"`, 
              l.status, 
              l.source, 
              l.createdAt, 
              `"${(l.message || '').replace(/"/g, '""')}"`
          ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  getStatusColor(status: LeadStatus): string {
      switch(status) {
          case 'new': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
          case 'contacted': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
          case 'qualified': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
          case 'proposal': return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
          case 'won': return 'bg-green-100 text-green-700 hover:bg-green-200';
          case 'lost': return 'bg-red-100 text-red-700 hover:bg-red-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  }
}