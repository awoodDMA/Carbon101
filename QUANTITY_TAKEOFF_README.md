# Automated Quantity Takeoff System

This system automatically performs quantity takeoffs on BIM models uploaded to BIM 360 / Autodesk Construction Cloud (ACC) and calculates embodied carbon values for sustainability analysis.

## Overview

The system consists of several interconnected components:

1. **Model Upload Detection**: Webhooks detect new model versions
2. **Quantity Takeoff Engine**: Extracts material quantities using Model Derivative API
3. **Embodied Carbon Calculator**: Calculates carbon footprint based on quantities
4. **Data Storage**: Stores results for analysis and reporting

## Architecture

```
BIM 360/ACC Model Upload
          ↓
    Webhook Trigger
          ↓
  Quantity Takeoff API
          ↓
Model Derivative API Analysis
          ↓
Material Quantity Extraction
          ↓
Embodied Carbon Calculation
          ↓
    Results Storage
          ↓
  Dashboard Display
```

## Key Components

### 1. Quantity Takeoff Service (`lib/quantity-takeoff.ts`)

**Purpose**: Extracts detailed material quantities from BIM models using the Autodesk Model Derivative API.

**Key Features**:
- Automatic element identification and categorization
- Material extraction from element properties
- Volume, area, and length calculations
- Support for multiple model formats (Revit, IFC, etc.)

**API Usage**:
```typescript
import { QuantityTakeoffService } from '@/lib/quantity-takeoff';

const service = new QuantityTakeoffService(accessToken);
const result = await service.performQuantityTakeoff(modelUrn, projectId, versionId);
```

### 2. Embodied Carbon Calculator (`lib/embodied-carbon-calculator.ts`)

**Purpose**: Calculates embodied carbon based on quantity takeoff results and material carbon factors.

**Key Features**:
- Material-specific carbon factor matching
- Multiple calculation units (volume, area, mass)
- Data quality assessment
- Comprehensive reporting

**API Usage**:
```typescript
import EmbodiedCarbonCalculator from '@/lib/embodied-carbon-calculator';

const calculator = new EmbodiedCarbonCalculator();
const carbonResult = await calculator.calculateEmbodiedCarbon(takeoffResult, projectId, optionId);
```

### 3. Webhook System (`app/api/webhooks/model-upload/route.ts`)

**Purpose**: Automatically triggers quantity takeoffs when new model versions are uploaded.

**Supported Events**:
- `version.created`
- `version.updated`
- `model.uploaded`
- `translation.completed`

**Configuration**: Set up webhooks in your BIM 360/ACC project to point to:
```
https://your-domain.com/api/webhooks/model-upload
```

## API Endpoints

### Quantity Takeoff

**Start Takeoff**:
```http
POST /api/quantity-takeoff
Content-Type: application/json

{
  "modelUrn": "urn:adsk.objects:...",
  "projectId": "project_id",
  "versionId": "version_id",
  "force": true
}
```

**Get Takeoff Status**:
```http
GET /api/quantity-takeoff?modelUrn=...&projectId=...&versionId=...
```

### Embodied Carbon Calculation

**Calculate Carbon**:
```http
POST /api/embodied-carbon/calculate
Content-Type: application/json

{
  "takeoffResult": { ... },
  "projectId": "project_id",
  "optionId": "option_id",
  "buildingArea": 1000
}
```

## Data Extraction Process

### 1. Model Analysis
The system uses the Model Derivative API to:
- Get model metadata and viewables
- Extract object tree structure
- Retrieve element properties in bulk

### 2. Element Filtering
Elements are filtered to include only physical building components:
- Excludes cameras, lights, views, annotations
- Focuses on structural, architectural, and MEP elements
- Categorizes by system (structure, envelope, services, etc.)

### 3. Material Identification
Materials are identified through multiple methods:
- Direct material properties from elements
- Type-based material inference
- Category-based material assumptions
- Fallback to "Unknown Material" classification

### 4. Quantity Calculation
For each material, the system calculates:
- **Volume** (m³): For bulk materials like concrete, masonry
- **Area** (m²): For surface materials like cladding, finishes
- **Length** (m): For linear elements like beams, pipes
- **Count**: Number of individual elements

