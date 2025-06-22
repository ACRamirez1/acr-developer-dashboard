-- Migration to add lead source tracking

-- Step 1: Add the 'source' column to your 'leads' table
-- This column will store the origin of the lead (e.g., 'Portfolio', 'Google', 'Referral').
-- It defaults to 'Portfolio' and cannot be empty.
ALTER TABLE public.leads
ADD COLUMN source VARCHAR(255) DEFAULT 'Portfolio' NOT NULL;

-- Step 2: Update the existing RLS policies (Optional but good practice)
-- Although the existing policies will cover the new column, explicitly re-creating them
-- makes your policy definitions clearer and more robust for future changes.
--
-- Drop existing policies first to avoid conflicts.
DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to delete leads" ON public.leads;

-- Re-create policies to ensure they cover the new structure.
CREATE POLICY "Allow authenticated users to read leads" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert leads" ON public.leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update leads" ON public.leads
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete leads" ON public.leads
    FOR DELETE USING (auth.role() = 'authenticated');


-- After running this script, you will need to update your portfolio website's
-- contact form to send a 'source' field along with the lead data. 