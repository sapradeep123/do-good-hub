-- Create vendor_package_assignments table for mapping vendors to specific (NGO,Package) combinations
CREATE TABLE IF NOT EXISTS vendor_package_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    package_assignment_id UUID NOT NULL REFERENCES package_assignments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(vendor_id, package_assignment_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_package_assignments_vendor_id ON vendor_package_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_package_assignments_package_assignment_id ON vendor_package_assignments(package_assignment_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_vendor_package_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_package_assignments_updated_at
    BEFORE UPDATE ON vendor_package_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_package_assignments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE vendor_package_assignments IS 'Maps vendors to specific (NGO,Package) combinations via package_assignments';
COMMENT ON COLUMN vendor_package_assignments.vendor_id IS 'Reference to the vendor';
COMMENT ON COLUMN vendor_package_assignments.package_assignment_id IS 'Reference to the package_assignment (which links package to NGO)';
