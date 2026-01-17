// ============== Product ==============
export interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string;
  unitPrice: number;
  profit?: number;
  image?: string;
  active: boolean;
}

export interface ProductCreateDto {
  sku: string;
  name: string;
  category?: string;
  unitPrice: number;
  profit?: number;
  image?: string;
}

// ============== Inventory ==============
export interface Inventory {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  warehouseId: string;
  warehouseName?: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
  reorderPoint?: number;
  reorderQty?: number;
}

export interface InventoryAdjustDto {
  warehouseId: string;
  productId: string;
  adjustmentQty: number;
  reason: string;
}

// ============== Warehouse ==============
export interface Warehouse {
  id: string;
  code?: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  capacity?: number;
  active: boolean;
  managerEmail?: string;
}

export interface WarehouseCreateDto {
  code?: string;
  name: string;
  active?: boolean;
}

// ============== Carrier ==============
export type CarrierStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'MAINTENANCE' | 'INACTIVE';

export interface Carrier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  rate?: number;
  maxDailyShipments: number;
  status: CarrierStatus;
  active: boolean;
  // Legacy fields for compatibility
  contact?: string;
  vehicleType?: string;
  capacity?: number;
}

export interface CarrierCreateDto {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  rate?: number;
  maxDailyShipments: number;
}

// ============== Shipment ==============
export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

export interface Shipment {
  id: string;
  orderId: string;
  orderNumber?: string;
  carrierId?: string;
  carrierName?: string;
  warehouseId: string;
  warehouseName?: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  destinationAddress?: string;
}

export interface ShipmentCreateDto {
  orderId: string;
  carrierId?: string;
  warehouseId: string;
  destinationAddress: string;
}

// ============== Sales Order ==============
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'RESERVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface SalesOrderLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName?: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  shippingAddress?: string;
  lines: SalesOrderLine[];
}

export interface SalesOrderCreateDto {
  clientId: string;
  shippingAddress: string;
  lines: { productId: string; quantity: number }[];
}

// ============== Purchase Order ==============
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName?: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  expectedDelivery?: string;
}

// ============== Client ==============
export interface Client {
  id: string;
  name: string;
  email: string;
  contact?: string;
  address?: string;
  active: boolean;
}

// ============== Manager ==============
export interface Manager {
  id: string;
  email: string;
  name?: string;
  contact?: string;
  warehouseIds?: string[];
  warehouseId?: string;
  warehouseName?: string;
  active: boolean;
}

export interface ManagerCreateDto {
  email: string;
  password: string;
  warehouseIds?: string[];
  active?: boolean;
}

export interface ManagerUpdateDto {
  email?: string;
  password?: string;
  warehouseIds?: string[];
  active?: boolean;
}

// ============== Supplier ==============
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  contact?: string;
  address?: string;
  active: boolean;
}

export interface SupplierCreateDto {
  name: string;
  contact?: string;
}

export interface SupplierUpdateDto {
  name?: string;
  email?: string;
  contact?: string;
  address?: string;
  active?: boolean;
}

// ============== Reports ==============
export interface OrderReportDto {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  deliveryRate: number;
  ordersByStatus: Record<string, number>;
}

export interface InventoryReportDto {
  totalProducts: number;
  totalQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
  overStockItems: number;
  totalInventoryValue: number;
  inventoryByWarehouse: Record<string, number>;
}

export interface ShipmentReportDto {
  totalShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  onTimeDeliveryRate: number;
  averageDeliveryTime: number;
  shipmentsByCarrier: Record<string, number>;
}

// ============== Inventory Movement ==============
export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName?: string;
  warehouseId: string;
  warehouseName?: string;
  movementType: MovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

// ============== Pagination ==============
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ============== Dashboard Stats ==============
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalShipments: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockAlerts: number;
  activeCarriers: number;
  totalWarehouses: number;
}
