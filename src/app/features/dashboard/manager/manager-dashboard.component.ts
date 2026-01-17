import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LogisticsService } from '../../../core/services/logistics.service';
import {
  InventoryReportDto,
  ShipmentReportDto,
  Inventory,
  Shipment,
  InventoryMovement,
  Product
} from '../../../core/models/logistics.model';
import { forkJoin, catchError, of, timeout, finalize } from 'rxjs';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private logisticsService = inject(LogisticsService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  Math = Math; // Pour utiliser Math dans le template

  // Loading state
  isLoading = signal(true);

  // Data signals
  inventoryReport = signal<InventoryReportDto | null>(null);
  shipmentReport = signal<ShipmentReportDto | null>(null);
  inventories = signal<Inventory[]>([]);
  shipments = signal<Shipment[]>([]);
  movements = signal<InventoryMovement[]>([]);
  products = signal<Product[]>([]);

  // Calculated stats
  totalProducts = signal(0);
  lowStockItems = signal(0);
  outOfStockItems = signal(0);
  pendingShipments = signal(0);

  // Menu state
  activeMenu = signal('dashboard');

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      inventoryReport: this.logisticsService.getInventoryReport().pipe(catchError(() => of(null))),
      shipmentReport: this.logisticsService.getShipmentReport().pipe(catchError(() => of(null))),
      inventories: this.logisticsService.getInventories().pipe(catchError(() => of([]))),
      shipments: this.logisticsService.getShipments(0, 10).pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true }))),
      movements: this.logisticsService.getInventoryMovements().pipe(catchError(() => of([]))),
      products: this.logisticsService.getProducts(0, 20).pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true })))
    }).pipe(
      timeout(10000),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.inventoryReport.set(data.inventoryReport);
        this.shipmentReport.set(data.shipmentReport);
        this.inventories.set(data.inventories);
        this.shipments.set(data.shipments.content);
        this.movements.set(data.movements);
        this.products.set(data.products.content);

        // Calculate stats
        this.totalProducts.set(data.inventoryReport?.totalProducts || data.products.totalElements);
        this.lowStockItems.set(data.inventoryReport?.lowStockItems || 0);
        this.outOfStockItems.set(data.inventoryReport?.outOfStockItems || 0);
        this.pendingShipments.set(data.shipmentReport?.pendingShipments || 0);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
      }
    });
  }

  setActiveMenu(menu: string): void {
    this.activeMenu.set(menu);
  }

  getUserInitials(): string {
    const name = this.currentUser()?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MG';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value || 0);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getMovementTypeClass(type: string): string {
    switch (type) {
      case 'IN': return 'movement-in';
      case 'OUT': return 'movement-out';
      case 'TRANSFER': return 'movement-transfer';
      case 'ADJUSTMENT': return 'movement-adjustment';
      default: return '';
    }
  }

  getMovementTypeLabel(type: string): string {
    switch (type) {
      case 'IN': return 'Entrée';
      case 'OUT': return 'Sortie';
      case 'TRANSFER': return 'Transfert';
      case 'ADJUSTMENT': return 'Ajustement';
      default: return type;
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
      case 'PENDING': return 'En attente';
      case 'IN_TRANSIT': return 'En transit';
      case 'DELIVERED': return 'Livré';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  }

  getStockLevel(inventory: Inventory): string {
    if (inventory.qtyOnHand <= 0) return 'out-of-stock';
    if (inventory.reorderPoint && inventory.qtyOnHand <= inventory.reorderPoint) return 'low-stock';
    if (inventory.qtyOnHand >= 1000) return 'near-full';
    return 'normal';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}
