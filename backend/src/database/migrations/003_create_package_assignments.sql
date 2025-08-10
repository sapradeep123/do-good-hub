-- Create package_assignments table (Package ↔ NGO mapping)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_package_assignments_package_id ON package_assignments(package_id);
CREATE INDEX IF NOT EXISTS idx_package_assignments_ngo_id ON package_assignments(ngo_id);

-- Trigger to keep updated_at in sync
CREATE TRIGGER update_package_assignments_updated_at
BEFORE UPDATE ON package_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


