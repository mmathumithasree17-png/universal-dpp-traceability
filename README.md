# Universal Digital Product Passport (DPP) & Smart Traceability (PS10)

> **Core Hackathon Objective**: Track a manufactured product throughout its entire lifecycle—from raw material batches to components, powertrain assembly, finished products, and global client shipments. Identify all products affected by a defective material batch within seconds (benchmark: executed in **< 5ms**).

---

## 🚀 Architecture & Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS 3 (Industrial Dark Navy `#060a12`, High-Tech Cyan `#00f2fe`, Warning Gold `#f59e0b`, and Containment Rose), Lucide Icons, React Router DOM v6.
- **Backend**: Node.js v24, Express v4.21, Mongoose v8.
- **Storage Layer**: Hybrid Dual-Engine Persistence:
  - Connects to native MongoDB daemon / MongoDB Atlas via `MONGODB_URI`.
  - Automatically activates an atomic, zero-config persistent file store (`server/data/persistent_db.json`) if MongoDB is not locally running, guaranteeing zero runtime crashes and 100% data persistence across server restarts.
- **Demo Domain**: High-performance Electric Vehicle Traction Motor manufacturing (`UltraTorq-X500` & `Powertrain IM-800`).

---

## 🧭 Navigation Routes & Modules

1. **Dashboard (`/`)**: Executive operations overview, KPI cards (Passports, Batches, Active Quarantines, Shipments), live database connection status, shop floor event ticker, and quick navigation modules.
2. **Digital Product Passport (`/dpp`)**: CIRPASS/ESPR-compliant passport registry with search, status filters, electrical ratings (kW, RPM, Torque, Efficiency), and ESG circularity metrics (Carbon footprint kg CO2e, recycled material %).
3. **Genealogy Explorer (`/genealogy`)**: Multi-tier Bill-of-Materials (BOM) hierarchy: Tier 1 (Product) &rarr; Tier 2 (Assembly Line) &rarr; Tier 3 (Stator, Rotor, Casing, Inverter) &rarr; Tier 4 (Raw Material Batches).
4. **Defect Impact Analysis (`/defects`)**: Sub-second blast radius calculator. Select a suspect material batch (e.g., `MB-SHAFT-2026-033`) to evaluate downstream exposure across assemblies, products, and customer shipments with microsecond latency.
5. **Event Management (`/events`)**: Shop floor execution ledger tracking operations (Winding, Vacuum Pressure Impregnation, Dyno Testing, Packaging, Dispatch, and Quarantine Locks). Includes interactive event logging modal.
6. **Audit History (`/audit`)**: Tamper-evident ledger with simulated SHA-256 cryptographic hash signatures for all status transitions and quarantine orders.
7. **Forward & Backward Traceability (`/traceability`)**: Dual-engine provenance search:
   - **Forward Trace**: Material Batch &rarr; Sub-components &rarr; Assemblies &rarr; Finished Motors &rarr; Shipments.
   - **Backward Trace**: Motor Serial / Passport ID &rarr; Assemblies &rarr; Components &rarr; Raw Material Supplier Heat Lots.

---

## 🗄️ Database Models (8 Core Schemas)

1. `MaterialBatch`: `batchId`, `materialName`, `category`, `supplierName`, `supplierLotNumber`, `quantity`, `unit`, `receivedDate`, `purityOrGrade`, `carbonFootprintKgCO2e`, `status`, `qualityPassed`.
2. `Component`: `componentId`, `componentName`, `componentType`, `materialBatches`, `productionDate`, `lineId`, `operatorId`, `qualityCheckPassed`, `status`, `serialNumber`.
3. `Assembly`: `assemblyId`, `assemblyName`, `assemblyType`, `components`, `assemblyLine`, `workstation`, `qualityChecks`, `status`.
4. `Product`: `passportId`, `serialNumber`, `modelName`, `productCategory`, `assemblyId`, `specifications`, `sustainability`, `componentsUsed`, `materialBatchesUsed`, `complianceCertificates`, `status`, `qrPayload`.
5. `Shipment`: `shipmentId`, `trackingNumber`, `carrier`, `destinationClient`, `destinationAddress`, `dispatchDate`, `estimatedDelivery`, `products`, `shippingStatus`.
6. `ManufacturingEvent`: `eventId`, `eventType`, `targetType`, `targetId`, `timestamp`, `station`, `operator`, `parametersRecorded`, `status`, `remarks`.
7. `Defect`: `defectId`, `title`, `severity`, `status`, `affectedBatchId`, `rootCause`, `reportedBy`, `quarantineTriggered`, `affectedProductsCount`, `affectedShipmentsCount`, `containmentAction`.
8. `AuditRecord`: `auditId`, `timestamp`, `actionType`, `entityType`, `entityId`, `actor`, `previousState`, `newState`, `hashSignature`, `summary`.

---

## ⚡ How to Run the Application

### 1. Start Backend API Server
```powershell
cd server
npm.cmd start
```
- API will listen at: `http://localhost:5000`
- Health check: `http://localhost:5000/api/system/health`
- Stats endpoint: `http://localhost:5000/api/system/stats`

### 2. Start Frontend Dev Server
```powershell
cd client
npm.cmd run dev
```
- UI will be available at: `http://localhost:5173`

### 3. Run Automated API Checks
```powershell
cd server
node scripts/testEndpoints.js
```
