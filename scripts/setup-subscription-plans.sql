-- =====================================================
-- SUBSCRIPTION PLANS SETUP SCRIPT
-- =====================================================
-- This script creates subscription plans, user subscriptions,
-- and enforces plan-based limits for features and usage
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

-- Plan category enum
DO $$ BEGIN
    CREATE TYPE plan_category AS ENUM ('free', 'paid1', 'paid2', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Analytics tier enum
DO $$ BEGIN
    CREATE TYPE analytics_tier AS ENUM ('basic', 'full');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription status enum
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE SUBSCRIPTION PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    -- Core identification
    plan_key TEXT PRIMARY KEY,  -- 'free', 'starter', 'growth', 'enterprise'
    plan_category plan_category NOT NULL,
    
    -- Display information
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- Bot limits
    max_bots_per_user INTEGER NOT NULL DEFAULT 1,
    
    -- Query limits (NULL = unlimited)
    max_queries_per_bot_per_day INTEGER,  -- NULL means unlimited
    
    -- Document limits
    max_docs_per_bot INTEGER NOT NULL DEFAULT 2,
    max_doc_size_mb INTEGER NOT NULL DEFAULT 5,  -- Maximum size per document in MB
    
    -- URL limits
    max_urls_per_bot INTEGER NOT NULL DEFAULT 1,
    
    -- Widget token limits
    max_widget_tokens_per_bot INTEGER NOT NULL DEFAULT 1,
    
    -- Feature flags
    train_enabled BOOLEAN NOT NULL DEFAULT false,
    analytics_tier analytics_tier NOT NULL DEFAULT 'basic',
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_max_bots CHECK (max_bots_per_user >= 0),
    CONSTRAINT valid_max_queries CHECK (max_queries_per_bot_per_day IS NULL OR max_queries_per_bot_per_day >= 0),
    CONSTRAINT valid_max_docs CHECK (max_docs_per_bot >= 0),
    CONSTRAINT valid_max_doc_size CHECK (max_doc_size_mb > 0),
    CONSTRAINT valid_max_urls CHECK (max_urls_per_bot >= 0),
    CONSTRAINT valid_max_tokens CHECK (max_widget_tokens_per_bot >= 0),
    CONSTRAINT valid_display_name CHECK (char_length(display_name) > 0)
);

-- Indexes for subscription_plans table
CREATE INDEX IF NOT EXISTS idx_subscription_plans_category ON public.subscription_plans(plan_category);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active) WHERE is_active = true;

-- =====================================================
-- 3. CREATE USER SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    -- Core identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_key TEXT NOT NULL REFERENCES public.subscription_plans(plan_key) ON DELETE RESTRICT,
    
    -- Subscription status
    status subscription_status NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Subscription period (for future billing integration)
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,  -- NULL = indefinite
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_ends_at CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- Indexes for user_subscriptions table
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_key ON public.user_subscriptions(plan_key);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON public.user_subscriptions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Partial unique index to ensure only one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_unique_active 
ON public.user_subscriptions(user_id) 
WHERE is_active = true;

-- =====================================================
-- 4. INSERT DEFAULT PLANS
-- =====================================================

-- Free Plan
INSERT INTO public.subscription_plans (
    plan_key,
    plan_category,
    display_name,
    description,
    max_bots_per_user,
    max_queries_per_bot_per_day,
    max_docs_per_bot,
    max_doc_size_mb,
    max_urls_per_bot,
    max_widget_tokens_per_bot,
    train_enabled,
    analytics_tier,
    metadata
) VALUES (
    'free',
    'free',
    'Free',
    'Perfect for personal projects and testing',
    1,  -- 1 bot
    20,  -- 20 queries per bot per day
    2,  -- 2 documents
    5,  -- 5 MB each
    1,  -- 1 URL
    1,  -- 1 widget token per bot
    false,  -- Train feature disabled
    'basic',  -- Basic analytics (no top queries, no unanswered queries)
    '{"features": ["basic_chat", "document_upload", "url_sources"]}'::jsonb
) ON CONFLICT (plan_key) DO UPDATE SET
    plan_category = EXCLUDED.plan_category,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    max_bots_per_user = EXCLUDED.max_bots_per_user,
    max_queries_per_bot_per_day = EXCLUDED.max_queries_per_bot_per_day,
    max_docs_per_bot = EXCLUDED.max_docs_per_bot,
    max_doc_size_mb = EXCLUDED.max_doc_size_mb,
    max_urls_per_bot = EXCLUDED.max_urls_per_bot,
    max_widget_tokens_per_bot = EXCLUDED.max_widget_tokens_per_bot,
    train_enabled = EXCLUDED.train_enabled,
    analytics_tier = EXCLUDED.analytics_tier,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Starter Plan (paid1)
