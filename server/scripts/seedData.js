const crypto = require('crypto');

function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data) + Date.now()).digest('hex');
}

const seedMaterialBatches = [
  {
    batchId: 'MB-COPPER-2026-088',
    materialName: 'Oxygen-Free High-Conductivity Copper Wire (Grade C10200)',
    category: 'Conductor',
    supplierName: 'Apex Metallurgy Corp',
    supplierLotNumber: 'LOT-APX-8821',
    quantity: 1250,
    unit: 'kg',
    receivedDate: new Date('2026-09-10T08:30:00Z'),
    purityOrGrade: '99.99% Cu (Conductivity 101% IACS)',
    certificateOfAnalysis: 'COA-APX-2026-993',
    carbonFootprintKgCO2e: 142.5,
    status: 'ACTIVE',
    qualityPassed: true,
    notes: 'Primary conductor wire for stator hairpin winding operations.'
  },
  {
    batchId: 'MB-MAGNET-2026-014',
    materialName: 'Sintered Neodymium-Iron-Boron Magnets (Grade N52SH)',
    category: 'RareEarthMagnet',
    supplierName: 'RareEarth Dynamics Ltd',
    supplierLotNumber: 'RED-N52SH-4091',
    quantity: 450,
    unit: 'kg',
    receivedDate: new Date('2026-09-12T10:15:00Z'),
    purityOrGrade: 'Br 1.45T, Hcj > 20 kOe, Max Temp 150°C',
    certificateOfAnalysis: 'COA-RED-2026-552',
    carbonFootprintKgCO2e: 310.8,
    status: 'ACTIVE',
    qualityPassed: true,
    notes: 'High remanence rotor permanent magnets with dysprosium heavy grain boundary diffusion.'
  },
  {
    batchId: 'MB-SILICON-2026-052',
    materialName: 'Non-Oriented Silicon Steel Sheet (Grade B27AV1400)',
    category: 'SiliconSteel',
    supplierName: 'Nippon Precision Steel Co.',
    supplierLotNumber: 'NPS-SIL-9022',
    quantity: 3800,
    unit: 'kg',
    receivedDate: new Date('2026-09-15T14:00:00Z'),
    purityOrGrade: 'Thickness 0.25mm, Core Loss <14.0 W/kg at 1.5T 400Hz',
    certificateOfAnalysis: 'COA-NPS-2026-104',
    carbonFootprintKgCO2e: 215.0,
    status: 'ACTIVE',
    qualityPassed: true,
    notes: 'Ultra-thin stator and rotor magnetic lamination stacks for low eddy-current loss.'
  },
  {
    batchId: 'MB-SHAFT-2026-033',
    materialName: '42CrMo4 Forged High-Strength Alloy Steel Shaft Stock',
    category: 'AlloySteel',
    supplierName: 'Vanguard Forgings Europe',
    supplierLotNumber: 'VFE-42CR-7719',
    quantity: 800,
    unit: 'kg',
    receivedDate: new Date('2026-09-18T09:00:00Z'),
    purityOrGrade: 'Yield Strength 900 MPa, Tensile 1100 MPa',
    certificateOfAnalysis: 'COA-VFE-2026-339',
    carbonFootprintKgCO2e: 180.2,
    status: 'DEFECTIVE',
    qualityPassed: false,
    defectId: 'DEF-2026-003',
    quarantinedAt: new Date('2026-10-20T11:45:00Z'),
    notes: 'CRITICAL ALERT: Ultrasonic and eddy-current scans detected internal micro-porosity.'
  },
  {
    batchId: 'B-204',
    materialName: '42CrMo4 Specialized High-Torque Rotor Shaft Alloy',
    category: 'AlloySteel',
    supplierName: 'Vanguard Metallurgical Europe',
    supplierLotNumber: 'LOT-B204-FORGING',
    quantity: 1500,
    unit: 'kg',
    receivedDate: new Date('2026-09-18T09:00:00Z'),
    purityOrGrade: 'Grade 42CrMo4+QT, Yield 920 MPa',
    certificateOfAnalysis: 'COA-VFE-B204-991',
    carbonFootprintKgCO2e: 182.4,
    status: 'ACTIVE',
    qualityPassed: true,
    notes: 'Forged rotor shaft bar stock for HyperDrive EV-600 extreme traction motor lines.'
  }
];

