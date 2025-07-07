# 🆓 Free API Migration Guide

This document outlines the complete migration from premium Model Derivative APIs to free AEC Data Model APIs, ensuring **zero usage charges**.

## 📊 Migration Summary

### ✅ **What Works Now (100% Free)**

1. **Model Browsing** - Browse BIM 360/ACC files using Data Management API
2. **Quantity Takeoff** - Extract quantities using AEC Data Model GraphQL API
3. **Project Management** - Manage projects and options using free APIs
4. **Webhooks** - Receive notifications (updated to use free APIs only)
5. **Limited 3D Viewing** - For models already processed through AEC Data Model

### 🚫 **What's Disabled (Premium APIs Blocked)**

1. **Model Translation** - `/api/autodesk/translate` returns 403 error
2. **Translation Status** - `/api/autodesk/translation-status` returns 403 error  
3. **Test Translation** - `/api/test-translation` returns 403 error
4. **3D Viewing** - Only works for pre-processed models

---

## 🔄 Component Replacements

### **Old → New Component Mapping**

| **Old Component (Premium)** | **New Component (Free)** | **Status** |
|------------------------------|---------------------------|------------|
| `ModelLinker.tsx` | `FreeModelLinker.tsx` | ✅ Created |
| `SimpleAutodeskViewer.tsx` | `FreeAECViewer.tsx` | ✅ Created |
| `QuantityTakeoffService` | `AECQuantityTakeoffService` | ✅ Created |
| `/api/autodesk/translate` | `/api/aec/designs` | ✅ Created |
| `/api/link-model` | `/api/aec/link-model` | ✅ Created |

---

## 🛠️ New Free Services

### **1. AEC Viewer Service** (`lib/aec-viewer-service.ts`)
- **Purpose**: Bridge AEC Data Model and Viewer SDK using only free APIs
- **Key Functions**:
  - `getViewableModel()` - Check if design is viewable without translation
  - `linkModelToOption()` - Link models using free APIs only
  - `getViewableDesigns()` - Get designs that can be viewed for free

### **2. AEC Quantity Takeoff Service** (`lib/aec-quantity-takeoff.ts`)  
- **Purpose**: Perform quantity takeoffs using only AEC Data Model GraphQL API
- **Key Functions**:
  - `performQuantityTakeoff()` - Extract quantities using free API
  - `performCarbonCalculation()` - Calculate embodied carbon using free API

### **3. Free Model Linker** (`components/FreeModelLinker.tsx`)
- **Purpose**: Link models without triggering translation
- **Features**:
  - Shows which models are viewable vs. need translation
  - Clear indication of free vs. premium requirements
  - Only allows linking of models that don't incur charges

### **4. Free AEC Viewer** (`components/FreeAECViewer.tsx`)
- **Purpose**: Display models using only free APIs
- **Fallback Strategy**:
  1. Try Autodesk Viewer SDK with existing URNs
  2. Fall back to alternative display methods
  3. Show informative message if translation would be required

---

## 🔌 API Endpoints

### **✅ Free API Endpoints**

| **Endpoint** | **Purpose** | **API Used** |
|--------------|-------------|--------------|
| `GET /api/aec/designs` | Get project designs | AEC Data Model GraphQL |
| `POST /api/aec/designs` | Check design viewability | AEC Data Model REST |
| `POST /api/aec/link-model` | Link model to option | AEC Data Model only |
| `GET /api/aec/link-model` | Get linked model | Database + AEC Data Model |
| `POST /api/quantity-takeoff` | Perform quantity takeoff | AEC Data Model GraphQL |

### **🚫 Disabled Premium Endpoints**

| **Endpoint** | **Status** | **Replacement** |
|--------------|------------|-----------------|
| `POST /api/autodesk/translate` | **BLOCKED (403)** | `/api/aec/designs` |
| `GET /api/autodesk/translate` | **BLOCKED (403)** | `/api/aec/designs` |
| `GET /api/autodesk/translation-status` | **BLOCKED (403)** | `/api/aec/designs` |
| `GET /api/test-translation` | **BLOCKED (403)** | N/A (testing disabled) |

---

## 🎯 How Applications Now Work

### **1. Model Browsing Workflow**
```
User selects project → Browse files via Data Management API (FREE) 
→ Check designs via AEC Data Model API (FREE) 
→ Show viewability status → Link if viewable
```

### **2. 3D Viewing Workflow**  
```
Check if design has viewable URN → If yes: Use Viewer SDK (FREE)
→ If no: Show alternative display with explanation
```

### **3. Quantity Takeoff Workflow**
```
Select design → Use AEC Data Model GraphQL (FREE) 
→ Extract quantities and materials → Calculate embodied carbon (FREE)
```

### **4. Webhook Processing Workflow**
```
Model uploaded → Webhook triggered (FREE) 
→ Call AEC quantity takeoff API (FREE) → Process results (FREE)
```

---

## ⚠️ **Limitations in Free Mode**

### **What Doesn't Work**
1. **New Model Translation** - Cannot convert new files to viewable format
2. **Some 3D Viewing** - Only models already processed through AEC Data Model are viewable
3. **Real-time Translation Status** - Cannot check Model Derivative processing status

### **What Users See**
- **Clear messaging** about free vs. premium features
- **Alternative workflows** for non-viewable models  
- **Graceful fallbacks** when 3D viewing isn't available
- **Emphasis on free features** that still provide value

---

## 🔧 Migration Checklist

### **Completed ✅**
- [x] Created free AEC Data Model services
- [x] Built free quantity takeoff service  
- [x] Created free model linking component
- [x] Built free AEC viewer component
- [x] Created free API endpoints
- [x] Disabled premium API endpoints
- [x] Updated webhook to use free APIs
- [x] Added clear free/premium messaging

### **To Be Done** (Optional)
- [ ] Update frontend routing to use new components
- [ ] Create migration guide for existing data
- [ ] Add database schema for storing free API results
- [ ] Create admin panel to monitor API usage
- [ ] Add analytics to track free vs. premium feature usage

---

## 💡 **For Developers**

### **Using Free Components**
```tsx
// OLD (Premium)
import ModelLinker from '@/components/ModelLinker';
<ModelLinker projectId={id} optionId={optionId} />

// NEW (Free) 
import FreeModelLinker from '@/components/FreeModelLinker';
<FreeModelLinker projectId={id} optionId={optionId} />
```

### **Using Free Viewer**
```tsx
// OLD (Premium)
import SimpleAutodeskViewer from '@/components/SimpleAutodeskViewer';
<SimpleAutodeskViewer urn={translatedUrn} accessToken={token} />

// NEW (Free)
import FreeAECViewer from '@/components/FreeAECViewer';
<FreeAECViewer designId={designId} projectId={projectId} accessToken={token} />
```

### **Using Free APIs**
```typescript
// OLD (Premium)
const response = await fetch('/api/autodesk/translate', { ... });

// NEW (Free)
const response = await fetch('/api/aec/designs', { ... });
```

---

## 🎉 **Result: 100% Free Operation**

✅ **Zero usage charges** for all implemented features  
✅ **Predictable costs** - only need Autodesk Developer account  
✅ **Better performance** - GraphQL is more efficient than REST pagination  
✅ **Future-proof** - Built on Autodesk's recommended AEC Data Model patterns  
✅ **Scalable** - No cost constraints on usage volume  

The application now operates entirely on **free Autodesk APIs** while maintaining core functionality for model browsing, quantity takeoff, and carbon calculations.