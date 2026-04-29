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
      access_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          email: string
          id: string
          invite_sent_at: string | null
          message: string | null
          name: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          email: string
          id?: string
          invite_sent_at?: string | null
          message?: string | null
          name: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_sent_at?: string | null
          message?: string | null
          name?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      account_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      car_brands: {
        Row: {
          country: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          country?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          country?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      car_event_images: {
        Row: {
          alt_text: string | null
          car_event_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          car_event_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          car_event_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_event_images_car_event_id_fkey"
            columns: ["car_event_id"]
            isOneToOne: false
            referencedRelation: "car_events"
            referencedColumns: ["id"]
          },
        ]
      }
      car_events: {
        Row: {
          car_id: string
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          title: string | null
          updated_at: string
          year: number | null
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          car_id: string
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          title?: string | null
          updated_at?: string
          year?: number | null
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          car_id?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          title?: string | null
          updated_at?: string
          year?: number | null
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_events_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_images: {
        Row: {
          alt_text: string | null
          car_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          car_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          car_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_invitations: {
        Row: {
          car_id: string
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          sender_note: string | null
          sent_by: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          car_id: string
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          sender_note?: string | null
          sent_by?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          sender_note?: string | null
          sent_by?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_invitations_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_models: {
        Row: {
          brand_id: number | null
          id: number
          name: string
          slug: string
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          brand_id?: number | null
          id?: number
          name: string
          slug: string
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          brand_id?: number | null
          id?: number
          name?: string
          slug?: string
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      car_owners: {
        Row: {
          car_id: string
          created_at: string
          email: string
          id: string
          relationship_end_year: number | null
          relationship_is_public: boolean
          relationship_is_verified: boolean
          relationship_note: string | null
          relationship_start_year: number | null
          relationship_type:
            | Database["public"]["Enums"]["car_relationship_type"]
            | null
          role: string
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          email: string
          id?: string
          relationship_end_year?: number | null
          relationship_is_public?: boolean
          relationship_is_verified?: boolean
          relationship_note?: string | null
          relationship_start_year?: number | null
          relationship_type?:
            | Database["public"]["Enums"]["car_relationship_type"]
            | null
          role?: string
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          email?: string
          id?: string
          relationship_end_year?: number | null
          relationship_is_public?: boolean
          relationship_is_verified?: boolean
          relationship_note?: string | null
          relationship_start_year?: number | null
          relationship_type?:
            | Database["public"]["Enums"]["car_relationship_type"]
            | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_owners_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_publication_requests: {
        Row: {
          action: string
          admin_note: string | null
          car_id: string
          created_at: string
          id: string
          message: string | null
          requested_by: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          action: string
          admin_note?: string | null
          car_id: string
          created_at?: string
          id?: string
          message?: string | null
          requested_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          action?: string
          admin_note?: string | null
          car_id?: string
          created_at?: string
          id?: string
          message?: string | null
          requested_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_publication_requests_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_relationship_requests: {
        Row: {
          car_id: string
          created_at: string
          id: string
          note: string | null
          relationship_end_year: number | null
          relationship_start_year: number | null
          relationship_type: Database["public"]["Enums"]["car_relationship_type"]
          requester_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_note: string | null
          status: string
          updated_at: string
          wants_stewardship: boolean
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          note?: string | null
          relationship_end_year?: number | null
          relationship_start_year?: number | null
          relationship_type: Database["public"]["Enums"]["car_relationship_type"]
          requester_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
          wants_stewardship?: boolean
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          note?: string | null
          relationship_end_year?: number | null
          relationship_start_year?: number | null
          relationship_type?: Database["public"]["Enums"]["car_relationship_type"]
          requester_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          updated_at?: string
          wants_stewardship?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "car_relationship_requests_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_submissions: {
        Row: {
          admin_notes: string | null
          allow_edits: boolean
          body_type: string | null
          brand: string | null
          car_model: string
          car_story: string | null
          car_year: number | null
          category: string | null
          created_at: string
          email: string
          id: string
          images: string[] | null
          owner_name: string
          phone: string | null
          read: boolean | null
          status: string
          tags: string[] | null
          title: string | null
          updated_at: string
          variant: string | null
        }
        Insert: {
          admin_notes?: string | null
          allow_edits?: boolean
          body_type?: string | null
          brand?: string | null
          car_model: string
          car_story?: string | null
          car_year?: number | null
          category?: string | null
          created_at?: string
          email: string
          id?: string
          images?: string[] | null
          owner_name: string
          phone?: string | null
          read?: boolean | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          variant?: string | null
        }
        Update: {
          admin_notes?: string | null
          allow_edits?: boolean
          body_type?: string | null
          brand?: string | null
          car_model?: string
          car_story?: string | null
          car_year?: number | null
          category?: string | null
          created_at?: string
          email?: string
          id?: string
          images?: string[] | null
          owner_name?: string
          phone?: string | null
          read?: boolean | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          variant?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          allow_edits: boolean | null
          approved_at: string | null
          approved_by: string | null
          body_type: string | null
          brand: string | null
          category: string
          created_at: string
          created_by_user_id: string | null
          editorial_status: string | null
          external_links: Json | null
          featured: boolean | null
          geography: Json | null
          id: string
          model: string
          overhauled: boolean | null
          published_at: string | null
          registration_number: string | null
          slug: string
          source: Database["public"]["Enums"]["car_source"]
          status: Database["public"]["Enums"]["car_status"]
          story: string | null
          submission_payload: Json | null
          submitted_by_email: string | null
          submitted_by_name: string | null
          submitted_by_phone: string | null
          submitted_notes: string | null
          tags: string[] | null
          technical_specs: Json | null
          timeline_events: Json | null
          title: string
          updated_at: string
          variant: string | null
          year: number | null
        }
        Insert: {
          allow_edits?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          body_type?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          editorial_status?: string | null
          external_links?: Json | null
          featured?: boolean | null
          geography?: Json | null
          id?: string
          model: string
          overhauled?: boolean | null
          published_at?: string | null
          registration_number?: string | null
          slug: string
          source?: Database["public"]["Enums"]["car_source"]
          status?: Database["public"]["Enums"]["car_status"]
          story?: string | null
          submission_payload?: Json | null
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          submitted_by_phone?: string | null
          submitted_notes?: string | null
          tags?: string[] | null
          technical_specs?: Json | null
          timeline_events?: Json | null
          title: string
          updated_at?: string
          variant?: string | null
          year?: number | null
        }
        Update: {
          allow_edits?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          body_type?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          editorial_status?: string | null
          external_links?: Json | null
          featured?: boolean | null
          geography?: Json | null
          id?: string
          model?: string
          overhauled?: boolean | null
          published_at?: string | null
          registration_number?: string | null
          slug?: string
          source?: Database["public"]["Enums"]["car_source"]
          status?: Database["public"]["Enums"]["car_status"]
          story?: string | null
          submission_payload?: Json | null
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          submitted_by_phone?: string | null
          submitted_notes?: string | null
          tags?: string[] | null
          technical_specs?: Json | null
          timeline_events?: Json | null
          title?: string
          updated_at?: string
          variant?: string | null
          year?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_profile_id: string
          body: string
          car_id: string | null
          created_at: string
          event_id: string | null
          feed_post_id: string | null
          id: string
          is_deleted: boolean
          marketplace_item_id: string | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_profile_id: string
          body: string
          car_id?: string | null
          created_at?: string
          event_id?: string | null
          feed_post_id?: string | null
          id?: string
          is_deleted?: boolean
          marketplace_item_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_profile_id?: string
          body?: string
          car_id?: string | null
          created_at?: string
          event_id?: string | null
          feed_post_id?: string | null
          id?: string
          is_deleted?: boolean
          marketplace_item_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_feed_post_id_fkey"
            columns: ["feed_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_images: {
        Row: {
          alt_text: string | null
          created_at: string
          event_id: string
          id: string
          image_url: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          event_id: string
          id?: string
          image_url: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string
          id: string
          location: string
          max_attendees: number | null
          owner_page_id: string | null
          owner_profile_id: string | null
          practical_info: string | null
          program: string | null
          registration_url: string | null
          short_description: string | null
          slug: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          location: string
          max_attendees?: number | null
          owner_page_id?: string | null
          owner_profile_id?: string | null
          practical_info?: string | null
          program?: string | null
          registration_url?: string | null
          short_description?: string | null
          slug: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          location?: string
          max_attendees?: number | null
          owner_page_id?: string | null
          owner_profile_id?: string | null
          practical_info?: string | null
          program?: string | null
          registration_url?: string | null
          short_description?: string | null
          slug?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_owner_page_id_fkey"
            columns: ["owner_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_profile_id: string
          body: string | null
          car_id: string | null
          created_at: string
          event_id: string | null
          id: string
          is_visible: boolean
          marketplace_item_id: string | null
          page_id: string | null
          post_type: string
          snapshot_entity_type: string | null
          snapshot_image_url: string | null
          snapshot_title: string | null
          updated_at: string | null
        }
        Insert: {
          author_profile_id: string
          body?: string | null
          car_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_visible?: boolean
          marketplace_item_id?: string | null
          page_id?: string | null
          post_type?: string
          snapshot_entity_type?: string | null
          snapshot_image_url?: string | null
          snapshot_title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_profile_id?: string
          body?: string | null
          car_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_visible?: boolean
          marketplace_item_id?: string | null
          page_id?: string | null
          post_type?: string
          snapshot_entity_type?: string | null
          snapshot_image_url?: string | null
          snapshot_title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_notes: string | null
          car_model: string | null
          car_year: number | null
          created_at: string
          customer_name: string
          email: string
          id: string
          message: string | null
          phone: string | null
          read: boolean | null
          recipient_owner_id: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          car_model?: string | null
          car_year?: number | null
          created_at?: string
          customer_name: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          read?: boolean | null
          recipient_owner_id?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          car_model?: string | null
          car_year?: number | null
          created_at?: string
          customer_name?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          read?: boolean | null
          recipient_owner_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_recipient_owner_id_fkey"
            columns: ["recipient_owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_recipient_owner_id_fkey"
            columns: ["recipient_owner_id"]
            isOneToOne: false
            referencedRelation: "public_owner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_items: {
        Row: {
          created_at: string
          id: string
          inquiry_id: string
          marketplace_item_id: string | null
          part_id: string | null
          part_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquiry_id: string
          marketplace_item_id?: string | null
          part_id?: string | null
          part_title: string
        }
        Update: {
          created_at?: string
          id?: string
          inquiry_id?: string
          marketplace_item_id?: string | null
          part_id?: string | null
          part_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_items_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_items_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_rate_limits: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          item_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          item_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          item_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category_id: string | null
          contact_mode: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          owner_id: string
          person_profile_id: string | null
          price: number | null
          price_note: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          contact_mode?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          owner_id: string
          person_profile_id?: string | null
          price?: number | null
          price_note?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          contact_mode?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          owner_id?: string
          person_profile_id?: string | null
          price?: number | null
          price_note?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_owner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_person_profile_id_fkey"
            columns: ["person_profile_id"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_person_profile_id_fkey"
            columns: ["person_profile_id"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          message_type: string | null
          name: string
          phone: string | null
          read: boolean
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          message_type?: string | null
          name: string
          phone?: string | null
          read?: boolean
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          message_type?: string | null
          name?: string
          phone?: string | null
          read?: boolean
          subject?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          car_id: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          car_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          car_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          approved_at: string | null
          avatar_url: string | null
          bio: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name: string
          favorite_brands: string[] | null
          id: string
          location: string | null
          requested_approval_at: string | null
          slug: string | null
          updated_at: string
          user_id: string
          username: string | null
          visible_public: boolean
        }
        Insert: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name: string
          favorite_brands?: string[] | null
          id?: string
          location?: string | null
          requested_approval_at?: string | null
          slug?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          visible_public?: boolean
        }
        Update: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string
          favorite_brands?: string[] | null
          id?: string
          location?: string | null
          requested_approval_at?: string | null
          slug?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          visible_public?: boolean
        }
        Relationships: []
      }
      page_access_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          page_type: string | null
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          page_type?: string | null
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          page_type?: string | null
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_access_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_access_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_car_link_requests: {
        Row: {
          car_id: string
          created_at: string
          id: string
          message: string | null
          page_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          message?: string | null
          page_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          message?: string | null
          page_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_car_link_requests_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_car_link_requests_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_cars: {
        Row: {
          car_id: string
          created_at: string
          id: string
          page_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          page_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_cars_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_cars_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_memberships: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          page_id: string
          person_profile_id: string
          role: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          page_id: string
          person_profile_id: string
          role?: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          page_id?: string
          person_profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_memberships_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_memberships_person_profile_id_fkey"
            columns: ["person_profile_id"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_memberships_person_profile_id_fkey"
            columns: ["person_profile_id"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          session_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          about: string | null
          brand_key: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          founded_year: number | null
          id: string
          is_public: boolean
          location: string | null
          logo_url: string | null
          page_template: string | null
          page_type: string
          page_type_variant: string | null
          slug: string
          status: string
          tagline: string | null
          theme_color: string | null
          title: string
          updated_at: string
          website: string | null
        }
        Insert: {
          about?: string | null
          brand_key?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          founded_year?: number | null
          id?: string
          is_public?: boolean
          location?: string | null
          logo_url?: string | null
          page_template?: string | null
          page_type: string
          page_type_variant?: string | null
          slug: string
          status?: string
          tagline?: string | null
          theme_color?: string | null
          title: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          about?: string | null
          brand_key?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          founded_year?: number | null
          id?: string
          is_public?: boolean
          location?: string | null
          logo_url?: string | null
          page_template?: string | null
          page_type?: string
          page_type_variant?: string | null
          slug?: string
          status?: string
          tagline?: string | null
          theme_color?: string | null
          title?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "person_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_person_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      part_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          part_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          part_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          part_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "part_images_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          category_id: string | null
          condition: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price_max: number | null
          price_min: number | null
          price_note: string | null
          published: boolean | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_max?: number | null
          price_min?: number | null
          price_note?: string | null
          published?: boolean | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_max?: number | null
          price_min?: number | null
          price_note?: string | null
          published?: boolean | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      person_profiles: {
        Row: {
          approved_at: string | null
          avatar_url: string | null
          bio: string | null
          can_create_pages: boolean
          contact_email: string | null
          contact_phone: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          favorite_brands: string[] | null
          id: string
          is_public: boolean
          location: string | null
          requested_approval_at: string | null
          slug: string
          updated_at: string
          user_id: string
          visible_public: boolean
        }
        Insert: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_create_pages?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          display_name: string
          favorite_brands?: string[] | null
          id?: string
          is_public?: boolean
          location?: string | null
          requested_approval_at?: string | null
          slug: string
          updated_at?: string
          user_id: string
          visible_public?: boolean
        }
        Update: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_create_pages?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          favorite_brands?: string[] | null
          id?: string
          is_public?: boolean
          location?: string | null
          requested_approval_at?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          visible_public?: boolean
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          action_text: string | null
          admin_notes: string | null
          app_version: string | null
          created_at: string
          debug_payload: Json | null
          id: string
          page: string | null
          result_text: string | null
          screenshot_url: string | null
          severity: string
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_text?: string | null
          admin_notes?: string | null
          app_version?: string | null
          created_at?: string
          debug_payload?: Json | null
          id?: string
          page?: string | null
          result_text?: string | null
          screenshot_url?: string | null
          severity: string
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_text?: string | null
          admin_notes?: string | null
          app_version?: string | null
          created_at?: string
          debug_payload?: Json | null
          id?: string
          page?: string | null
          result_text?: string | null
          screenshot_url?: string | null
          severity?: string
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_guides: {
        Row: {
          completed_version: number
          created_at: string
          dismissed_at: string | null
          guide_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_version?: number
          created_at?: string
          dismissed_at?: string | null
          guide_key?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_version?: number
          created_at?: string
          dismissed_at?: string | null
          guide_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_owner_profiles: {
        Row: {
          approved_at: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          favorite_brands: string[] | null
          id: string | null
          location: string | null
          slug: string | null
          visible_public: boolean | null
        }
        Insert: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_brands?: string[] | null
          id?: string | null
          location?: string | null
          slug?: string | null
          visible_public?: boolean | null
        }
        Update: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_brands?: string[] | null
          id?: string | null
          location?: string | null
          slug?: string | null
          visible_public?: boolean | null
        }
        Relationships: []
      }
      public_person_profiles: {
        Row: {
          approved_at: string | null
          avatar_url: string | null
          bio: string | null
          can_create_pages: boolean | null
          cover_url: string | null
          created_at: string | null
          display_name: string | null
          favorite_brands: string[] | null
          id: string | null
          is_public: boolean | null
          location: string | null
          slug: string | null
          updated_at: string | null
          user_id: string | null
          visible_public: boolean | null
        }
        Insert: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_create_pages?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_brands?: string[] | null
          id?: string | null
          is_public?: boolean | null
          location?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
          visible_public?: boolean | null
        }
        Update: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_create_pages?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_brands?: string[] | null
          id?: string | null
          is_public?: boolean | null
          location?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string | null
          visible_public?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_search_profiles: {
        Args: { search_term?: string }
        Returns: {
          can_create_pages: boolean
          created_at: string
          display_name: string
          email: string
          id: string
          is_public: boolean
          slug: string
        }[]
      }
      approve_car_relationship_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      approve_page_car_link_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      can_attach_submission_image: {
        Args: { _car_id: string }
        Returns: boolean
      }
      check_inquiry_rate_limit: {
        Args: { p_key: string; p_max?: number; p_window_minutes?: number }
        Returns: Json
      }
      claim_car_after_email_verify: {
        Args: { p_car_id: string }
        Returns: Json
      }
      cleanup_old_inquiry_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_page_views: { Args: never; Returns: undefined }
      create_page_car_link_request: {
        Args: { p_car_id: string; p_message?: string; p_page_id: string }
        Returns: Json
      }
      create_page_with_owner: {
        Args: {
          p_about?: string
          p_contact_email?: string
          p_contact_phone?: string
          p_cover_url?: string
          p_founded_year?: number
          p_is_public?: boolean
          p_location?: string
          p_logo_url?: string
          p_page_type: string
          p_slug: string
          p_tagline?: string
          p_theme_color?: string
          p_title: string
          p_website?: string
        }
        Returns: Json
      }
      find_cars_by_registration_number: {
        Args: { p_normalized: string }
        Returns: {
          id: string
          published_at: string
          slug: string
          title: string
        }[]
      }
      get_event_attendee_count: {
        Args: { p_event_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_admins_images_added: {
        Args: { _car_id: string; _car_title: string }
        Returns: undefined
      }
      notify_admins_owner_pending: {
        Args: { _display_name: string; _owner_id: string }
        Returns: undefined
      }
      notify_owner_profile_pending: {
        Args: { _display_name: string; _owner_id: string; _user_id: string }
        Returns: undefined
      }
      purge_user_data_before_auth_delete: {
        Args: { _user_id: string }
        Returns: undefined
      }
      reject_car_relationship_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: Json
      }
      reject_page_car_link_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      request_seller_approval: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin"
      car_relationship_type:
        | "current_owner"
        | "former_owner"
        | "restorer"
        | "storyteller"
        | "contributor"
        | "other"
      car_source: "manual" | "submission" | "owner_self"
      car_status: "submitted" | "draft" | "published" | "archived"
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
      app_role: ["admin"],
      car_relationship_type: [
        "current_owner",
        "former_owner",
        "restorer",
        "storyteller",
        "contributor",
        "other",
      ],
      car_source: ["manual", "submission", "owner_self"],
      car_status: ["submitted", "draft", "published", "archived"],
    },
  },
} as const