const seedComponents = [
  {
    componentId: 'CMP-STATOR-104',
    componentName: 'Hairpin High-Torque Stator Sub-Assembly',
    componentType: 'Stator',
    materialBatches: [
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free Copper Wire', quantityUsed: 14.2, unit: 'kg' },
      { batchId: 'MB-SILICON-2026-052', materialName: 'Silicon Steel Sheet', quantityUsed: 26.5, unit: 'kg' }
    ],
    productionDate: new Date('2026-09-22T08:00:00Z'),
    lineId: 'LINE-WINDING-01',
    operatorId: 'OP-ROBOTIC-01',
    qualityCheckPassed: true,
    status: 'ASSEMBLED',
    serialNumber: 'SN-STAT-2026-0104',
    notes: 'Automated 8-layer hairpin winding passed hi-pot 3.5kV dielectric insulation test.'
  },
  {
    componentId: 'CMP-STATOR-105',
    componentName: 'Hairpin High-Torque Stator Sub-Assembly (B2)',
    componentType: 'Stator',
    materialBatches: [
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free Copper Wire', quantityUsed: 14.2, unit: 'kg' },
      { batchId: 'MB-SILICON-2026-052', materialName: 'Silicon Steel Sheet', quantityUsed: 26.5, unit: 'kg' }
    ],
    productionDate: new Date('2026-09-23T11:30:00Z'),
    lineId: 'LINE-WINDING-01',
    operatorId: 'OP-ROBOTIC-01',
    qualityCheckPassed: true,
    status: 'ASSEMBLED',
    serialNumber: 'SN-STAT-2026-0105',
    notes: 'Second batch stator for EV-500 line.'
  },
  {
    componentId: 'CMP-ROTOR-201',
    componentName: 'IPM V-Shape Rotor Core with Shaft',
    componentType: 'Rotor',
    materialBatches: [
      { batchId: 'MB-MAGNET-2026-014', materialName: 'Neodymium Magnets (N52SH)', quantityUsed: 5.6, unit: 'kg' },
      { batchId: 'MB-SHAFT-2026-033', materialName: '42CrMo4 Shaft Alloy (DEFECTIVE BATCH)', quantityUsed: 8.8, unit: 'kg' }
    ],
    productionDate: new Date('2026-09-24T13:45:00Z'),
    lineId: 'LINE-ROTOR-02',
    operatorId: 'OP-ROBOTIC-04',
    qualityCheckPassed: false,
    status: 'QUARANTINED',
    serialNumber: 'SN-ROTR-2026-0201',
    notes: 'FLAGGED: Contains shaft stock from defective material batch MB-SHAFT-2026-033.'
  },
  {
    componentId: 'CMP-ROTOR-202',
    componentName: 'IPM V-Shape Rotor Core with Certified Shaft',
    componentType: 'Rotor',
    materialBatches: [
      { batchId: 'MB-MAGNET-2026-014', materialName: 'Neodymium Magnets (N52SH)', quantityUsed: 5.6, unit: 'kg' }
    ],
    productionDate: new Date('2026-09-25T15:00:00Z'),
    lineId: 'LINE-ROTOR-02',
    operatorId: 'OP-ROBOTIC-04',
    qualityCheckPassed: true,
    status: 'ASSEMBLED',
    serialNumber: 'SN-ROTR-2026-0202',
    notes: 'Balanced to G1.0 quality grade at 20,000 RPM.'
  },
  {
    componentId: 'CMP-HOUSING-301',
    componentName: 'Liquid-Cooled Aluminum Stator Casing',
    componentType: 'Housing',
    materialBatches: [],
    productionDate: new Date('2026-09-20T10:00:00Z'),
    lineId: 'LINE-CASTING-03',
    operatorId: 'OP-CNC-88',
    qualityCheckPassed: true,
    status: 'ASSEMBLED',
    serialNumber: 'SN-HSG-2026-0301',
    notes: 'CNC machined with integrated helical cooling channels, pressure tested to 4.5 bar.'
  },
  {
    componentId: 'CMP-INVERTER-401',
    componentName: '800V Silicon Carbide (SiC) Power Inverter',
    componentType: 'InverterModule',
    materialBatches: [],
    productionDate: new Date('2026-09-21T09:30:00Z'),
    lineId: 'LINE-SMT-CLEANROOM',
    operatorId: 'OP-CLEAN-12',
    qualityCheckPassed: true,
    status: 'ASSEMBLED',
    serialNumber: 'SN-INV-2026-0401',
    notes: 'High-frequency SiC MOSFET module with integrated gate driver and CAN FD bus.'
  },
  {
    componentId: 'CMP-ROTOR-B204-1',
    componentName: 'Precision Balanced High-Torque Rotor Core',
    componentType: 'Rotor',
    materialBatches: [
      { batchId: 'B-204', materialName: '42CrMo4 Specialized High-Torque Rotor Shaft Alloy', quantityUsed: 18.5, unit: 'kg' },
      { batchId: 'MB-MAGNET-2026-014', materialName: 'Sintered Neodymium-Iron-Boron Magnets', quantityUsed: 4.8, unit: 'kg' }
    ],
    productionDate: new Date('2026-09-24T10:00:00Z'),
    lineId: 'LINE-ROTOR-02',
    operatorId: 'OP-MARCUS-VANCE',
    qualityCheckPassed: true,
    status: 'ASSEMBLED',
    serialNumber: 'SN-ROTOR-B204-01',
    notes: 'Dynamic balancing G1.0 at 22,000 RPM cleared.'
  },
  {
    componentId: 'CMP-ROTOR-B204-2',
    componentName: 'Ultra-High-Speed Intermediate Shaft Assembly',
    componentType: 'Rotor',
    materialBatches: [
      { batchId: 'B-204', materialName: '42CrMo4 Specialized High-Torque Rotor Shaft Alloy', quantityUsed: 12.0, unit: 'kg' }
    ],
    productionDate: new Date('2026-09-24T14:30:00Z'),
    lineId: 'LINE-ROTOR-02',
    operatorId: 'OP-MARCUS-VANCE',
    qualityCheckPassed: true,
    status: 'ASSEMBLED',
    serialNumber: 'SN-ROTOR-B204-02',
    notes: 'Secondary balanced shaft for dual-motor variant.'
  }
];

