// =====================================================
// TOBACCO SHOP - DATABASE TYPES (Simplified)
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// =====================================================
// ТАБЛИЦЫ
// =====================================================

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  city: string | null;
  address: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_kk: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  name_kk: string | null;
  slug: string;
  description: string | null;
  description_kk: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  in_stock: boolean;
  stock?: number;
  is_active: boolean;
  is_featured: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  order_step?: number;
  rating?: number;
  reviews_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  name: string;
  value: string;
  sort_order: number;
}

// Extended product type with all relations
export interface ProductFull extends Product {
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  category?: Category | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_method: string | null;
  payment_method: string | null;
  payment_status: string | null;
  shipping_address: Json | null;
  phone: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

// =====================================================
// DATABASE INTERFACE (для Supabase Client)
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & { name: string; slug: string };
        Update: Partial<Category>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { name: string; slug: string; price: number };
        Update: Partial<Product>;
      };
      product_images: {
        Row: ProductImage;
        Insert: Partial<ProductImage> & { product_id: string; image_url: string };
        Update: Partial<ProductImage>;
      };
      product_attributes: {
        Row: ProductAttribute;
        Insert: Partial<ProductAttribute> & { product_id: string; name: string; value: string };
        Update: Partial<ProductAttribute>;
      };
      cart_items: {
        Row: CartItem;
        Insert: Partial<CartItem> & { user_id: string; product_id: string };
        Update: Partial<CartItem>;
      };
      favorites: {
        Row: Favorite;
        Insert: Partial<Favorite> & { user_id: string; product_id: string };
        Update: Partial<Favorite>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & { user_id: string; total_amount: number };
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & { order_id: string; product_name: string; quantity: number; price: number };
        Update: Partial<OrderItem>;
      };
    };
  };
}

// =====================================================
// РАСШИРЕННЫЕ ТИПЫ ДЛЯ UI
// =====================================================

export interface ProductWithCategory extends Product {
  category?: Category;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Типы для форм
export interface ProductFormData {
  name: string;
  name_kk?: string;
  slug: string;
  description?: string;
  description_kk?: string;
  price: number;
  old_price?: number;
  image_url?: string;
  sku?: string;
  brand?: string;
  category_id?: string;
  in_stock?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface CategoryFormData {
  name: string;
  name_kk?: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Статусы заказов
export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждён',
  processing: 'Собирается',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export const ORDER_STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-yellow-900/30 text-yellow-400',
  confirmed: 'bg-blue-900/30 text-blue-400',
  processing: 'bg-purple-900/30 text-purple-400',
  shipped: 'bg-indigo-900/30 text-indigo-400',
  delivered: 'bg-green-900/30 text-green-400',
  cancelled: 'bg-red-900/30 text-red-400',
};
