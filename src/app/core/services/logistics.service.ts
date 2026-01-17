import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Product,
  ProductCreateDto,
  Inventory,
  InventoryAdjustDto,
  Warehouse,
  WarehouseCreateDto,
  Carrier,
  CarrierCreateDto,
  Shipment,
  ShipmentCreateDto,
  SalesOrder,
  SalesOrderCreateDto,
  Client,
  Manager,
  ManagerCreateDto,
  ManagerUpdateDto,
  Supplier,
  SupplierCreateDto,
  SupplierUpdateDto,
  OrderReportDto,
  InventoryReportDto,
  ShipmentReportDto,
  InventoryMovement,
  Page,
  ShipmentStatus,
  OrderStatus,
  CarrierStatus
} from '../models/logistics.model';

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  private api = inject(ApiService);

  // ============== Products ==============
  getProducts(page = 0, size = 20, search?: string, active?: boolean): Observable<Page<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (search) params = params.set('search', search);
    if (active !== undefined) params = params.set('active', active.toString());
    return this.api.get<Page<Product>>('/api/products', { params });
  }

  getProduct(id: string): Observable<Product> {
    return this.api.get<Product>(`/api/products/${id}`);
  }

  createProduct(product: ProductCreateDto): Observable<Product> {
    return this.api.post<Product>('/api/products', product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`/api/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.api.delete<void>(`/api/products/${id}`);
  }

  // ============== Inventory ==============
  getInventories(warehouseId?: string, productId?: string): Observable<Inventory[]> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    if (productId) params = params.set('productId', productId);
    return this.api.get<Inventory[]>('/api/inventories', { params });
  }

  getInventory(id: string): Observable<Inventory> {
    return this.api.get<Inventory>(`/api/inventories/${id}`);
  }

  adjustInventory(adjustment: InventoryAdjustDto): Observable<Inventory> {
    return this.api.post<Inventory>('/api/inventories/adjust', adjustment);
  }

  // ============== Warehouses ==============
  getWarehouses(): Observable<Warehouse[]> {
    return this.api.get<Warehouse[]>('/api/warehouses');
  }

  getWarehouse(id: string): Observable<Warehouse> {
    return this.api.get<Warehouse>(`/api/warehouses/${id}`);
  }

  createWarehouse(warehouse: WarehouseCreateDto): Observable<Warehouse> {
    return this.api.post<Warehouse>('/api/warehouses', warehouse);
  }

  updateWarehouse(id: string, warehouse: Partial<Warehouse>): Observable<Warehouse> {
    return this.api.put<Warehouse>(`/api/warehouses/${id}`, warehouse);
  }

  deleteWarehouse(id: string): Observable<void> {
    return this.api.delete<void>(`/api/warehouses/${id}`);
  }

  // ============== Carriers ==============
  getCarriers(page = 0, size = 20, status?: CarrierStatus, name?: string): Observable<Page<Carrier>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    if (name) params = params.set('name', name);
    return this.api.get<Page<Carrier>>('/api/carriers', { params });
  }

  getCarrier(id: string): Observable<Carrier> {
    return this.api.get<Carrier>(`/api/carriers/${id}`);
  }

  createCarrier(carrier: CarrierCreateDto): Observable<Carrier> {
    return this.api.post<Carrier>('/api/carriers', carrier);
  }

  updateCarrier(id: string, carrier: Partial<Carrier>): Observable<Carrier> {
    return this.api.put<Carrier>(`/api/carriers/${id}`, carrier);
  }

  updateCarrierStatus(id: string, status: CarrierStatus): Observable<Carrier> {
    return this.api.patch<Carrier>(`/api/carriers/${id}/status`, { status });
  }

  deleteCarrier(id: string): Observable<void> {
    return this.api.delete<void>(`/api/carriers/${id}`);
  }

  // ============== Shipments ==============
  getShipments(page = 0, size = 20, status?: ShipmentStatus, warehouseId?: string): Observable<Page<Shipment>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.api.get<Page<Shipment>>('/api/shipments', { params });
  }

  getShipment(id: string): Observable<Shipment> {
    return this.api.get<Shipment>(`/api/shipments/${id}`);
  }

  createShipment(shipment: ShipmentCreateDto): Observable<Shipment> {
    return this.api.post<Shipment>('/api/shipments', shipment);
  }

  updateShipmentStatus(id: string, status: ShipmentStatus): Observable<Shipment> {
    return this.api.patch<Shipment>(`/api/shipments/${id}/status`, { status });
  }

  deleteShipment(id: string): Observable<void> {
    return this.api.delete<void>(`/api/shipments/${id}`);
  }

  // ============== Sales Orders ==============
  getSalesOrders(clientId?: string, status?: OrderStatus): Observable<SalesOrder[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId);
    if (status) params = params.set('status', status);
    return this.api.get<SalesOrder[]>('/api/sales-orders', { params });
  }

  getSalesOrder(id: string): Observable<SalesOrder> {
    return this.api.get<SalesOrder>(`/api/sales-orders/${id}`);
  }

  createSalesOrder(order: SalesOrderCreateDto): Observable<SalesOrder> {
    return this.api.post<SalesOrder>('/api/sales-orders', order);
  }

  reserveOrder(id: string): Observable<SalesOrder> {
    return this.api.put<SalesOrder>(`/api/sales-orders/${id}/reserve`, {});
  }

  cancelOrder(id: string): Observable<SalesOrder> {
    return this.api.put<SalesOrder>(`/api/sales-orders/${id}/cancel`, {});
  }

  // ============== Clients ==============
  getClients(): Observable<Client[]> {
    return this.api.get<Client[]>('/api/clients');
  }

  getClient(id: string): Observable<Client> {
    return this.api.get<Client>(`/api/clients/${id}`);
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return this.api.post<Client>('/api/clients', client);
  }

  // ============== Managers ==============
  getManagers(): Observable<Manager[]> {
    return this.api.get<Manager[]>('/api/managers');
  }

  getManager(id: string): Observable<Manager> {
    return this.api.get<Manager>(`/api/managers/${id}`);
  }

  getActiveManagers(): Observable<Manager[]> {
    return this.api.get<Manager[]>('/api/managers/active');
  }

  createManager(manager: ManagerCreateDto): Observable<Manager> {
    return this.api.post<Manager>('/api/managers', manager);
  }

  updateManager(id: string, manager: ManagerUpdateDto): Observable<Manager> {
    return this.api.put<Manager>(`/api/managers/${id}`, manager);
  }

  deleteManager(id: string): Observable<void> {
    return this.api.delete<void>(`/api/managers/${id}`);
  }

  assignWarehouseToManager(managerId: string, warehouseId: string): Observable<Manager> {
    return this.api.post<Manager>(`/api/managers/${managerId}/warehouses/${warehouseId}`, {});
  }

  removeWarehouseFromManager(managerId: string, warehouseId: string): Observable<void> {
    return this.api.delete<void>(`/api/managers/${managerId}/warehouses/${warehouseId}`);
  }

  // ============== Suppliers ==============
  getSuppliers(): Observable<Supplier[]> {
    return this.api.get<Supplier[]>('/api/suppliers');
  }

  getSupplier(id: string): Observable<Supplier> {
    return this.api.get<Supplier>(`/api/suppliers/${id}`);
  }

  createSupplier(supplier: SupplierCreateDto): Observable<Supplier> {
    return this.api.post<Supplier>('/api/suppliers', supplier);
  }

  updateSupplier(id: string, supplier: SupplierUpdateDto): Observable<Supplier> {
    return this.api.put<Supplier>(`/api/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: string): Observable<void> {
    return this.api.delete<void>(`/api/suppliers/${id}`);
  }

  // ============== Reports ==============
  getOrderReport(fromDate?: string, toDate?: string): Observable<OrderReportDto> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.api.get<OrderReportDto>('/api/reports/orders', { params });
  }

  getInventoryReport(warehouseId?: string): Observable<InventoryReportDto> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.api.get<InventoryReportDto>('/api/reports/inventory', { params });
  }

  getShipmentReport(fromDate?: string, toDate?: string): Observable<ShipmentReportDto> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.api.get<ShipmentReportDto>('/api/reports/shipments', { params });
  }

  // ============== Inventory Movements ==============
  getInventoryMovements(warehouseId?: string, productId?: string): Observable<InventoryMovement[]> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    if (productId) params = params.set('productId', productId);
    return this.api.get<InventoryMovement[]>('/api/inventory-movements', { params });
  }
}