const seedAssemblies = [
  {
    assemblyId: 'ASM-2026-0041',
    assemblyName: 'UltraTorq EV-500 Final Traction Powertrain Assembly Unit 1',
    assemblyType: 'EV Traction Powertrain',
    components: [
      { componentId: 'CMP-STATOR-104', componentName: 'Hairpin High-Torque Stator Sub-Assembly', componentType: 'Stator' },
      { componentId: 'CMP-ROTOR-202', componentName: 'IPM V-Shape Rotor Core with Certified Shaft', componentType: 'Rotor' },
      { componentId: 'CMP-HOUSING-301', componentName: 'Liquid-Cooled Aluminum Stator Casing', componentType: 'Housing' },
      { componentId: 'CMP-INVERTER-401', componentName: '800V Silicon Carbide Inverter', componentType: 'InverterModule' }
    ],
    assemblyLine: 'CELL-AUTOMATED-A3',
    workstation: 'WS-TORQUE-ROBOTIC',
    assembledAt: new Date('2026-09-28T14:30:00Z'),
    operator: 'Lead: Elena Rostova / Station Auto-Robot R7',
    qualityChecks: {
      torqueCheckNm: 125.4,
      insulationResistanceMOhm: 980,
      dynamicBalanceGmm: 0.42,
      passedAll: true
    },
    status: 'PASSED',
    notes: 'Full dynamometer test pass at 350kW continuous rating.'
  },
  {
    assemblyId: 'ASM-2026-0042',
    assemblyName: 'UltraTorq EV-500 Powertrain Assembly Unit 2',
    assemblyType: 'EV Traction Powertrain',
    components: [
      { componentId: 'CMP-STATOR-105', componentName: 'Hairpin High-Torque Stator Sub-Assembly (B2)', componentType: 'Stator' },
      { componentId: 'CMP-ROTOR-202', componentName: 'IPM V-Shape Rotor Core with Certified Shaft', componentType: 'Rotor' },
      { componentId: 'CMP-HOUSING-301', componentName: 'Liquid-Cooled Aluminum Stator Casing', componentType: 'Housing' }
    ],
    assemblyLine: 'CELL-AUTOMATED-A3',
    workstation: 'WS-TORQUE-ROBOTIC',
    assembledAt: new Date('2026-09-29T10:15:00Z'),
    operator: 'Lead: Marcus Vance / Station Auto-Robot R7',
    qualityChecks: {
      torqueCheckNm: 124.9,
      insulationResistanceMOhm: 1020,
      dynamicBalanceGmm: 0.38,
      passedAll: true
    },
    status: 'PASSED',
    notes: 'Passed end-of-line verification.'
  },
  {
    assemblyId: 'ASM-2026-0043',
    assemblyName: 'UltraTorq EV-500 Powertrain Assembly Unit 3 (QUARANTINED)',
    assemblyType: 'EV Traction Powertrain',
    components: [
      { componentId: 'CMP-STATOR-105', componentName: 'Hairpin High-Torque Stator Sub-Assembly (B2)', componentType: 'Stator' },
      { componentId: 'CMP-ROTOR-201', componentName: 'IPM V-Shape Rotor Core with Shaft (DEFECTIVE)', componentType: 'Rotor' },
      { componentId: 'CMP-HOUSING-301', componentName: 'Liquid-Cooled Aluminum Stator Casing', componentType: 'Housing' }
    ],
    assemblyLine: 'CELL-AUTOMATED-A3',
    workstation: 'WS-TORQUE-ROBOTIC',
    assembledAt: new Date('2026-09-30T16:00:00Z'),
    operator: 'Lead: Marcus Vance / Station Auto-Robot R7',
    qualityChecks: {
      torqueCheckNm: 122.0,
      insulationResistanceMOhm: 850,
      dynamicBalanceGmm: 1.85,
      passedAll: false
    },
    status: 'QUARANTINED',
    notes: 'QUARANTINED: Contains defective rotor shaft from batch MB-SHAFT-2026-033.'
  },
  {
    assemblyId: 'ASM-EV600-B204',
    assemblyName: 'HyperDrive GT600 450kW Dual-Motor Powertrain Subassembly',
    assemblyType: 'EV Traction Powertrain',
    components: [
      { componentId: 'CMP-ROTOR-B204-1', componentName: 'Precision Balanced High-Torque Rotor Core', componentType: 'Rotor' },
      { componentId: 'CMP-ROTOR-B204-2', componentName: 'Ultra-High-Speed Intermediate Shaft Assembly', componentType: 'Rotor' },
      { componentId: 'CMP-STATOR-104', componentName: 'Hairpin High-Torque Stator Sub-Assembly', componentType: 'Stator' }
    ],
    assemblyLine: 'LINE-POWERTRAIN-GT',
    workstation: 'WS-GT-01',
    assembledAt: new Date('2026-09-26T16:00:00Z'),
    operator: 'Lead Specialist: Tyler Brooks',
    qualityChecks: {
      torqueCheckNm: 540,
      insulationResistanceMOhm: 1250,
      dynamicBalanceGmm: 0.12,
      passedAll: true
    },
    status: 'PASSED',
    notes: 'GT600 Powertrain passed dyno calibration and 800V breakdown tests.'
  }
];