INSERT INTO public.subscription_plans (
    plan_key,
    plan_category,
    display_name,
    description,
    max_bots_per_user,
    max_queries_per_bot_per_day,
    max_docs_per_bot,
    max_doc_size_mb,
    max_urls_per_bot,
    max_widget_tokens_per_bot,
    train_enabled,
    analytics_tier,
    metadata
) VALUES (
    'starter',
    'paid1',
    'Starter',
    'For growing businesses and teams',
    5,  -- 5 bots
    250,  -- 250 queries per bot per day
    5,  -- 5 documents
    20,  -- 20 MB each
    2,  -- 2 URLs
    3,  -- 3 widget tokens per bot
    true,  -- Train feature enabled
    'full',  -- Full analytics
    '{"features": ["all_free_features", "train_mode", "advanced_analytics", "more_bots"]}'::jsonb
) ON CONFLICT (plan_key) DO UPDATE SET
    plan_category = EXCLUDED.plan_category,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    max_bots_per_user = EXCLUDED.max_bots_per_user,
    max_queries_per_bot_per_day = EXCLUDED.max_queries_per_bot_per_day,
    max_docs_per_bot = EXCLUDED.max_docs_per_bot,
    max_doc_size_mb = EXCLUDED.max_doc_size_mb,
    max_urls_per_bot = EXCLUDED.max_urls_per_bot,
    max_widget_tokens_per_bot = EXCLUDED.max_widget_tokens_per_bot,
    train_enabled = EXCLUDED.train_enabled,
    analytics_tier = EXCLUDED.analytics_tier,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Growth Plan (paid2)
INSERT INTO public.subscription_plans (
    plan_key,
    plan_category,
    display_name,
    description,
    max_bots_per_user,
    max_queries_per_bot_per_day,
    max_docs_per_bot,
    max_doc_size_mb,
    max_urls_per_bot,
    max_widget_tokens_per_bot,
    train_enabled,
    analytics_tier,
    metadata
) VALUES (
    'growth',
    'paid2',
    'Growth',
    'For scaling businesses with higher volume needs',
    20,  -- 20 bots
    NULL,  -- Unlimited queries per bot per day
    20,  -- 20 documents
    30,  -- 30 MB each
    6,  -- 6 URLs
    10,  -- 10 widget tokens per bot
    true,  -- Train feature enabled
    'full',  -- Full analytics
    '{"features": ["all_starter_features", "higher_limits", "unlimited_queries"]}'::jsonb
) ON CONFLICT (plan_key) DO UPDATE SET
    plan_category = EXCLUDED.plan_category,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    max_bots_per_user = EXCLUDED.max_bots_per_user,
    max_queries_per_bot_per_day = EXCLUDED.max_queries_per_bot_per_day,
    max_docs_per_bot = EXCLUDED.max_docs_per_bot,
    max_doc_size_mb = EXCLUDED.max_doc_size_mb,
    max_urls_per_bot = EXCLUDED.max_urls_per_bot,
    max_widget_tokens_per_bot = EXCLUDED.max_widget_tokens_per_bot,
    train_enabled = EXCLUDED.train_enabled,
    analytics_tier = EXCLUDED.analytics_tier,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Enterprise Plan
