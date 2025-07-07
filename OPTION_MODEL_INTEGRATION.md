# Option-Model Integration for Quantity Takeoffs

This document explains how the quantity takeoff system integrates with individual options and their linked models, ensuring that each option tracks its own model versions and quantity data.

## Integration Overview

The system now properly associates quantity takeoffs with specific project options, ensuring that:

1. **Each option maintains its own takeoff results** - linked to the specific model version
2. **Model version changes trigger new takeoffs** - automatically when models are updated
3. **Results are displayed in context** - within each option's page
4. **Data isolation** - each option's data remains separate and independent

## Architecture Changes

### Database Schema Updates

The quantity takeoff system now tracks:
- `project_id` - The project containing the option
- `option_id` - The specific option (A, B, C, etc.)
- `model_urn` - The specific model version URN
- `version_id` - The model version identifier

This ensures complete traceability of which takeoff belongs to which option and model version.

### API Endpoint Updates

**Quantity Takeoff API** (`/api/quantity-takeoff`):
```json
{
  "modelUrn": "urn:adsk.objects:...",
  "projectId": "project_123",
  "optionId": "A",
  "versionId": "version_456",
  "force": false
}
```

**Key Changes**:
- Added `optionId` as required parameter
- Takeoff results are now unique per option-model combination
- Version tracking ensures proper change detection

### Component Integration

**QuantityTakeoffResults Component**:
- Displays within each option's page
- Only appears when a model is linked to the option
- Automatically tracks the linked model's URN and version
- Provides option-specific CSV exports

**Usage in Option Page**:
```tsx
<QuantityTakeoffResults
  modelUrn={linkedModel.viewerUrn}
  projectId={projectId}
  optionId={optionId}
  versionId={linkedModel.versionId}
  onTakeoffComplete={(result) => {
    // Handle completion for this specific option
  }}
/>
```

## Model Version Tracking

### Automatic Detection

When a user links a new model to an option:

1. **Model URN Changes**: System detects new model URN
2. **Version ID Changes**: System detects new version of existing model
3. **Automatic Takeoff**: New takeoff is triggered automatically
4. **Result Update**: UI updates with new quantity data

### Version Comparison

The system can track:
- **Model History**: Previous versions and their takeoff results
- **Change Detection**: What changed between versions
- **Trend Analysis**: How quantities evolve over time

## Workflow Integration

### Option-Specific Workflow

1. **User selects Option A**
   - Navigate to `/projects/[projectId]/option-A`
   - Page loads with Option A's data and linked model

2. **Model Linking**
   - User clicks "Link Model" 
   - Selects model from BIM 360/ACC browser
   - Model gets linked to Option A specifically

3. **Automatic Takeoff**
   - System detects model link
   - Quantity takeoff component appears
   - User can start takeoff or system auto-starts

4. **Results Display**
   - Takeoff results appear in Option A's page
   - Data is specific to Option A's model
   - Charts and tables show Option A's quantities

5. **Model Updates**
   - If model version changes in BIM 360/ACC
   - Webhook triggers new takeoff for Option A
   - Results update automatically

### Multi-Option Comparison

Users can now:
- Compare quantity takeoffs between options
- See how different design options affect material quantities
- Track embodied carbon differences between options
- Export comparative data for analysis

## Data Storage Structure

### Database Tables

**quantity_takeoffs**:
```sql
id, model_urn, project_id, option_id, version_id, timestamp, total_elements, ...
```

**material_quantities**:
```sql
id, takeoff_id, material_name, material_type, element_category, volume, area, ...
```

**embodied_carbon_calculations**:
```sql
id, takeoff_id, project_id, option_id, total_carbon, calculation_date, ...
```

### Data Relationships

```
Project
├── Option A
│   ├── Linked Model (URN + Version)
│   ├── Quantity Takeoff Results
│   └── Embodied Carbon Calculation
├── Option B
│   ├── Linked Model (URN + Version)
│   ├── Quantity Takeoff Results
│   └── Embodied Carbon Calculation
└── Option C
    ├── Linked Model (URN + Version)
    ├── Quantity Takeoff Results
    └── Embodied Carbon Calculation
```

## Version Change Detection

### Webhook Integration

When BIM 360/ACC sends model update notifications:

1. **Parse Webhook**: Extract model URN and new version ID
2. **Find Linked Options**: Query which options use this model URN
3. **Trigger Takeoffs**: Start new takeoffs for affected options
4. **Update Results**: Replace old takeoff data with new results
5. **Notify Users**: Alert relevant stakeholders of changes

### Manual Refresh

Users can also manually trigger takeoffs:
- **Refresh Button**: Force new takeoff even if no version change
- **Model Re-linking**: Link different model version to option
- **Comparison Mode**: Run takeoff on multiple versions for comparison

## UI Integration Details

### Option Page Layout

```
┌─────────────────────────────────────────┐
│ 3D Model Viewer (Option A's Model)     │
│ [Link Model] [Model Status]            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Embodied Carbon Chart (Option A Data)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Quantity Takeoff Results (Option A)    │
│ [Start Takeoff] [Export CSV]           │
│ Total Elements: 2,847                  │
│ Materials: 23                          │
│ Volume: 1,234 m³                       │
│ ┌─ Material Quantities Table ─────────┐│
│ │ Concrete | 456 m³ | Slabs          ││
│ │ Steel    | 789 kg | Columns        ││
│ │ ...                                ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Data Table (Option A Legacy Data)      │
└─────────────────────────────────────────┘
```

### Cross-Option Navigation

Users can navigate between options and see different:
- Model viewers showing different models
- Quantity takeoff results for each option
- Comparative embodied carbon values
- Independent data sets

## Error Handling

### Model Link Failures

If model linking fails:
- Show clear error message
- Provide retry mechanism
- Log detailed error information
- Maintain previous model link if any

### Takeoff Failures

If quantity takeoff fails:
- Display error details to user
- Provide manual retry option
- Log error for debugging
- Don't break existing data

### Version Conflicts

If version conflicts occur:
- Show warning to user
- Provide option to force update
- Maintain audit trail
- Allow rollback if needed

## Performance Considerations

### Caching Strategy

- Cache takeoff results per option-model-version combination
- Invalidate cache when model version changes
- Provide manual cache refresh option
- Use efficient database indexing

### Parallel Processing

- Run takeoffs for multiple options in parallel
- Process large models efficiently
- Provide progress indicators
- Handle timeout scenarios gracefully

## Future Enhancements

### Planned Features

1. **Version Comparison View**: Side-by-side comparison of takeoff results between model versions
2. **Change Highlighting**: Visual indication of what changed between versions
3. **Automated Reporting**: Scheduled reports on quantity changes
4. **Integration APIs**: Connect with external quantity surveying tools
5. **Advanced Analytics**: ML-powered insights on quantity trends

### API Extensions

Future API endpoints might include:
- `/api/quantity-takeoff/compare` - Compare results between versions/options
- `/api/quantity-takeoff/history` - Get historical takeoff data
- `/api/quantity-takeoff/schedule` - Schedule automated takeoffs
- `/api/quantity-takeoff/export` - Advanced export options

This integration ensures that each project option maintains its own complete quantity takeoff workflow while enabling cross-option comparison and analysis.