const seedProducts = [
  {
    passportId: 'DPP-EV500-2026-001',
    serialNumber: 'SN-MOT-2026-8801',
    modelName: 'UltraTorq-X500 High-Efficiency EV Traction Motor',
    productCategory: 'EV Powertrain / High-Performance Traction Motor',
    assemblyId: 'ASM-2026-0041',
    facilityLocation: 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
    manufacturedDate: new Date('2026-09-28T16:45:00Z'),
    specifications: {
      ratedPowerKw: 350,
      maxRpm: 20000,
      peakTorqueNm: 520,
      efficiencyRating: 'IE5 Ultra-Premium (97.4% Peak)',
      nominalVoltageV: 800,
      coolingMethod: 'Direct Stator Slot Oil-Cooled & Internal Rotor Glycol',
      totalWeightKg: 48.5
    },
    sustainability: {
      totalCarbonFootprintKgCO2e: 185.4,
      recycledMaterialPercentage: 36.5,
      recyclabilityRatePercentage: 97.2,
      euBatteryDppCompliant: true,
      circularityIndex: 0.91,
      repairabilityScore: 'Class A (Fast Disassembly modular stators)'
    },
    componentsUsed: [
      { componentId: 'CMP-STATOR-104', componentName: 'Hairpin High-Torque Stator Sub-Assembly', componentType: 'Stator', serialNumber: 'SN-STAT-2026-0104' },
      { componentId: 'CMP-ROTOR-202', componentName: 'IPM V-Shape Rotor Core with Certified Shaft', componentType: 'Rotor', serialNumber: 'SN-ROTR-2026-0202' },
      { componentId: 'CMP-HOUSING-301', componentName: 'Liquid-Cooled Aluminum Stator Casing', componentType: 'Housing', serialNumber: 'SN-HSG-2026-0301' },
      { componentId: 'CMP-INVERTER-401', componentName: '800V Silicon Carbide Inverter', componentType: 'InverterModule', serialNumber: 'SN-INV-2026-0401' }
    ],
    materialBatchesUsed: [
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free High-Conductivity Copper Wire', category: 'Conductor', supplierName: 'Apex Metallurgy Corp' },
      { batchId: 'MB-MAGNET-2026-014', materialName: 'Sintered NdFeB Magnets', category: 'RareEarthMagnet', supplierName: 'RareEarth Dynamics Ltd' },
      { batchId: 'MB-SILICON-2026-052', materialName: 'Non-Oriented Silicon Steel Sheet', category: 'SiliconSteel', supplierName: 'Nippon Precision Steel Co.' }
    ],
    complianceCertificates: ['ISO 9001:2015', 'IATF 16949:2016', 'ISO 14001:2015', 'EU DPP Regulation 2024/1781', 'CE Mark (EN 60034-1)', 'RoHS-3 / REACH'],
    status: 'SHIPPED',
    quarantineReason: null,
    shipmentId: 'SHP-2026-0412',
    qrPayload: JSON.stringify({
      passportId: 'DPP-EV500-2026-001',
      serialNumber: 'SN-MOT-2026-8801',
      model: 'UltraTorq-X500',
      manufacturer: 'AeroDrive Powertrains Inc',
      verified: true,
      verifyUrl: 'https://dpp.aerodrive.com/verify/DPP-EV500-2026-001'
    })
  },
  {
    passportId: 'DPP-EV500-2026-002',
    serialNumber: 'SN-MOT-2026-8802',
    modelName: 'UltraTorq-X500 High-Efficiency EV Traction Motor',
    productCategory: 'EV Powertrain / High-Performance Traction Motor',
    assemblyId: 'ASM-2026-0042',
    facilityLocation: 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
    manufacturedDate: new Date('2026-09-29T14:20:00Z'),
    specifications: {
      ratedPowerKw: 350,
      maxRpm: 20000,
      peakTorqueNm: 520,
      efficiencyRating: 'IE5 Ultra-Premium (97.3% Peak)',
      nominalVoltageV: 800,
      coolingMethod: 'Direct Stator Slot Oil-Cooled & Internal Rotor Glycol',
      totalWeightKg: 48.6
    },
    sustainability: {
      totalCarbonFootprintKgCO2e: 187.1,
      recycledMaterialPercentage: 35.8,
      recyclabilityRatePercentage: 97.0,
      euBatteryDppCompliant: true,
      circularityIndex: 0.90,
      repairabilityScore: 'Class A'
    },
    componentsUsed: [
      { componentId: 'CMP-STATOR-105', componentName: 'Hairpin High-Torque Stator Sub-Assembly (B2)', componentType: 'Stator', serialNumber: 'SN-STAT-2026-0105' },
      { componentId: 'CMP-ROTOR-202', componentName: 'IPM V-Shape Rotor Core with Certified Shaft', componentType: 'Rotor', serialNumber: 'SN-ROTR-2026-0202' },
      { componentId: 'CMP-HOUSING-301', componentName: 'Liquid-Cooled Aluminum Stator Casing', componentType: 'Housing', serialNumber: 'SN-HSG-2026-0301' }
    ],
    materialBatchesUsed: [
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free High-Conductivity Copper Wire', category: 'Conductor', supplierName: 'Apex Metallurgy Corp' },
      { batchId: 'MB-MAGNET-2026-014', materialName: 'Sintered NdFeB Magnets', category: 'RareEarthMagnet', supplierName: 'RareEarth Dynamics Ltd' },
      { batchId: 'MB-SILICON-2026-052', materialName: 'Non-Oriented Silicon Steel Sheet', category: 'SiliconSteel', supplierName: 'Nippon Precision Steel Co.' }
    ],
    complianceCertificates: ['ISO 9001:2015', 'IATF 16949:2016', 'EU DPP Regulation 2024/1781', 'CE Mark (EN 60034-1)'],
    status: 'SHIPPED',
    quarantineReason: null,
    shipmentId: 'SHP-2026-0415',
    qrPayload: JSON.stringify({
      passportId: 'DPP-EV500-2026-002',
      serialNumber: 'SN-MOT-2026-8802',
      model: 'UltraTorq-X500',
      manufacturer: 'AeroDrive Powertrains Inc',
      verified: true,
      verifyUrl: 'https://dpp.aerodrive.com/verify/DPP-EV500-2026-002'
    })
  },
  {
    passportId: 'DPP-EV500-2026-003',
    serialNumber: 'SN-MOT-2026-8803',
    modelName: 'UltraTorq-X500 High-Efficiency EV Traction Motor (AFFECTED)',
    productCategory: 'EV Powertrain / High-Performance Traction Motor',
    assemblyId: 'ASM-2026-0043',
    facilityLocation: 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
    manufacturedDate: new Date('2026-09-30T17:30:00Z'),
    specifications: {
      ratedPowerKw: 350,
      maxRpm: 20000,
      peakTorqueNm: 520,
      efficiencyRating: 'IE5 Ultra-Premium',
      nominalVoltageV: 800,
      coolingMethod: 'Direct Stator Slot Oil-Cooled & Internal Rotor Glycol',
      totalWeightKg: 49.0
    },
    sustainability: {
      totalCarbonFootprintKgCO2e: 191.0,
      recycledMaterialPercentage: 34.0,
      recyclabilityRatePercentage: 96.0,
      euBatteryDppCompliant: true,
      circularityIndex: 0.85,
      repairabilityScore: 'Class A'
    },
    componentsUsed: [
      { componentId: 'CMP-STATOR-105', componentName: 'Hairpin High-Torque Stator Sub-Assembly (B2)', componentType: 'Stator', serialNumber: 'SN-STAT-2026-0105' },
      { componentId: 'CMP-ROTOR-201', componentName: 'IPM V-Shape Rotor Core with Shaft (DEFECTIVE)', componentType: 'Rotor', serialNumber: 'SN-ROTR-2026-0201' },
      { componentId: 'CMP-HOUSING-301', componentName: 'Liquid-Cooled Aluminum Stator Casing', componentType: 'Housing', serialNumber: 'SN-HSG-2026-0301' }
    ],
    materialBatchesUsed: [
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free High-Conductivity Copper Wire', category: 'Conductor', supplierName: 'Apex Metallurgy Corp' },
      { batchId: 'MB-MAGNET-2026-014', materialName: 'Sintered NdFeB Magnets', category: 'RareEarthMagnet', supplierName: 'RareEarth Dynamics Ltd' },
      { batchId: 'MB-SHAFT-2026-033', materialName: '42CrMo4 Shaft Alloy (DEFECTIVE)', category: 'AlloySteel', supplierName: 'Vanguard Forgings Europe' }
    ],
    complianceCertificates: ['ISO 9001:2015', 'IATF 16949:2016'],
    status: 'QUARANTINED',
    quarantineReason: 'AUTOMATED DEFECT CONTAINMENT: Linked to defective rotor shaft batch MB-SHAFT-2026-033 with internal micro-voids.',
    shipmentId: null,
    qrPayload: JSON.stringify({
      passportId: 'DPP-EV500-2026-003',
      serialNumber: 'SN-MOT-2026-8803',
      model: 'UltraTorq-X500',
      status: 'QUARANTINED',
      warning: 'DO NOT INSTALL - QUALITY HOLD'
    })
  },
  {
    passportId: 'DPP-IM800-2026-001',
    serialNumber: 'SN-IND-2026-4401',
    modelName: 'Powertrain Industrial Motor IM-800 Heavy-Duty',
    productCategory: 'Industrial Automation & Rail Traction',
    assemblyId: 'ASM-2026-0041',
    facilityLocation: 'Industrial Propulsion Plant 2 - Cleveland, OH',
    manufacturedDate: new Date('2026-10-02T11:00:00Z'),
    specifications: {
      ratedPowerKw: 800,
      maxRpm: 8500,
      peakTorqueNm: 2200,
      efficiencyRating: 'IE5 Ultra-Premium (98.1% Peak)',
      nominalVoltageV: 1200,
      coolingMethod: 'Forced Air Ducted & Stator Jacket Glycol',
      totalWeightKg: 142.0
    },
    sustainability: {
      totalCarbonFootprintKgCO2e: 420.5,
      recycledMaterialPercentage: 42.0,
      recyclabilityRatePercentage: 98.4,
      euBatteryDppCompliant: true,
      circularityIndex: 0.94,
      repairabilityScore: 'Class A+'
    },
    componentsUsed: [
      { componentId: 'CMP-STATOR-104', componentName: 'Hairpin High-Torque Stator Sub-Assembly', componentType: 'Stator', serialNumber: 'SN-STAT-2026-0104' },
      { componentId: 'CMP-HOUSING-301', componentName: 'Liquid-Cooled Aluminum Stator Casing', componentType: 'Housing', serialNumber: 'SN-HSG-2026-0301' }
    ],
    materialBatchesUsed: [
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free High-Conductivity Copper Wire', category: 'Conductor', supplierName: 'Apex Metallurgy Corp' },
      { batchId: 'MB-SILICON-2026-052', materialName: 'Non-Oriented Silicon Steel Sheet', category: 'SiliconSteel', supplierName: 'Nippon Precision Steel Co.' }
    ],
    complianceCertificates: ['ISO 9001:2015', 'IEC 60034-30-2', 'CE Mark', 'UL 1004'],
    status: 'SHIPPED',
    quarantineReason: null,
    shipmentId: 'SHP-2026-0420',
    qrPayload: JSON.stringify({
      passportId: 'DPP-IM800-2026-001',
      serialNumber: 'SN-IND-2026-4401',
      model: 'Powertrain IM-800',
      manufacturer: 'AeroDrive Powertrains Inc',
      verified: true
    })
  },
  {
    passportId: 'DPP-EV600-B204-001',
    serialNumber: 'SN-MOT-GT600-9901',
    modelName: 'HyperDrive GT600 Extreme Traction Motor (Unit #9901)',
    productCategory: 'EV Powertrain / High-Performance Traction Motor',
    assemblyId: 'ASM-EV600-B204',
    facilityLocation: 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
    manufacturedDate: new Date('2026-09-28T10:00:00Z'),
    specifications: {
      ratedPowerKw: 450,
      maxRpm: 24000,
      peakTorqueNm: 680,
      efficiencyRating: 'IE5 Ultra-Premium',
      nominalVoltageV: 800,
      coolingMethod: 'Direct Stator Oil-Cooled & Rotor Internal Glycol',
      totalWeightKg: 52.0
    },
    sustainability: {
      totalCarbonFootprintKgCO2e: 195.0,
      recycledMaterialPercentage: 36.5,
      recyclabilityRatePercentage: 97.2,
      euBatteryDppCompliant: true,
      circularityIndex: 0.91,
      repairabilityScore: 'Class A'
    },
    status: 'SHIPPED',
    quarantineReason: null,
    shipmentId: 'SHP-2026-B204',
    componentsUsed: [
      { componentId: 'CMP-ROTOR-B204-1', componentName: 'Precision Balanced High-Torque Rotor Core', componentType: 'Rotor' },
      { componentId: 'CMP-ROTOR-B204-2', componentName: 'Ultra-High-Speed Intermediate Shaft Assembly', componentType: 'Rotor' },
      { componentId: 'CMP-STATOR-104', componentName: 'Hairpin High-Torque Stator Sub-Assembly', componentType: 'Stator' }
    ],
    materialBatchesUsed: [
      { batchId: 'B-204', materialName: '42CrMo4 Specialized High-Torque Rotor Shaft Alloy', category: 'AlloySteel', supplierName: 'Vanguard Metallurgical Europe' },
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free Copper Wire', category: 'Conductor', supplierName: 'Aurubis AG' },
      { batchId: 'MB-MAGNET-2026-014', materialName: 'Sintered Neodymium-Iron-Boron Magnets', category: 'RareEarthMagnet', supplierName: 'RareEarth Dynamics Ltd' }
    ],
    complianceCertificates: ['ISO 9001:2015', 'ISO 26262 ASIL-D', 'CE Mark', 'UL 1004'],
    qrPayload: JSON.stringify({
      passportId: 'DPP-EV600-B204-001',
      serialNumber: 'SN-MOT-GT600-9901',
      modelName: 'HyperDrive GT600 Extreme Traction Motor',
      verified: true
    })
  },
  {
    passportId: 'DPP-EV600-B204-002',
    serialNumber: 'SN-MOT-GT600-9902',
    modelName: 'HyperDrive GT600 Extreme Traction Motor (Unit #9902)',
    productCategory: 'EV Powertrain / High-Performance Traction Motor',
    assemblyId: 'ASM-EV600-B204',
    facilityLocation: 'Gigafactory Cleanroom Plant 4 - Detroit, MI',
    manufacturedDate: new Date('2026-09-29T11:00:00Z'),
    specifications: {
      ratedPowerKw: 450,
      maxRpm: 24000,
      peakTorqueNm: 680,
      efficiencyRating: 'IE5 Ultra-Premium',
      nominalVoltageV: 800,
      coolingMethod: 'Direct Stator Oil-Cooled & Rotor Internal Glycol',
      totalWeightKg: 52.0
    },
    sustainability: {
      totalCarbonFootprintKgCO2e: 195.0,
      recycledMaterialPercentage: 36.5,
      recyclabilityRatePercentage: 97.2,
      euBatteryDppCompliant: true,
      circularityIndex: 0.91,
      repairabilityScore: 'Class A'
    },
    status: 'QC_APPROVED',
    quarantineReason: null,
    shipmentId: null,
    componentsUsed: [
      { componentId: 'CMP-ROTOR-B204-1', componentName: 'Precision Balanced High-Torque Rotor Core', componentType: 'Rotor' },
      { componentId: 'CMP-STATOR-104', componentName: 'Hairpin High-Torque Stator Sub-Assembly', componentType: 'Stator' }
    ],
    materialBatchesUsed: [
      { batchId: 'B-204', materialName: '42CrMo4 Specialized High-Torque Rotor Shaft Alloy', category: 'AlloySteel', supplierName: 'Vanguard Metallurgical Europe' },
      { batchId: 'MB-COPPER-2026-088', materialName: 'Oxygen-Free Copper Wire', category: 'Conductor', supplierName: 'Aurubis AG' }
    ],
    complianceCertificates: ['ISO 9001:2015', 'ISO 26262 ASIL-D', 'CE Mark'],
    qrPayload: JSON.stringify({
      passportId: 'DPP-EV600-B204-002',
      serialNumber: 'SN-MOT-GT600-9902',
      modelName: 'HyperDrive GT600 Extreme Traction Motor',
      verified: true
    })
  }
];

