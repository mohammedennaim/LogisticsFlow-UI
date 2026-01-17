import { Component, type OnInit, type OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Router } from "@angular/router"
import { AuthService } from "../../../core/services/auth.service"
import { LogisticsService } from "../../../core/services/logistics.service"
import {
  type OrderReportDto,
  type InventoryReportDto,
  type ShipmentReportDto,
  type Manager,
  type Warehouse,
  type Carrier,
  type Client,
  type Shipment,
  type SalesOrder,
  type Supplier,
  type Product,
} from "../../../core/models/logistics.model"
import { forkJoin, catchError, of, timeout, finalize, interval, Subject, takeUntil, filter } from "rxjs"
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.css"],
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private authService = inject(AuthService)
  private logisticsService = inject(LogisticsService)
  private router = inject(Router)
  private destroy$ = new Subject<void>()

  currentUser = this.authService.currentUser

  mobileMenuOpen = signal(false)
  sidebarCollapsed = signal(false)
  expandedSections = signal<Set<string>>(new Set())

  // Chart instances
  private orderStatusChart: Chart | null = null
  private shipmentStatusChart: Chart | null = null
  private inventoryChart: Chart | null = null
  private revenueChart: Chart | null = null
  chartsInitialized = signal(false)

  // ... rest of the component code remains the same ...
  isLoading = signal(true)
  autoRefreshEnabled = signal(true)
  private readonly REFRESH_INTERVAL = 30000
  lastUpdate = signal<Date>(new Date())

  orderReport = signal<OrderReportDto | null>(null)
  inventoryReport = signal<InventoryReportDto | null>(null)
  shipmentReport = signal<ShipmentReportDto | null>(null)
  managers = signal<Manager[]>([])
  warehouses = signal<Warehouse[]>([])
  carriers = signal<Carrier[]>([])
  clients = signal<Client[]>([])

  recentShipments = signal<Shipment[]>([])
  recentOrders = signal<SalesOrder[]>([])

  totalUsers = signal(0)
  activeWarehouses = signal(0)
  activeCarriers = signal(0)
  totalRevenue = signal(0)

  sortField = signal<string>("")
  sortDirection = signal<"asc" | "desc">("asc")
  searchFilter = signal<string>("")

  activeMenu = signal("dashboard")

  showWarehouseModal = signal(false)
  showCarrierModal = signal(false)
  showProductModal = signal(false)
  showManagerModal = signal(false)
  showSupplierModal = signal(false)
  editingItem = signal<any>(null)

  // Forms aligned with backend DTOs
  warehouseForm = { code: "", name: "", active: true }
  carrierForm = { code: "", name: "", email: "", phone: "", rate: 0, maxDailyShipments: 1 }
  productForm = { sku: "", name: "", category: "", unitPrice: 0, profit: 0, image: "" }
  managerForm = { email: "", password: "", warehouseIds: [] as string[], active: true }
  supplierForm = { name: "", contact: "" }

  suppliers = signal<Supplier[]>([])
  products = signal<Product[]>([])

  ngOnInit(): void {
    this.loadDashboardData()
    this.startAutoRefresh()
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.destroyCharts()
  }

  private destroyCharts(): void {
    if (this.orderStatusChart) {
      this.orderStatusChart.destroy()
      this.orderStatusChart = null
    }
    if (this.shipmentStatusChart) {
      this.shipmentStatusChart.destroy()
      this.shipmentStatusChart = null
    }
    if (this.inventoryChart) {
      this.inventoryChart.destroy()
      this.inventoryChart = null
    }
    if (this.revenueChart) {
      this.revenueChart.destroy()
      this.revenueChart = null
    }
  }

  initializeCharts(): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      this.destroyCharts()
      this.createOrderStatusChart()
      this.createShipmentStatusChart()
      this.createInventoryChart()
      this.createRevenueChart()
      this.chartsInitialized.set(true)
    }, 100)
  }

  private createOrderStatusChart(): void {
    const ctx = document.getElementById('orderStatusChart') as HTMLCanvasElement
    if (!ctx) return

    const orderData = this.orderReport()
    if (!orderData) return

    this.orderStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['En attente', 'Livrées', 'Annulées'],
        datasets: [{
          data: [
            orderData.pendingOrders || 0,
            orderData.deliveredOrders || 0,
            orderData.cancelledOrders || 0
          ],
          backgroundColor: [
            '#f59e0b',
            '#10b981',
            '#ef4444'
          ],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 12, weight: 'bold' }
            }
          },
          title: {
            display: true,
            text: 'Répartition des Commandes',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
          }
        },
        cutout: '60%'
      }
    })
  }

  private createShipmentStatusChart(): void {
    const ctx = document.getElementById('shipmentStatusChart') as HTMLCanvasElement
    if (!ctx) return

    const shipmentData = this.shipmentReport()
    if (!shipmentData) return

    this.shipmentStatusChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['En attente', 'En transit', 'Livrées'],
        datasets: [{
          label: 'Expéditions',
          data: [
            shipmentData.pendingShipments || 0,
            shipmentData.inTransitShipments || 0,
            shipmentData.deliveredShipments || 0
          ],
          backgroundColor: [
            'rgba(245, 158, 11, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderColor: [
            '#f59e0b',
            '#06b6d4',
            '#10b981'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Statut des Expéditions',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    })
  }

  private createInventoryChart(): void {
    const ctx = document.getElementById('inventoryChart') as HTMLCanvasElement
    if (!ctx) return

    const inventoryData = this.inventoryReport()
    if (!inventoryData) return

    this.inventoryChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Stock Normal', 'Stock Faible', 'Rupture', 'Surstock'],
        datasets: [{
          data: [
            (inventoryData.totalProducts || 0) - (inventoryData.lowStockItems || 0) - (inventoryData.outOfStockItems || 0) - (inventoryData.overStockItems || 0),
            inventoryData.lowStockItems || 0,
            inventoryData.outOfStockItems || 0,
            inventoryData.overStockItems || 0
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(139, 92, 246, 0.7)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 11 }
            }
          },
          title: {
            display: true,
            text: 'État de l\'Inventaire',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
          }
        }
      }
    })
  }

  private createRevenueChart(): void {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement
    if (!ctx) return

    const orderData = this.orderReport()
    if (!orderData) return

    // Simulated monthly data - in production, this would come from the API
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin']
    const avgRevenue = (orderData.totalRevenue || 0) / 6

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Revenu (DH)',
          data: months.map(() => Math.round(avgRevenue * (0.7 + Math.random() * 0.6))),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Évolution du Revenu',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => value.toLocaleString() + ' DH'
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    })
  }

  toggleSection(section: string): void {
    const expanded = this.expandedSections()
    if (expanded.has(section)) {
      expanded.delete(section)
    } else {
      expanded.add(section)
    }
    this.expandedSections.set(new Set(expanded))
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections().has(section)
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v)
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false)
  }

  private startAutoRefresh(): void {
    interval(this.REFRESH_INTERVAL)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.autoRefreshEnabled() && !this.isLoading()),
      )
      .subscribe(() => {
        this.loadDashboardData()
      })
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled.update((v) => !v)
  }

  loadDashboardData(): void {
    this.isLoading.set(true)

    forkJoin({
      orderReport: this.logisticsService.getOrderReport().pipe(catchError(() => of(null))),
      inventoryReport: this.logisticsService.getInventoryReport().pipe(catchError(() => of(null))),
      shipmentReport: this.logisticsService.getShipmentReport().pipe(catchError(() => of(null))),
      managers: this.logisticsService.getManagers().pipe(catchError(() => of([]))),
      warehouses: this.logisticsService.getWarehouses().pipe(catchError(() => of([]))),
      carriers: this.logisticsService
        .getCarriers(0, 100)
        .pipe(
          catchError(() =>
            of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true }),
          ),
        ),
      clients: this.logisticsService.getClients().pipe(catchError(() => of([]))),
      shipments: this.logisticsService
        .getShipments(0, 10)
        .pipe(
          catchError(() =>
            of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true }),
          ),
        ),
      orders: this.logisticsService.getSalesOrders().pipe(catchError(() => of([]))),
      suppliers: this.logisticsService.getSuppliers().pipe(catchError(() => of([]))),
      products: this.logisticsService
        .getProducts(0, 50)
        .pipe(
          catchError(() =>
            of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true }),
          ),
        ),
    })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading.set(false)
          this.lastUpdate.set(new Date())
        }),
      )
      .subscribe({
        next: (data) => {
          this.orderReport.set(data.orderReport)
          this.inventoryReport.set(data.inventoryReport)
          this.shipmentReport.set(data.shipmentReport)
          this.managers.set(data.managers)
          this.warehouses.set(data.warehouses)
          this.carriers.set(data.carriers.content)
          this.clients.set(data.clients)
          this.recentShipments.set(data.shipments.content.slice(0, 5))
          this.recentOrders.set(data.orders.slice(0, 5))
          this.suppliers.set(data.suppliers)
          this.products.set(data.products.content)

          this.totalUsers.set(data.managers.length + data.clients.length)
          this.activeWarehouses.set(data.warehouses.filter((w) => w.active).length)
          this.activeCarriers.set(data.carriers.content.filter((c) => c.status === "AVAILABLE").length)
          this.totalRevenue.set(data.orderReport?.totalRevenue || 0)

          // Initialize charts if on statistics page
          if (this.activeMenu() === 'statistics') {
            this.initializeCharts()
          }
        },
        error: (err) => {
          console.error("Error loading dashboard data:", err)
        },
      })
  }

  setActiveMenu(menu: string): void {
    this.activeMenu.set(menu)
    this.closeMobileMenu()
    this.searchFilter.set("")
    this.sortField.set("")

    // Initialize charts when navigating to statistics
    if (menu === 'statistics') {
      this.initializeCharts()
    }
  }

  getUserInitials(): string {
    const name = this.currentUser()?.name || ""
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "AD"
    )
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value || 0)
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat("fr-FR").format(value || 0)
  }

  formatPercent(value: number): string {
    return `${((value || 0) * 100).toFixed(1)}%`
  }

  getManagerInitials(name: string): string {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "MG"
    )
  }

  getFilteredWarehouses() {
    return this.warehouses().filter(
      (w) =>
        w.name.toLowerCase().includes(this.searchFilter().toLowerCase()) ||
        w.code?.toLowerCase().includes(this.searchFilter().toLowerCase()),
    )
  }

  getFilteredCarriers() {
    return this.carriers().filter(
      (c) =>
        c.name.toLowerCase().includes(this.searchFilter().toLowerCase()) ||
        c.code?.toLowerCase().includes(this.searchFilter().toLowerCase()),
    )
  }

  getFilteredProducts() {
    return this.products().filter(
      (p) =>
        p.name.toLowerCase().includes(this.searchFilter().toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchFilter().toLowerCase()),
    )
  }

  getFilteredManagers() {
    const filter = this.searchFilter().toLowerCase()
    return this.managers().filter(
      (m) =>
        (m.name?.toLowerCase() || '').includes(filter) ||
        (m.email?.toLowerCase() || '').includes(filter),
    )
  }

  getFilteredSuppliers() {
    return this.suppliers().filter(
      (s) =>
        s.name?.toLowerCase().includes(this.searchFilter().toLowerCase()) ||
        s.contact?.toLowerCase().includes(this.searchFilter().toLowerCase()),
    )
  }

  getFilteredClients() {
    return this.clients().filter(
      (c) =>
        c.name?.toLowerCase().includes(this.searchFilter().toLowerCase()) ||
        c.contact?.toLowerCase().includes(this.searchFilter().toLowerCase()),
    )
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(["/auth/login"]),
      error: () => this.router.navigate(["/auth/login"]),
    })
  }

  openWarehouseModal(warehouse?: Warehouse): void {
    if (warehouse) {
      this.editingItem.set(warehouse)
      Object.assign(this.warehouseForm, {
        code: warehouse.code || "",
        name: warehouse.name,
        active: warehouse.active !== false,
      })
    } else {
      this.editingItem.set(null)
      Object.assign(this.warehouseForm, {
        code: "",
        name: "",
        active: true,
      })
    }
    this.showWarehouseModal.set(true)
  }

  saveWarehouse(): void {
    const form = this.warehouseForm
    const editing = this.editingItem()

    if (editing) {
      this.logisticsService.updateWarehouse(editing.id, form).subscribe({
        next: () => {
          this.showWarehouseModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    } else {
      this.logisticsService.createWarehouse(form).subscribe({
        next: () => {
          this.showWarehouseModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  deleteWarehouse(id: string): void {
    if (confirm("Supprimer cet entrepôt ?")) {
      this.logisticsService.deleteWarehouse(id).subscribe({
        next: () => this.loadDashboardData(),
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  openCarrierModal(carrier?: Carrier): void {
    if (carrier) {
      this.editingItem.set(carrier)
      Object.assign(this.carrierForm, {
        code: carrier.code || "",
        name: carrier.name,
        email: carrier.email || "",
        phone: carrier.phone || "",
        rate: carrier.rate || 0,
        maxDailyShipments: carrier.maxDailyShipments || 1,
      })
    } else {
      this.editingItem.set(null)
      Object.assign(this.carrierForm, { code: "", name: "", email: "", phone: "", rate: 0, maxDailyShipments: 1 })
    }
    this.showCarrierModal.set(true)
  }

  saveCarrier(): void {
    // Clean data before sending - remove empty strings for optional fields with validation
    const form: any = {
      code: this.carrierForm.code.toUpperCase().trim(),
      name: this.carrierForm.name.trim(),
      maxDailyShipments: this.carrierForm.maxDailyShipments || 1,
      rate: this.carrierForm.rate || 0,
    }
    
    // Only include email if it's a valid non-empty string
    if (this.carrierForm.email && this.carrierForm.email.trim()) {
      form.email = this.carrierForm.email.trim()
    }
    
    // Only include phone if it's a valid non-empty string
    if (this.carrierForm.phone && this.carrierForm.phone.trim()) {
      form.phone = this.carrierForm.phone.trim()
    }
    
    const editing = this.editingItem()

    if (editing) {
      this.logisticsService.updateCarrier(editing.id, form).subscribe({
        next: () => {
          this.showCarrierModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => {
          console.error("Update carrier error:", err)
          alert("Erreur lors de la modification: " + (err.error?.message || err.message))
        },
      })
    } else {
      this.logisticsService.createCarrier(form).subscribe({
        next: () => {
          this.showCarrierModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => {
          console.error("Create carrier error:", err)
          alert("Erreur lors de la création: " + (err.error?.message || JSON.stringify(err.error) || err.message))
        },
      })
    }
  }

  deleteCarrier(id: string): void {
    if (confirm("Supprimer ce transporteur ?")) {
      this.logisticsService.deleteCarrier(id).subscribe({
        next: () => this.loadDashboardData(),
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  openProductModal(product?: any): void {
    if (product) {
      this.editingItem.set(product)
      Object.assign(this.productForm, {
        sku: product.sku,
        name: product.name,
        category: product.category || "",
        unitPrice: product.unitPrice,
        profit: product.profit || 0,
        image: product.image || "",
      })
    } else {
      this.editingItem.set(null)
      Object.assign(this.productForm, { sku: "", name: "", category: "", unitPrice: 0, profit: 0, image: "" })
    }
    this.showProductModal.set(true)
  }

  saveProduct(): void {
    const form = this.productForm
    const editing = this.editingItem()

    if (editing) {
      this.logisticsService.updateProduct(editing.id, form).subscribe({
        next: () => {
          this.showProductModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    } else {
      this.logisticsService.createProduct(form).subscribe({
        next: () => {
          this.showProductModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  deleteProduct(id: string): void {
    if (confirm("Supprimer ce produit ?")) {
      this.logisticsService.deleteProduct(id).subscribe({
        next: () => this.loadDashboardData(),
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  openManagerModal(manager?: Manager): void {
    if (manager) {
      this.editingItem.set(manager)
      Object.assign(this.managerForm, {
        email: manager.email,
        password: "",
        warehouseIds: manager.warehouseIds || [],
        active: manager.active !== false,
      })
    } else {
      this.editingItem.set(null)
      Object.assign(this.managerForm, { email: "", password: "", warehouseIds: [], active: true })
    }
    this.showManagerModal.set(true)
  }

  saveManager(): void {
    const form = this.managerForm
    const editing = this.editingItem()

    if (editing) {
      const updateData: any = {
        email: form.email,
        warehouseIds: form.warehouseIds,
        active: form.active,
      }
      // N'inclure le mot de passe que s'il est fourni
      if (form.password && form.password.trim()) {
        updateData.password = form.password
      }
      this.logisticsService.updateManager(editing.id, updateData).subscribe({
        next: () => {
          this.showManagerModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    } else {
      this.logisticsService.createManager(form).subscribe({
        next: () => {
          this.showManagerModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  deleteManager(id: string): void {
    if (confirm("Supprimer ce manager ?")) {
      this.logisticsService.deleteManager(id).subscribe({
        next: () => this.loadDashboardData(),
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  openSupplierModal(supplier?: Supplier): void {
    if (supplier) {
      this.editingItem.set(supplier)
      this.supplierForm.name = supplier.name || ""
      this.supplierForm.contact = supplier.contact || ""
    } else {
      this.editingItem.set(null)
      this.supplierForm.name = ""
      this.supplierForm.contact = ""
    }
    this.showSupplierModal.set(true)
  }

  saveSupplier(): void {
    const form = this.supplierForm
    const editing = this.editingItem()

    if (editing) {
      this.logisticsService.updateSupplier(editing.id, form).subscribe({
        next: () => {
          this.showSupplierModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    } else {
      this.logisticsService.createSupplier(form).subscribe({
        next: () => {
          this.showSupplierModal.set(false)
          this.loadDashboardData()
        },
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  deleteSupplier(id: string): void {
    if (confirm("Supprimer ce fournisseur ?")) {
      this.logisticsService.deleteSupplier(id).subscribe({
        next: () => this.loadDashboardData(),
        error: (err) => console.error("Erreur:", err.message),
      })
    }
  }

  getSectionTitle(): string {
    const titles: Record<string, string> = {
      dashboard: "Tableau de bord",
      warehouses: "Gestion des Entrepôts",
      carriers: "Gestion des Transporteurs",
      products: "Gestion des Produits",
      managers: "Gestion des Managers",
      suppliers: "Gestion des Fournisseurs",
      clients: "Gestion des Clients",
      orders: "Gestion des Commandes",
      shipments: "Gestion des Expéditions",
      statistics: "Statistiques & Rapports",
    }
    return titles[this.activeMenu()] || "Dashboard"
  }

  getSectionDescription(): string {
    const descriptions: Record<string, string> = {
      dashboard: "Vue d'ensemble de votre activité logistique",
      warehouses: "Gérez vos entrepôts et leurs capacités",
      carriers: "Gérez vos partenaires de transport",
      products: "Catalogue et gestion des produits",
      managers: "Gérez les gestionnaires d'entrepôts",
      suppliers: "Gérez vos fournisseurs",
      clients: "Base de données clients",
      orders: "Suivi des commandes clients",
      shipments: "Suivi des expéditions",
      statistics: "Analyses et rapports détaillés",
    }
    return descriptions[this.activeMenu()] || ""
  }

  getShipmentStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      PLANNED: "Planifiée",
      IN_TRANSIT: "En transit",
      DELIVERED: "Livrée",
      CANCELLED: "Annulée",
    }
    return labels[status || ""] || status || "Inconnu"
  }

  getOrderStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      CREATED: "Créée",
      RESERVED: "Réservée",
      SHIPPED: "Expédiée",
      DELIVERED: "Livrée",
      CANCELED: "Annulée",
    }
    return labels[status || ""] || status || "Inconnu"
  }

  getCarrierStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      AVAILABLE: "Disponible",
      BUSY: "Occupé",
      UNAVAILABLE: "Indisponible",
    }
    return labels[status || ""] || status || "Inconnu"
  }

  closeModal(): void {
    this.showWarehouseModal.set(false)
    this.showCarrierModal.set(false)
    this.showProductModal.set(false)
    this.showManagerModal.set(false)
    this.showSupplierModal.set(false)
    this.editingItem.set(null)
  }
}
