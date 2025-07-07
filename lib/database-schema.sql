-- Database schema for quantity takeoff results and embodied carbon calculations

-- Table to store quantity takeoff results
CREATE TABLE IF NOT EXISTS quantity_takeoffs (
    id SERIAL PRIMARY KEY,
    model_urn VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    version_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_elements INTEGER NOT NULL,
    total_volume DECIMAL(15,6) DEFAULT 0,
    total_area DECIMAL(15,6) DEFAULT 0,
    total_length DECIMAL(15,6) DEFAULT 0,
    unique_materials INTEGER DEFAULT 0,
    element_categories JSONB,
    raw_data JSONB, -- Store the complete takeoff result
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    UNIQUE(model_urn, project_id, version_id)
);

-- Table to store individual material quantities
CREATE TABLE IF NOT EXISTS material_quantities (
    id SERIAL PRIMARY KEY,
    takeoff_id INTEGER REFERENCES quantity_takeoffs(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    element_category VARCHAR(255) NOT NULL,
    volume DECIMAL(15,6) DEFAULT 0,
    area DECIMAL(15,6) DEFAULT 0,
    length DECIMAL(15,6) DEFAULT 0,
    mass DECIMAL(15,6), -- Optional, if density data available
    element_count INTEGER NOT NULL,
    properties JSONB, -- Additional material properties
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_material_quantities_takeoff_id (takeoff_id),
    INDEX idx_material_quantities_material_type (material_type),
    INDEX idx_material_quantities_element_category (element_category)
);

-- Table to store individual elements (for detailed analysis)
CREATE TABLE IF NOT EXISTS model_elements (
    id SERIAL PRIMARY KEY,
    takeoff_id INTEGER REFERENCES quantity_takeoffs(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL,
    external_id VARCHAR(255),
    element_name VARCHAR(255),
    category VARCHAR(255),
    level_name VARCHAR(255),
    material_name VARCHAR(255),
    volume DECIMAL(15,6) DEFAULT 0,
    area DECIMAL(15,6) DEFAULT 0,
    length DECIMAL(15,6) DEFAULT 0,
    properties JSONB, -- All element properties
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_model_elements_takeoff_id (takeoff_id),
    INDEX idx_model_elements_category (category),
    INDEX idx_model_elements_material (material_name),
    INDEX idx_model_elements_level (level_name)
);

-- Table to store Revit element types with Uniclass classification
CREATE TABLE IF NOT EXISTS revit_element_types (
    id SERIAL PRIMARY KEY,
    takeoff_id INTEGER REFERENCES quantity_takeoffs(id) ON DELETE CASCADE,
    uniclass_code VARCHAR(50) NOT NULL,
    uniclass_title VARCHAR(255) NOT NULL,
    nbs_chorus_suffix VARCHAR(100),
    type_mark VARCHAR(255),
    family_name VARCHAR(255),
    type_name VARCHAR(255),
    category VARCHAR(255),
    volume DECIMAL(15,6) DEFAULT 0,
    area DECIMAL(15,6) DEFAULT 0,
    length DECIMAL(15,6) DEFAULT 0,
    element_count INTEGER DEFAULT 0,
    properties JSONB, -- Additional element type properties
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_revit_element_types_takeoff_id (takeoff_id),
    INDEX idx_revit_element_types_uniclass_code (uniclass_code),
    INDEX idx_revit_element_types_category (category),
    INDEX idx_revit_element_types_family_name (family_name),
    UNIQUE(takeoff_id, uniclass_code, type_mark)
);

-- Table to store materials linked to element types
CREATE TABLE IF NOT EXISTS element_type_materials (
    id SERIAL PRIMARY KEY,
    takeoff_id INTEGER REFERENCES quantity_takeoffs(id) ON DELETE CASCADE,
    element_type_id INTEGER REFERENCES revit_element_types(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    uniclass_code VARCHAR(50),
    uniclass_title VARCHAR(255),
    nbs_chorus_suffix VARCHAR(100),
    volume DECIMAL(15,6) DEFAULT 0,
    area DECIMAL(15,6) DEFAULT 0,
    length DECIMAL(15,6) DEFAULT 0,
    mass DECIMAL(15,6), -- Material mass in kg
    density DECIMAL(10,3), -- Material density in kg/m³
    unit_cost DECIMAL(10,2), -- Cost per unit if available
    properties JSONB, -- Additional material properties
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_element_type_materials_takeoff_id (takeoff_id),
    INDEX idx_element_type_materials_element_type_id (element_type_id),
    INDEX idx_element_type_materials_material_type (material_type),
    INDEX idx_element_type_materials_uniclass_code (uniclass_code),
    UNIQUE(takeoff_id, element_type_id, material_name)
);

-- Table to store embodied carbon factors
CREATE TABLE IF NOT EXISTS carbon_factors (
    id SERIAL PRIMARY KEY,
    material_type VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    carbon_factor DECIMAL(10,6) NOT NULL, -- kg CO2e per unit
    unit VARCHAR(50) NOT NULL, -- kg, m3, m2, m, etc.
    source VARCHAR(255), -- Data source reference
    region VARCHAR(100) DEFAULT 'Global',
    year INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_carbon_factors_material_type (material_type),
    INDEX idx_carbon_factors_material_name (material_name),
    UNIQUE(material_type, material_name, region, year)
);

-- Table to store calculated embodied carbon results
CREATE TABLE IF NOT EXISTS embodied_carbon_calculations (
    id SERIAL PRIMARY KEY,
    takeoff_id INTEGER REFERENCES quantity_takeoffs(id) ON DELETE CASCADE,
    project_id VARCHAR(255) NOT NULL,
    option_id VARCHAR(255) NOT NULL,
    total_carbon DECIMAL(15,6) NOT NULL, -- Total kg CO2e
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    calculation_method VARCHAR(100) DEFAULT 'quantity_based',
    carbon_breakdown JSONB, -- Detailed breakdown by material/system
    assumptions JSONB, -- Calculation assumptions and factors used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_embodied_carbon_project_option (project_id, option_id),
    INDEX idx_embodied_carbon_takeoff_id (takeoff_id)
);

-- Table to track model upload events and processing status
CREATE TABLE IF NOT EXISTS model_processing_queue (
    id SERIAL PRIMARY KEY,
    model_urn VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    version_id VARCHAR(255),
    model_name VARCHAR(255),
    event_type VARCHAR(100) NOT NULL, -- 'upload', 'version_created', etc.
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    takeoff_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    carbon_calc_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    webhook_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_model_processing_status (processing_status),
    INDEX idx_model_processing_model_urn (model_urn),
    INDEX idx_model_processing_project_id (project_id)
);

-- Insert default carbon factors (example data)
INSERT INTO carbon_factors (material_type, material_name, carbon_factor, unit, source, region, year, description) VALUES
    ('Concrete', 'Normal Weight Concrete', 150.0, 'm3', 'ICE Database', 'UK', 2023, 'Standard concrete mix'),
    ('Concrete', 'High Strength Concrete', 180.0, 'm3', 'ICE Database', 'UK', 2023, 'High strength concrete mix'),
    ('Steel', 'Structural Steel', 2100.0, 'kg', 'ICE Database', 'UK', 2023, 'Hot rolled structural steel'),
    ('Steel', 'Reinforcement Steel', 1950.0, 'kg', 'ICE Database', 'UK', 2023, 'Reinforcing steel bars'),
    ('Timber', 'Softwood Timber', 45.0, 'm3', 'ICE Database', 'UK', 2023, 'Kiln dried softwood'),
    ('Timber', 'Hardwood Timber', 55.0, 'm3', 'ICE Database', 'UK', 2023, 'Kiln dried hardwood'),
    ('Masonry', 'Clay Brick', 240.0, 'kg', 'ICE Database', 'UK', 2023, 'Standard clay brick'),
    ('Masonry', 'Concrete Block', 180.0, 'kg', 'ICE Database', 'UK', 2023, 'Concrete masonry unit'),
    ('Glass', 'Float Glass', 850.0, 'kg', 'ICE Database', 'UK', 2023, 'Standard float glass'),
    ('Aluminum', 'Aluminum Extrusion', 8500.0, 'kg', 'ICE Database', 'UK', 2023, 'Extruded aluminum profile'),
    ('Insulation', 'Mineral Wool', 28.0, 'kg', 'ICE Database', 'UK', 2023, 'Glass/rock wool insulation'),
    ('Insulation', 'Expanded Polystyrene', 117.0, 'kg', 'ICE Database', 'UK', 2023, 'EPS insulation'),
    ('Gypsum', 'Gypsum Plasterboard', 280.0, 'kg', 'ICE Database', 'UK', 2023, 'Standard plasterboard'),
    ('Ceramic', 'Ceramic Tile', 440.0, 'kg', 'ICE Database', 'UK', 2023, 'Standard ceramic floor tile'),
    ('Other', 'Unknown Material', 100.0, 'kg', 'Assumption', 'Global', 2023, 'Default factor for unknown materials')
ON CONFLICT (material_type, material_name, region, year) DO NOTHING;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_quantity_takeoffs_updated_at BEFORE UPDATE ON quantity_takeoffs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carbon_factors_updated_at BEFORE UPDATE ON carbon_factors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_embodied_carbon_calculations_updated_at BEFORE UPDATE ON embodied_carbon_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_processing_queue_updated_at BEFORE UPDATE ON model_processing_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();