const seedShipments = [
  {
    shipmentId: 'SHP-2026-0412',
    trackingNumber: 'TRK-DHL-EXP-994182',
    carrier: 'DHL Global Forwarding (Air Express)',
    destinationClient: 'Porsche Motorsport AG',
    destinationAddress: 'Porscheplatz 1, 70435 Stuttgart, Germany',
    dispatchDate: new Date('2026-10-05T09:00:00Z'),
    estimatedDelivery: new Date('2026-10-08T16:00:00Z'),
    actualDelivery: new Date('2026-10-08T14:32:00Z'),
    products: [
      { passportId: 'DPP-EV500-2026-001', serialNumber: 'SN-MOT-2026-8801', modelName: 'UltraTorq-X500 High-Efficiency EV Traction Motor' }
    ],
    shippingStatus: 'DELIVERED',
    temperatureControlled: true,
    recalledProductCount: 0,
    notes: 'Direct delivery to Formula E / GT4 prototype testing facility. All tamper-evident seals intact.'
  },
  {
    shipmentId: 'SHP-2026-0415',
    trackingNumber: 'TRK-FDX-FRT-338190',
    carrier: 'FedEx Freight Heavy Logistics',
    destinationClient: 'Rivian Automotive Manufacturing',
    destinationAddress: '100 Rivian Way, Normal, IL 61761, USA',
    dispatchDate: new Date('2026-10-12T08:30:00Z'),
    estimatedDelivery: new Date('2026-10-16T17:00:00Z'),
    actualDelivery: null,
    products: [
      { passportId: 'DPP-EV500-2026-002', serialNumber: 'SN-MOT-2026-8802', modelName: 'UltraTorq-X500 High-Efficiency EV Traction Motor' }
    ],
    shippingStatus: 'IN_TRANSIT',
    temperatureControlled: true,
    recalledProductCount: 0,
    notes: 'En route to central powertrain assembly cell in Illinois.'
  },
  {
    shipmentId: 'SHP-2026-0420',
    trackingNumber: 'TRK-KN-CARGO-772911',
    carrier: 'Kuehne+Nagel Global Logistics',
    destinationClient: 'Siemens Mobility Rail Systems',
    destinationAddress: 'Werner-von-Siemens-Strasse 67, 91052 Erlangen, Germany',
    dispatchDate: new Date('2026-10-14T11:00:00Z'),
    estimatedDelivery: new Date('2026-10-22T12:00:00Z'),
    actualDelivery: null,
    products: [
      { passportId: 'DPP-IM800-2026-001', serialNumber: 'SN-IND-2026-4401', modelName: 'Powertrain Industrial Motor IM-800 Heavy-Duty' }
    ],
    shippingStatus: 'IN_TRANSIT',
    temperatureControlled: false,
    recalledProductCount: 0,
    notes: 'Heavy rail electrification project shipment.'
  },
  {
    shipmentId: 'SHP-2026-B204',
    trackingNumber: 'TRK-AM-B204-9901',
    carrier: 'DHL Global Forwarding High-Value Secure',
    destinationClient: 'Aston Martin Lagonda Ltd',
    destinationAddress: 'Banbury Road, Gaydon, Warwick CV35 0DB, United Kingdom',
    dispatchDate: new Date('2026-10-02T08:00:00Z'),
    estimatedDelivery: new Date('2026-10-06T14:00:00Z'),
    actualDelivery: new Date('2026-10-06T13:45:00Z'),
    products: [
      { passportId: 'DPP-EV600-B204-001', serialNumber: 'SN-MOT-GT600-9901', modelName: 'HyperDrive GT600 Extreme Traction Motor (Unit #9901)' }
    ],
    shippingStatus: 'DELIVERED',
    temperatureControlled: true,
    recalledProductCount: 0,
    notes: 'Custom high-torque powertrain consignment delivered to Gaydon R&D facility.'
  }
];