INSERT INTO public.subscription_plans (
    plan_key,
    plan_category,
    display_name,
    description,
    max_bots_per_user,
    max_queries_per_bot_per_day,
    max_docs_per_bot,
    max_doc_size_mb,
    max_urls_per_bot,
    max_widget_tokens_per_bot,
    train_enabled,
    analytics_tier,
    metadata
) VALUES (
    'enterprise',
    'enterprise',
    'Enterprise',
    'For large organizations with custom needs',
    9999,  -- Very high limit (effectively unlimited for now)
    NULL,  -- Unlimited queries per bot per day
    999,  -- Very high limit (effectively unlimited for now)
    100,  -- 100 MB each
    50,  -- 50 URLs
    50,  -- 50 widget tokens per bot
    true,  -- Train feature enabled
    'full',  -- Full analytics
    '{"features": ["all_growth_features", "custom_integrations", "dedicated_support", "sla"], "custom_limits": true}'::jsonb
) ON CONFLICT (plan_key) DO UPDATE SET
    plan_category = EXCLUDED.plan_category,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    max_bots_per_user = EXCLUDED.max_bots_per_user,
    max_queries_per_bot_per_day = EXCLUDED.max_queries_per_bot_per_day,
    max_docs_per_bot = EXCLUDED.max_docs_per_bot,
    max_doc_size_mb = EXCLUDED.max_doc_size_mb,
    max_urls_per_bot = EXCLUDED.max_urls_per_bot,
    max_widget_tokens_per_bot = EXCLUDED.max_widget_tokens_per_bot,
    train_enabled = EXCLUDED.train_enabled,
    analytics_tier = EXCLUDED.analytics_tier,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- =====================================================
-- 5. BACKFILL EXISTING USERS WITH FREE PLAN
-- =====================================================

-- Insert free plan subscription for all existing users who don't have one
INSERT INTO public.user_subscriptions (user_id, plan_key, status, is_active)
SELECT 
    u.id,
    'free',
    'active',
    true
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.user_subscriptions us 
    WHERE us.user_id = u.id AND us.is_active = true
)
ON CONFLICT (user_id) WHERE is_active = true DO NOTHING;

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Use existing handle_updated_at function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for subscription_plans table
DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_subscriptions table
DROP TRIGGER IF EXISTS trigger_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER trigger_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 8. UPDATE NEW USER TRIGGER TO AUTO-ASSIGN FREE PLAN
-- =====================================================

-- Update the existing handle_new_user function to also create a subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile (existing logic)
    INSERT INTO public.user_profiles (
        user_id,
        email,
        full_name,
        display_name,
        first_name,
        last_name,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            NEW.raw_user_meta_data->>'image'
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name'),
        first_name = NEW.raw_user_meta_data->>'first_name',
        last_name = NEW.raw_user_meta_data->>'last_name',
        avatar_url = COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            NEW.raw_user_meta_data->>'image'
        ),
        updated_at = NOW();
    
    -- Create free plan subscription for new user
    INSERT INTO public.user_subscriptions (user_id, plan_key, status, is_active)
    VALUES (NEW.id, 'free', 'active', true)
    ON CONFLICT (user_id) WHERE is_active = true DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, just update subscription if needed
        INSERT INTO public.user_subscriptions (user_id, plan_key, status, is_active)
        VALUES (NEW.id, 'free', 'active', true)
        ON CONFLICT (user_id) WHERE is_active = true DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's active plan
