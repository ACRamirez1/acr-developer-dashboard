-- Lead Management System Upgrade
-- This script enhances the leads table with comprehensive tracking capabilities

-- Step 1: Add new columns for enhanced lead management
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source VARCHAR(255) DEFAULT 'Manual Entry' NOT NULL,
ADD COLUMN IF NOT EXISTS contact_status VARCHAR(50) DEFAULT 'not_contacted' NOT NULL,
ADD COLUMN IF NOT EXISTS first_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS research_notes TEXT,
ADD COLUMN IF NOT EXISTS website_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS budget_range VARCHAR(100),
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lead_stage VARCHAR(50) DEFAULT 'prospect';

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_contact_status ON public.leads(contact_status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_stage ON public.leads(lead_stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority_level ON public.leads(priority_level);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON public.leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads(industry);

-- Step 3: Create a function to automatically update contact tracking
CREATE OR REPLACE FUNCTION update_contact_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- If contact_status changed to 'contacted' and it wasn't before
    IF NEW.contact_status = 'contacted' AND OLD.contact_status != 'contacted' THEN
        -- Set first contact date if this is the first contact
        IF OLD.first_contact_date IS NULL THEN
            NEW.first_contact_date = NOW();
        END IF;
        
        -- Always update last contact date and increment counter
        NEW.last_contact_date = NOW();
        NEW.contact_count = COALESCE(OLD.contact_count, 0) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically track contact changes
DROP TRIGGER IF EXISTS trigger_update_contact_tracking ON public.leads;
CREATE TRIGGER trigger_update_contact_tracking
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_tracking();

-- Step 5: Create a view for lead analytics
CREATE OR REPLACE VIEW lead_analytics AS
SELECT 
    source,
    contact_status,
    lead_stage,
    industry,
    priority_level,
    COUNT(*) as count,
    AVG(lead_score) as avg_score,
    COUNT(CASE WHEN contact_status = 'contacted' THEN 1 END) as contacted_count,
    COUNT(CASE WHEN contact_status = 'not_contacted' THEN 1 END) as not_contacted_count
FROM public.leads
GROUP BY source, contact_status, lead_stage, industry, priority_level;

-- Step 6: Update RLS policies to cover new structure
DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to delete leads" ON public.leads;

CREATE POLICY "Allow authenticated users to read leads" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert leads" ON public.leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update leads" ON public.leads
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete leads" ON public.leads
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant access to the analytics view
GRANT SELECT ON lead_analytics TO authenticated; 