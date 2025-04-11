// User 系统类型定义

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  last_sign_in: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  credits_monthly: number;
  storage_days: number;
  features: PlanFeatures;
  created_at: string;
  updated_at: string;
  stripe_price_monthly: string | null;
  stripe_price_yearly: string | null;
  active: boolean;
}

export interface PlanFeatures {
  queue_priority: number;
  commercial_use: boolean;
  download_quality: 'basic' | 'high' | 'highest';
  parallel_tasks?: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  is_yearly: boolean;
  plan?: SubscriptionPlan; // 关联计划
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'failed';
  stripe_payment_id: string | null;
  payment_method: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  payment_type: 'subscription' | 'credits' | 'other';
}

export type FeatureType = 'text_to_music' | 'lyrics_generation' | 'vocal_separation' | 'music_extension' | 'wav_conversion' | 'video_generation';

export interface UsageRecord {
  id: string;
  user_id: string;
  feature_type: FeatureType;
  credits_used: number;
  created_at: string;
  task_id: string | null;
  status: 'success' | 'failed' | 'pending';
  metadata: Record<string, any> | null;
}

export interface UserCredits {
  id: string;
  user_id: string;
  credits: number;
  last_reset: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'purchase' | 'consumption' | 'subscription' | 'refund' | 'reset' | 'bonus';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  created_at: string;
  feature_type: FeatureType | null;
  balance_after: number | null;
  payment_id: string | null;
  metadata: Record<string, any> | null;
}

// 用户音乐记录
export interface MusicTrack {
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  duration: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  task_id: string | null;
  source_type: 'generated' | 'extended' | 'uploaded' | 'vocal_separated' | 'wav_converted';
  metadata: Record<string, any> | null;
  expiration_date: string | null;
  is_public: boolean;
  commercial_use: boolean;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  tracks?: MusicTrack[]; // 包含播放列表中的曲目
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  added_at: string;
  position: number | null;
  track?: MusicTrack; // 关联的音乐
}

// 用户完整信息（包含订阅和积分）
export interface UserWithDetails {
  profile: Profile;
  subscription?: Subscription;
  credits?: UserCredits;
}

// 积分包定义
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description?: string;
  isPopular?: boolean;
  discount?: number; // 折扣百分比
} 