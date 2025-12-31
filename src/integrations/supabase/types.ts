export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string | null
          product_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          message: string | null
          offer_amount_inr: number
          product_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          message?: string | null
          offer_amount_inr: number
          product_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          message?: string | null
          offer_amount_inr?: number
          product_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
          otp_code: string
          purpose: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          otp_code: string
          purpose?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          otp_code?: string
          purpose?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          condition: string
          created_at: string
          description: string
          id: string
          images: string[]
          is_negotiable: boolean | null
          location: string | null
          original_price_inr: number | null
          price_inr: number
          seller_id: string
          status: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          category_id: string
          condition?: string
          created_at?: string
          description: string
          id?: string
          images?: string[]
          is_negotiable?: boolean | null
          location?: string | null
          original_price_inr?: number | null
          price_inr: number
          seller_id: string
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          category_id?: string
          condition?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_negotiable?: boolean | null
          location?: string | null
          original_price_inr?: number | null
          price_inr?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college_email: string
          college_name: string | null
          created_at: string
          full_name: string
          id: string
          is_email_verified: boolean | null
          is_phone_verified: boolean | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          college_email: string
          college_name?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_email_verified?: boolean | null
          is_phone_verified?: boolean | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          college_email?: string
          college_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_email_verified?: boolean | null
          is_phone_verified?: boolean | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount_inr: number
          created_at: string
          id: string
          is_verified: boolean | null
          payment_screenshot_url: string | null
          subscription_id: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_inr: number
          created_at?: string
          id?: string
          is_verified?: boolean | null
          payment_screenshot_url?: string | null
          subscription_id: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_inr?: number
          created_at?: string
          id?: string
          is_verified?: boolean | null
          payment_screenshot_url?: string | null
          subscription_id?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          listing_count: number
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_inr: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          listing_count: number
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_inr: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          listing_count?: number
          name?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_inr?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_inr: number
          buyer_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          payment_method: string | null
          product_id: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
        }
        Insert: {
          amount_inr: number
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          product_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Update: {
          amount_inr?: number
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          product_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          listings_remaining: number
          payment_screenshot_url: string | null
          payment_verified: boolean | null
          plan_id: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          listings_remaining: number
          payment_screenshot_url?: string | null
          payment_verified?: boolean | null
          plan_id: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          listings_remaining?: number
          payment_screenshot_url?: string | null
          payment_verified?: boolean | null
          plan_id?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_listings_remaining: {
        Args: { _user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "buyer" | "seller"
      offer_status: "pending" | "accepted" | "rejected" | "expired"
      product_status: "pending" | "active" | "sold" | "expired"
      subscription_plan: "free" | "basic" | "premium"
      transaction_status: "pending" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "buyer", "seller"],
      offer_status: ["pending", "accepted", "rejected", "expired"],
      product_status: ["pending", "active", "sold", "expired"],
      subscription_plan: ["free", "basic", "premium"],
      transaction_status: ["pending", "completed", "cancelled"],
    },
  },
} as const
