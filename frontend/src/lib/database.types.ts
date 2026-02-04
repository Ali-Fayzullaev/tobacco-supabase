// =====================================================
// TOBACCO SHOP - DATABASE TYPES
// =====================================================
// Эти типы автоматически генерируются из схемы Supabase
// Запусти: npm run supabase:types для обновления
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          birth_date: string;
          is_active: boolean;
          is_admin: boolean;
          is_verified: boolean;
          preferred_language: 'ru' | 'kk';
          created_at: string;
          updated_at: string;
          external_id: string | null;
          last_sync_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          birth_date: string;
          is_active?: boolean;
          is_admin?: boolean;
          is_verified?: boolean;
          preferred_language?: 'ru' | 'kk';
          created_at?: string;
          updated_at?: string;
          external_id?: string | null;
          last_sync_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          birth_date?: string;
          is_active?: boolean;
          is_admin?: boolean;
          is_verified?: boolean;
          preferred_language?: 'ru' | 'kk';
          created_at?: string;
          updated_at?: string;
          external_id?: string | null;
          last_sync_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: number;
          slug: string;
          name_ru: string;
          name_kk: string;
          description_ru: string | null;
          description_kk: string | null;
          parent_id: number | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          slug: string;
          name_ru: string;
          name_kk: string;
          description_ru?: string | null;
          description_kk?: string | null;
          parent_id?: number | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          name_ru?: string;
          name_kk?: string;
          description_ru?: string | null;
          description_kk?: string | null;
          parent_id?: number | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: number;
          sku: string;
          slug: string;
          name_ru: string;
          name_kk: string;
          description_short_ru: string | null;
          description_short_kk: string | null;
          description_full_ru: string | null;
          description_full_kk: string | null;
          category_id: number | null;
          brand: string | null;
          price: number;
          old_price: number | null;
          stock_quantity: number;
          is_active: boolean;
          is_deleted: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          external_id: string | null;
          last_sync_at: string | null;
        };
        Insert: {
          id?: number;
          sku: string;
          slug: string;
          name_ru: string;
          name_kk: string;
          description_short_ru?: string | null;
          description_short_kk?: string | null;
          description_full_ru?: string | null;
          description_full_kk?: string | null;
          category_id?: number | null;
          brand?: string | null;
          price: number;
          old_price?: number | null;
          stock_quantity?: number;
          is_active?: boolean;
          is_deleted?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          external_id?: string | null;
          last_sync_at?: string | null;
        };
        Update: {
          id?: number;
          sku?: string;
          slug?: string;
          name_ru?: string;
          name_kk?: string;
          description_short_ru?: string | null;
          description_short_kk?: string | null;
          description_full_ru?: string | null;
          description_full_kk?: string | null;
          category_id?: number | null;
          brand?: string | null;
          price?: number;
          old_price?: number | null;
          stock_quantity?: number;
          is_active?: boolean;
          is_deleted?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          external_id?: string | null;
          last_sync_at?: string | null;
        };
      };
      product_images: {
        Row: {
          id: number;
          product_id: number;
          image_url: string;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          image_url: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          image_url?: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      product_attributes: {
        Row: {
          id: number;
          product_id: number;
          attribute_name_ru: string;
          attribute_name_kk: string;
          attribute_value_ru: string;
          attribute_value_kk: string;
          sort_order: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          attribute_name_ru: string;
          attribute_name_kk: string;
          attribute_value_ru: string;
          attribute_value_kk: string;
          sort_order?: number;
        };
        Update: {
          id?: number;
          product_id?: number;
          attribute_name_ru?: string;
          attribute_name_kk?: string;
          attribute_value_ru?: string;
          attribute_value_kk?: string;
          sort_order?: number;
        };
      };
      addresses: {
        Row: {
          id: number;
          user_id: string;
          title: string | null;
          city: string;
          street: string;
          building: string;
          apartment: string | null;
          entrance: string | null;
          floor: string | null;
          comment: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          title?: string | null;
          city: string;
          street: string;
          building: string;
          apartment?: string | null;
          entrance?: string | null;
          floor?: string | null;
          comment?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          title?: string | null;
          city?: string;
          street?: string;
          building?: string;
          apartment?: string | null;
          entrance?: string | null;
          floor?: string | null;
          comment?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: number;
          order_number: string;
          user_id: string;
          status: OrderStatus;
          total_amount: number;
          delivery_method: DeliveryMethod;
          delivery_cost: number;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          delivery_city: string | null;
          delivery_street: string | null;
          delivery_building: string | null;
          delivery_apartment: string | null;
          delivery_comment: string | null;
          contact_name: string;
          contact_phone: string;
          comment: string | null;
          admin_comment: string | null;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          external_id: string | null;
          external_number: string | null;
          last_sync_at: string | null;
          sync_status: string;
        };
        Insert: {
          id?: number;
          order_number?: string;
          user_id: string;
          status?: OrderStatus;
          total_amount: number;
          delivery_method: DeliveryMethod;
          delivery_cost?: number;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          delivery_city?: string | null;
          delivery_street?: string | null;
          delivery_building?: string | null;
          delivery_apartment?: string | null;
          delivery_comment?: string | null;
          contact_name: string;
          contact_phone: string;
          comment?: string | null;
          admin_comment?: string | null;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          external_id?: string | null;
          external_number?: string | null;
          last_sync_at?: string | null;
          sync_status?: string;
        };
        Update: {
          id?: number;
          order_number?: string;
          user_id?: string;
          status?: OrderStatus;
          total_amount?: number;
          delivery_method?: DeliveryMethod;
          delivery_cost?: number;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          delivery_city?: string | null;
          delivery_street?: string | null;
          delivery_building?: string | null;
          delivery_apartment?: string | null;
          delivery_comment?: string | null;
          contact_name?: string;
          contact_phone?: string;
          comment?: string | null;
          admin_comment?: string | null;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          external_id?: string | null;
          external_number?: string | null;
          last_sync_at?: string | null;
          sync_status?: string;
        };
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price: number;
          total: number;
          product_name_ru: string;
          product_name_kk: string | null;
          product_sku: string | null;
        };
        Insert: {
          id?: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price: number;
          total: number;
          product_name_ru: string;
          product_name_kk?: string | null;
          product_sku?: string | null;
        };
        Update: {
          id?: number;
          order_id?: number;
          product_id?: number;
          quantity?: number;
          price?: number;
          total?: number;
          product_name_ru?: string;
          product_name_kk?: string | null;
          product_sku?: string | null;
        };
      };
      cart_items: {
        Row: {
          id: number;
          user_id: string;
          product_id: number;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          product_id: number;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          product_id?: number;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: number;
          user_id: string;
          product_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          product_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          product_id?: number;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: number;
          product_id: number;
          user_id: string;
          rating: number;
          comment: string | null;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          user_id: string;
          rating: number;
          comment?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          type: string;
          title_ru: string;
          title_kk: string | null;
          message_ru: string;
          message_kk: string | null;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          type: string;
          title_ru: string;
          title_kk?: string | null;
          message_ru: string;
          message_kk?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          type?: string;
          title_ru?: string;
          title_kk?: string | null;
          message_ru?: string;
          message_kk?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_adult: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      search_products: {
        Args: {
          search_query?: string;
          category_filter?: number;
          brand_filter?: string;
          min_price?: number;
          max_price?: number;
          in_stock_only?: boolean;
          sort_by?: string;
          page_number?: number;
          page_size?: number;
        };
        Returns: {
          id: number;
          sku: string;
          slug: string;
          name_ru: string;
          name_kk: string;
          description_short_ru: string;
          brand: string;
          price: number;
          old_price: number | null;
          stock_quantity: number;
          category_id: number;
          primary_image_url: string;
          is_featured: boolean;
          relevance_score: number;
          total_count: number;
        }[];
      };
      get_product_by_slug: {
        Args: {
          product_slug: string;
        };
        Returns: {
          id: number;
          sku: string;
          slug: string;
          name_ru: string;
          name_kk: string;
          description_short_ru: string;
          description_short_kk: string;
          description_full_ru: string;
          description_full_kk: string;
          brand: string;
          price: number;
          old_price: number | null;
          stock_quantity: number;
          category_id: number;
          category_name_ru: string;
          is_featured: boolean;
        }[];
      };
      get_similar_products: {
        Args: {
          product_id_param: number;
          limit_count?: number;
        };
        Returns: {
          id: number;
          slug: string;
          name_ru: string;
          price: number;
          primary_image_url: string;
        }[];
      };
      add_to_cart: {
        Args: {
          product_id_param: number;
          quantity_param?: number;
        };
        Returns: Json;
      };
      get_cart: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: number;
          product_id: number;
          quantity: number;
          product_name_ru: string;
          product_name_kk: string;
          product_price: number;
          product_stock: number;
          product_slug: string;
          primary_image_url: string;
          item_total: number;
        }[];
      };
      update_cart_quantity: {
        Args: {
          cart_item_id: number;
          new_quantity: number;
        };
        Returns: Json;
      };
      clear_cart: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      create_order: {
        Args: {
          delivery_method_param: DeliveryMethod;
          payment_method_param: PaymentMethod;
          delivery_city_param: string;
          delivery_street_param: string;
          delivery_building_param: string;
          delivery_apartment_param?: string;
          delivery_comment_param?: string;
          contact_name_param?: string;
          contact_phone_param?: string;
          order_comment_param?: string;
        };
        Returns: Json;
      };
      get_my_orders: {
        Args: {
          page_number?: number;
          page_size?: number;
        };
        Returns: {
          id: number;
          order_number: string;
          status: OrderStatus;
          total_amount: number;
          delivery_method: DeliveryMethod;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          created_at: string;
          items_count: number;
          total_count: number;
        }[];
      };
      toggle_favorite: {
        Args: {
          product_id_param: number;
        };
        Returns: Json;
      };
      admin_update_order_status: {
        Args: {
          order_id_param: number;
          new_status: OrderStatus;
          admin_comment_param?: string;
        };
        Returns: Json;
      };
      admin_get_dashboard_stats: {
        Args: {
          start_date?: string;
          end_date?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      order_status: OrderStatus;
      delivery_method: DeliveryMethod;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    };
  };
}

// Enums
export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
export type DeliveryMethod = 'courier' | 'pickup';
export type PaymentMethod = 'cash' | 'card' | 'kaspi';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Aliases
export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type ProductImage = Tables<'product_images'>;
export type ProductAttribute = Tables<'product_attributes'>;
export type Address = Tables<'addresses'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type CartItem = Tables<'cart_items'>;
export type Favorite = Tables<'favorites'>;
export type Review = Tables<'reviews'>;
export type Notification = Tables<'notifications'>;

// Extended types
export interface ProductWithImages extends Product {
  images: ProductImage[];
  attributes: ProductAttribute[];
  category: Category | null;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
  product_image: ProductImage | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
