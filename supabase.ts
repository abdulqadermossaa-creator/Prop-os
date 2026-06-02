// src/supabase.ts
// عميل Supabase المشترك للـ MCP Server

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// التحقق من الـ env variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('❌ SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY مطلوبان في .env');
}

// نستخدم service_role عشان نقدر نتجاوز RLS في بعض العمليات
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

// أنواع البيانات الأساسية
export interface Unit {
  id: string;
  name: string;
  qlvn_code: string;
  host_id: string;
  operational_status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  approval_status: 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  pi_status: 'online' | 'offline';
  wifi_name?: string;
  current_temp?: number;
  target_temp?: number;
  neighborhood?: string;
}

export interface GuestSession {
  id: string;
  unit_id: string;
  guest_name: string;
  guest_phone?: string;
  guest_token: string;
  token_expires_at: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  checked_in_at?: string;
  last_seen?: string;
}

export interface ActivityLog {
  id: string;
  unit_id: string;
  event_type: string;
  source: string;
  severity: 'info' | 'warning' | 'critical';
  payload: Record<string, unknown>;
  created_at: string;
}