CREATE OR REPLACE FUNCTION public.get_current_user_plan()
RETURNS TABLE (
    plan_key TEXT,
    plan_category plan_category,
    display_name TEXT,
    description TEXT,
    max_bots_per_user INTEGER,
    max_queries_per_bot_per_day INTEGER,
    max_docs_per_bot INTEGER,
    max_doc_size_mb INTEGER,
    max_urls_per_bot INTEGER,
    max_widget_tokens_per_bot INTEGER,
    train_enabled BOOLEAN,
    analytics_tier analytics_tier,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.plan_key,
        sp.plan_category,
        sp.display_name,
        sp.description,
        sp.max_bots_per_user,
        sp.max_queries_per_bot_per_day,
        sp.max_docs_per_bot,
        sp.max_doc_size_mb,
        sp.max_urls_per_bot,
        sp.max_widget_tokens_per_bot,
        sp.train_enabled,
        sp.analytics_tier,
        sp.metadata
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.plan_key = us.plan_key
    WHERE us.user_id = auth.uid()
    AND us.is_active = true
    AND us.status = 'active'
    LIMIT 1;
    
    -- If no active subscription found, return free plan as default
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            sp.plan_key,
            sp.plan_category,
            sp.display_name,
            sp.description,
            sp.max_bots_per_user,
            sp.max_queries_per_bot_per_day,
            sp.max_docs_per_bot,
            sp.max_doc_size_mb,
            sp.max_urls_per_bot,
            sp.max_widget_tokens_per_bot,
            sp.train_enabled,
            sp.analytics_tier,
            sp.metadata
        FROM public.subscription_plans sp
        WHERE sp.plan_key = 'free'
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get plan for a specific user (for admin/service role use)
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS TABLE (
    plan_key TEXT,
    plan_category plan_category,
    display_name TEXT,
    description TEXT,
    max_bots_per_user INTEGER,
    max_queries_per_bot_per_day INTEGER,
    max_docs_per_bot INTEGER,
    max_doc_size_mb INTEGER,
    max_urls_per_bot INTEGER,
    max_widget_tokens_per_bot INTEGER,
    train_enabled BOOLEAN,
    analytics_tier analytics_tier,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.plan_key,
        sp.plan_category,
        sp.display_name,
        sp.description,
        sp.max_bots_per_user,
        sp.max_queries_per_bot_per_day,
        sp.max_docs_per_bot,
        sp.max_doc_size_mb,
        sp.max_urls_per_bot,
        sp.max_widget_tokens_per_bot,
        sp.train_enabled,
        sp.analytics_tier,
        sp.metadata
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.plan_key = us.plan_key
    WHERE us.user_id = p_user_id
    AND us.is_active = true
    AND us.status = 'active'
    LIMIT 1;
    
    -- If no active subscription found, return free plan as default
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            sp.plan_key,
            sp.plan_category,
            sp.display_name,
            sp.description,
            sp.max_bots_per_user,
            sp.max_queries_per_bot_per_day,
            sp.max_docs_per_bot,
            sp.max_doc_size_mb,
            sp.max_urls_per_bot,
            sp.max_widget_tokens_per_bot,
            sp.train_enabled,
            sp.analytics_tier,
            sp.metadata
        FROM public.subscription_plans sp
        WHERE sp.plan_key = 'free'
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. SET UP ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_subscriptions table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. RLS POLICIES FOR SUBSCRIPTION PLANS TABLE
-- =====================================================

-- Everyone can view active subscription plans
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- =====================================================
-- 12. RLS POLICIES FOR USER SUBSCRIPTIONS TABLE
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update subscriptions (for backend operations)
-- This is handled via service role, not RLS policy

-- =====================================================
-- 13. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.user_subscriptions TO authenticated;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_current_user_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(UUID) TO authenticated;

-- Grant permissions to service role (for backend operations)
GRANT ALL ON public.subscription_plans TO service_role;
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_plan() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_plan(UUID) TO service_role;

-- =====================================================
-- SCRIPT COMPLETION
-- =====================================================

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Subscription plans setup completed successfully!';
    RAISE NOTICE 'Features included:';
    RAISE NOTICE '- 4 default plans (free, starter, growth, enterprise)';
    RAISE NOTICE '- User subscription management';
    RAISE NOTICE '- Row Level Security (RLS) policies';
    RAISE NOTICE '- Helper functions for plan retrieval';
    RAISE NOTICE '- Automatic free plan assignment for new users';
    RAISE NOTICE '- Backfill for existing users';
END $$;