## Material Categories

The system recognizes these material types:

| Material Type | Example Elements | Typical Unit |
|---------------|------------------|--------------|
| Concrete | Slabs, walls, foundations | m³ |
| Steel | Beams, columns, reinforcement | kg |
| Timber | Structural members, cladding | m³ |
| Masonry | Brick/block walls | m³ |
| Glass | Windows, curtain walls | m² |
| Aluminum | Window frames, cladding | kg |
| Insulation | Wall/roof insulation | m³ |
| Gypsum | Drywall, plasterboard | m² |
| Ceramic | Tiles, fixtures | m² |

## Carbon Factor Database

The system includes a comprehensive carbon factor database:

```sql
-- Example carbon factors (kg CO2e per unit)
Concrete: 150 kg CO2e/m³
Steel: 2100 kg CO2e/kg  
Timber: 45 kg CO2e/m³
Aluminum: 8500 kg CO2e/kg
```

### Data Sources
- ICE Database (UK)
- EPD (Environmental Product Declarations)
- Regional databases (EU, North America, etc.)
- Industry standards (RICS, RIBA, etc.)

## Integration with UI

### React Component
The `QuantityTakeoffResults` component provides:
- One-click takeoff initiation
- Real-time progress tracking  
- Results visualization
- CSV export functionality

**Usage**:
```tsx
import QuantityTakeoffResults from '@/components/QuantityTakeoffResults';

<QuantityTakeoffResults
  modelUrn={model.urn}
  projectId={projectId}
  versionId={versionId}
  onTakeoffComplete={(result) => {
    // Handle completion
  }}
/>
```

## Database Schema

The system uses these main tables:

- `quantity_takeoffs`: Store takeoff results
- `material_quantities`: Individual material quantities
- `model_elements`: Detailed element data
- `carbon_factors`: Material carbon factors
- `embodied_carbon_calculations`: Final carbon results
- `model_processing_queue`: Processing status tracking

## Error Handling

The system includes comprehensive error handling:

### Common Issues
1. **Model Translation Errors**: Some models may have translation issues
2. **Property Access**: Not all properties may be accessible
3. **Material Identification**: Some materials may not be identified
4. **Carbon Factor Matching**: Fallback factors are used when exact matches aren't found

### Fallback Strategies
- Use category-based material inference
- Apply default carbon factors for unknown materials
- Provide detailed assumption logs
- Quality indicators for results

## Performance Optimization

### Bulk Processing
- Properties retrieved in bulk for efficiency
- Parallel processing of viewables
- Efficient memory management for large models

### Caching
- Results cached to avoid reprocessing
- Smart cache invalidation on model updates
- Optimized database queries

## Monitoring and Logging

The system provides detailed logging:
- Takeoff progress and performance metrics
- Material identification success rates
- Carbon calculation accuracy indicators
- Error tracking and resolution

### Log Examples
```
🔍 Starting quantity takeoff for model: urn:adsk.objects:...
📊 Model metadata retrieved: 1 viewables
🔨 Elements extracted: 2,847
📏 Material quantities calculated: 23 materials
✅ Quantity takeoff completed successfully
```

## Future Enhancements

### Planned Features
1. **Machine Learning**: Improve material identification accuracy
2. **Real-time Updates**: Live sync with model changes
3. **Advanced Analytics**: Trend analysis and benchmarking
4. **API Integrations**: Connect with LCA tools and databases
5. **Reporting**: Automated sustainability reports

### Extensibility
The system is designed to be easily extended:
- Plugin architecture for custom material identification
- Configurable carbon factor sources
- Custom calculation methodologies
- Integration with third-party tools

## Getting Started

1. **Set up Webhooks**: Configure BIM 360/ACC to send upload notifications
2. **Configure Access**: Ensure proper Autodesk APS credentials
3. **Database Setup**: Run the provided schema setup script
4. **Test Integration**: Upload a test model and verify takeoff
5. **Monitor Results**: Check logs and verify calculation accuracy

For detailed setup instructions, see the main project README.

## Support

For issues or questions:
- Check the error logs for detailed information
- Verify model translation status in Autodesk Viewer
- Ensure proper access permissions for the model
- Contact support with specific model URNs for debugging