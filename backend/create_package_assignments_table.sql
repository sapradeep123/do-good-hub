-- Create package_assignments table for many-to-many relationships
CREATE TABLE IF NOT EXISTS package_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Ensure either ngo_id or vendor_id is provided, but not both
    CONSTRAINT check_assignment_type CHECK (
        (ngo_id IS NOT NULL AND vendor_id IS NULL) OR 
        (ngo_id IS NULL AND vendor_id IS NOT NULL)
    ),
    -- Prevent duplicate assignments
    CONSTRAINT unique_package_ngo UNIQUE (package_id, ngo_id),
    CONSTRAINT unique_package_vendor UNIQUE (package_id, vendor_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_package_assignments_package_id ON package_assignments(package_id);
CREATE INDEX IF NOT EXISTS idx_package_assignments_ngo_id ON package_assignments(ngo_id);
CREATE INDEX IF NOT EXISTS idx_package_assignments_vendor_id ON package_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_package_assignments_active ON package_assignments(is_active);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_package_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_package_assignments_updated_at
    BEFORE UPDATE ON package_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_package_assignments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE package_assignments IS 'Many-to-many relationships between packages and NGOs/vendors';
COMMENT ON COLUMN package_assignments.package_id IS 'Reference to the package';
COMMENT ON COLUMN package_assignments.ngo_id IS 'Reference to the NGO (nullable if vendor_id is set)';
COMMENT ON COLUMN package_assignments.vendor_id IS 'Reference to the vendor (nullable if ngo_id is set)';
COMMENT ON COLUMN package_assignments.is_active IS 'Whether this assignment is currently active'; 