const seedDefects = [
  {
    defectId: 'DEF-2026-003',
    title: 'Sub-surface Micro-voids and Yield Strength Degradation',
    severity: 'CRITICAL',
    status: 'CONTAINED',
    affectedBatchId: 'MB-SHAFT-2026-033',
    rootCause: 'Incomplete degassing during vacuum induction melting at raw supplier furnace #4, causing 0.12mm inclusions.',
    reportedBy: 'Automated In-Line Multi-Axis Ultrasonic Scanner (Line Rotor 2)',
    identifiedDate: new Date('2026-10-20T11:15:00Z'),
    quarantineTriggered: true,
    affectedProductsCount: 1,
    affectedShipmentsCount: 0,
    containmentAction: 'Immediate automated quarantine of MB-SHAFT-2026-033, component CMP-ROTOR-201, assembly ASM-2026-0043, and product DPP-EV500-2026-003. Shipment hold verified; no defective units dispatched.',
    resolutionNotes: 'Supplier audited; batch quarantined for metallurgical lab root-cause destruction.'
  }
];

const seedManufacturingEvents = [
  {
    eventId: 'EVT-2026-0901',
    eventType: 'MATERIAL_RECEIPT',
    targetType: 'MATERIAL_BATCH',
    targetId: 'MB-COPPER-2026-088',
    timestamp: new Date('2026-09-10T08:45:00Z'),
    station: 'STATION-RECEIVING-DOCK-1',
    operator: 'Logistics Lead: Tyler Brooks',
    parametersRecorded: { weightKg: 1250, spectralConductivityPercent: 101.2, surfaceOxidation: 'None' },
    status: 'SUCCESS',
    remarks: 'Raw copper wire batch received, verified against Supplier COA and accepted into active buffer.'
  },
  {
    eventId: 'EVT-2026-0905',
    eventType: 'MATERIAL_RECEIPT',
    targetType: 'MATERIAL_BATCH',
    targetId: 'MB-SHAFT-2026-033',
    timestamp: new Date('2026-09-18T09:15:00Z'),
    station: 'STATION-RECEIVING-DOCK-2',
    operator: 'Logistics Lead: Tyler Brooks',
    parametersRecorded: { weightKg: 800, dimensionVarianceMm: 0.02 },
    status: 'SUCCESS',
    remarks: 'Alloy shaft stock accepted into cold storage staging.'
  },
  {
    eventId: 'EVT-2026-0912',
    eventType: 'WINDING',
    targetType: 'COMPONENT',
    targetId: 'CMP-STATOR-104',
    timestamp: new Date('2026-09-22T08:30:00Z'),
    station: 'STATION-HAIRPIN-WINDING-A',
    operator: 'Robotic Cell H-01',
    parametersRecorded: { slotFillFactorPercent: 78.4, insertionForceN: 420, pinCount: 48 },
    status: 'SUCCESS',
    remarks: 'Hairpin copper pin automated insertion and crown twist completed.'
  },
  {
    eventId: 'EVT-2026-0916',
    eventType: 'IMPREGNATION',
    targetType: 'COMPONENT',
    targetId: 'CMP-STATOR-104',
    timestamp: new Date('2026-09-22T14:00:00Z'),
    station: 'STATION-VPI-AUTOCLAVE-3',
    operator: 'Oven Master: Ronald Craig',
    parametersRecorded: { vacuumMbar: 0.5, resinTempC: 65, cureTimeMin: 120 },
    status: 'SUCCESS',
    remarks: 'Vacuum Pressure Impregnation completed with zero voids.'
  },
  {
    eventId: 'EVT-2026-0925',
    eventType: 'FINAL_ASSEMBLY',
    targetType: 'ASSEMBLY',
    targetId: 'ASM-2026-0041',
    timestamp: new Date('2026-09-28T14:30:00Z'),
    station: 'STATION-FINAL-TORQUE-CELL',
    operator: 'AutoCell-01',
    parametersRecorded: { housingTorqueNm: 125.4, bearingPreloadN: 2400 },
    status: 'SUCCESS',
    remarks: 'Rotor, Stator, Inverter and Housing mated with calibrated laser centering.'
  },
  {
    eventId: 'EVT-2026-0928',
    eventType: 'DYNO_TESTING',
    targetType: 'PRODUCT',
    targetId: 'DPP-EV500-2026-001',
    timestamp: new Date('2026-09-28T16:00:00Z'),
    station: 'STATION-DYNO-TEST-BENCH-1',
    operator: 'Dyno Specialist: Dr. Maya Patel',
    parametersRecorded: { peakPowerKw: 351.8, maxRpmAchieved: 20050, inverterEfficiencyPercent: 98.8, vibrationMmS: 0.28 },
    status: 'SUCCESS',
    remarks: 'Product passed 100% full-load dynamometer stress test cycle.'
  },
  {
    eventId: 'EVT-2026-1002',
    eventType: 'PACKAGING',
    targetType: 'PRODUCT',
    targetId: 'DPP-EV500-2026-001',
    timestamp: new Date('2026-10-04T10:00:00Z'),
    station: 'STATION-LASER-ETCH-DPP',
    operator: 'Station AI Agent',
    parametersRecorded: { dppPassportQrCodeHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    status: 'SUCCESS',
    remarks: 'EU Digital Product Passport QR and NFC identity cryptographic token etched into motor casing.'
  },
  {
    eventId: 'EVT-2026-1008',
    eventType: 'DISPATCH',
    targetType: 'SHIPMENT',
    targetId: 'SHP-2026-0412',
    timestamp: new Date('2026-10-05T09:00:00Z'),
    station: 'BAY-LOGISTICS-AIR-01',
    operator: 'Logistics Supervisor: Tyler Brooks',
    parametersRecorded: { grossWeightKg: 62.4, trackingAssigned: 'TRK-DHL-EXP-994182' },
    status: 'SUCCESS',
    remarks: 'Dispatched via DHL Express air cargo to Porsche Motorsport.'
  },
  {
    eventId: 'EVT-2026-1020',
    eventType: 'DEFECT_DETECTED',
    targetType: 'MATERIAL_BATCH',
    targetId: 'MB-SHAFT-2026-033',
    timestamp: new Date('2026-10-20T11:15:00Z'),
    station: 'STATION-ULTRASONIC-NDT',
    operator: 'Sensor Automated Watchdog',
    parametersRecorded: { flawDepthMm: 3.4, defectType: 'Sub-surface Micro-voids', acousticAttenuationDb: 8.5 },
    status: 'ALERT',
    remarks: 'Non-destructive acoustic testing flagged structural integrity violation.'
  },
  {
    eventId: 'EVT-2026-1021',
    eventType: 'QUARANTINE_TRIGGERED',
    targetType: 'PRODUCT',
    targetId: 'DPP-EV500-2026-003',
    timestamp: new Date('2026-10-20T11:45:00Z'),
    station: 'CENTRAL-TRACEABILITY-ENGINE',
    operator: 'Traceability AI Guardian',
    parametersRecorded: { automatedQuarantineExecutedMs: 42, affectedDownstreamCount: 3 },
    status: 'ALERT',
    remarks: 'System automatically traced batch MB-SHAFT-2026-033 -> component CMP-ROTOR-201 -> assembly ASM-2026-0043 -> product DPP-EV500-2026-003 in 42ms and locked the serial number.'
  }
];

const seedAuditRecords = [
  {
    auditId: 'AUD-2026-001',
    timestamp: new Date('2026-09-10T08:50:00Z'),
    actionType: 'CREATE',
    entityType: 'MaterialBatch',
    entityId: 'MB-COPPER-2026-088',
    actor: 'QC Inspector Tyler Brooks',
    previousState: null,
    newState: { batchId: 'MB-COPPER-2026-088', status: 'ACTIVE', qty: 1250 },
    ipAddress: '192.168.10.15',
    hashSignature: generateHash({ entity: 'MB-COPPER-2026-088', time: 1 }),
    summary: 'Material batch MB-COPPER-2026-088 registered into persistent ledger.'
  },
  {
    auditId: 'AUD-2026-002',
    timestamp: new Date('2026-09-28T16:50:00Z'),
    actionType: 'CREATE',
    entityType: 'Product',
    entityId: 'DPP-EV500-2026-001',
    actor: 'Plant Execution System (MES)',
    previousState: null,
    newState: { passportId: 'DPP-EV500-2026-001', status: 'MANUFACTURED', serial: 'SN-MOT-2026-8801' },
    ipAddress: '192.168.20.40',
    hashSignature: generateHash({ entity: 'DPP-EV500-2026-001', time: 2 }),
    summary: 'Digital Product Passport generated for UltraTorq-X500 Unit #8801.'
  },
  {
    auditId: 'AUD-2026-003',
    timestamp: new Date('2026-10-05T09:15:00Z'),
    actionType: 'STATUS_CHANGE',
    entityType: 'Product',
    entityId: 'DPP-EV500-2026-001',
    actor: 'Logistics Manager Vance',
    previousState: { status: 'QC_APPROVED' },
    newState: { status: 'SHIPPED', shipmentId: 'SHP-2026-0412' },
    ipAddress: '192.168.10.88',
    hashSignature: generateHash({ entity: 'DPP-EV500-2026-001', time: 3 }),
    summary: 'Status transition to SHIPPED upon handoff to DHL Air Cargo.'
  },
  {
    auditId: 'AUD-2026-004',
    timestamp: new Date('2026-10-20T11:15:00Z'),
    actionType: 'DEFECT_FLAGGED',
    entityType: 'Defect',
    entityId: 'DEF-2026-003',
    actor: 'Automated Ultrasonic Scanner',
    previousState: null,
    newState: { defectId: 'DEF-2026-003', severity: 'CRITICAL', batch: 'MB-SHAFT-2026-033' },
    ipAddress: '192.168.30.12',
    hashSignature: generateHash({ entity: 'DEF-2026-003', time: 4 }),
    summary: 'Critical defect DEF-2026-003 logged on batch MB-SHAFT-2026-033.'
  },
  {
    auditId: 'AUD-2026-005',
    timestamp: new Date('2026-10-20T11:45:00Z'),
    actionType: 'QUARANTINE_EXECUTED',
    entityType: 'Product',
    entityId: 'DPP-EV500-2026-003',
    actor: 'Traceability AI Autonomous Engine',
    previousState: { status: 'MANUFACTURED' },
    newState: { status: 'QUARANTINED', quarantineReason: 'Defective batch MB-SHAFT-2026-033' },
    ipAddress: '127.0.0.1',
    hashSignature: generateHash({ entity: 'DPP-EV500-2026-003', time: 5 }),
    summary: 'Instantaneous containment: Product DPP-EV500-2026-003 quarantined in 42ms.'
  },
  {
    auditId: 'AUD-2026-006',
    timestamp: new Date('2026-10-20T11:46:00Z'),
    actionType: 'PASSPORT_VERIFIED',
    entityType: 'Product',
    entityId: 'DPP-EV500-2026-001',
    actor: 'Porsche Motorsport Quality Auditor',
    previousState: null,
    newState: { verified: true, signatureValid: true },
    ipAddress: '195.14.88.2',
    hashSignature: generateHash({ entity: 'DPP-EV500-2026-001', time: 6 }),
    summary: 'Remote passport QR cryptographic audit verification passed.'
  }
];

module.exports = {
  seedMaterialBatches,
  seedComponents,
  seedAssemblies,
  seedProducts,
  seedShipments,
  seedDefects,
  seedManufacturingEvents,
  seedAuditRecords,
};
