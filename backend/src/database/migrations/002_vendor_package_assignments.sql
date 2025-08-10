-- Ensure package_assignments exists (Package ↔ NGO)
CREATE TABLE IF NOT EXISTS package_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','delivered','cancelled','completed')),
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_id, ngo_id)
);

CREATE INDEX IF NOT EXISTS idx_package_assignments_package_id ON package_assignments(package_id);
CREATE INDEX IF NOT EXISTS idx_package_assignments_ngo_id ON package_assignments(ngo_id);

CREATE TRIGGER IF NOT EXISTS update_package_assignments_updated_at
BEFORE UPDATE ON package_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create vendor_package_assignments table for mapping vendors to specific (NGO,Package) combinations
CREATE TABLE IF NOT EXISTS vendor_package_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
