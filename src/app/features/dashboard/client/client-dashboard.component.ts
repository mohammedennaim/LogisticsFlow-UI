import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LogisticsService } from '../../../core/services/logistics.service';
import {
  SalesOrder,
  Shipment,
  Product
} from '../../../core/models/logistics.model';
import { forkJoin, catchError, of, timeout, finalize } from 'rxjs';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private logisticsService = inject(LogisticsService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  // Loading state
  isLoading = signal(true);

  // Data signals
  orders = signal<SalesOrder[]>([]);
  shipments = signal<Shipment[]>([]);
  products = signal<Product[]>([]);

  // Calculated stats
  totalOrders = signal(0);
  pendingOrders = signal(0);
  deliveredOrders = signal(0);
  inTransitOrders = signal(0);

  // Active tab
  activeTab = signal('overview');

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      orders: this.logisticsService.getSalesOrders().pipe(catchError(() => of([]))),
      shipments: this.logisticsService.getShipments(0, 10).pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true }))),
      products: this.logisticsService.getProducts(0, 12).pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true })))
    }).pipe(
      timeout(10000),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.orders.set(data.orders);
        this.shipments.set(data.shipments.content);
        this.products.set(data.products.content);

        // Calculate stats
        this.totalOrders.set(data.orders.length);
        this.pendingOrders.set(data.orders.filter((o: SalesOrder) => o.status === 'PENDING' || o.status === 'CONFIRMED').length);
        this.deliveredOrders.set(data.orders.filter((o: SalesOrder) => o.status === 'DELIVERED').length);
        this.inTransitOrders.set(data.shipments.content.filter(s => s.status === 'IN_TRANSIT').length);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  getUserInitials(): string {
    const name = this.currentUser()?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value || 0);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  getOrderStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  getOrderStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'PROCESSING': return 'En traitement';
      case 'SHIPPED': return 'Expédiée';
      case 'DELIVERED': return 'Livrée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }

  getShipmentStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'IN_TRANSIT': return 'status-transit';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  getShipmentStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'En préparation';
      case 'IN_TRANSIT': return 'En transit';
      case 'DELIVERED': return 'Livrée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }

  getOrderProgress(status: string): number {
    switch (status) {
      case 'PENDING': return 25;
      case 'PROCESSING': return 50;
      case 'SHIPPED': return 75;
      case 'DELIVERED': return 100;
      case 'CANCELLED': return 0;
      default: return 0;
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}
