import type { Parish, ApplicationType, DocItem, AIFlag, Application, FeeBreakdown } from './types';

export const PARISHES: Record<Parish, { label: string; municipality: string; agency: string; available: boolean }> = {
  'kingston':     { label: 'Kingston',    municipality: 'Kingston & St. Andrew Corporation', agency: 'KSAC',  available: true },
  'st-andrew':    { label: 'St. Andrew',  municipality: 'K&SAM Corporation (Half Way Tree)', agency: 'KSAMC', available: true },
  'st-catherine': { label: 'St. Catherine', municipality: 'St. Catherine Municipal Corporation', agency: 'SCMC', available: false },
  'st-james':     { label: 'St. James',   municipality: 'St. James Municipal Corporation',   agency: 'SJMC',  available: false },
};

export const APP_TYPES: Record<ApplicationType, {
  label: string;
  code: string;
  description: string;
  estimatedWeeks: string;
  copyCount: number;
  drawingSpec: string;
  typicalFor: string;
  available: boolean;
}> = {
  'fdp': {
    label: 'Full Development Permission',
    code: 'FDP',
    description: 'New construction, extensions over 50 sq ft, or any change to land use that requires planning approval.',
    estimatedWeeks: '12–24 weeks',
    copyCount: 4,
    drawingSpec: 'A0 site plans · A1 floor plans, elevations, sections',
    typicalFor: 'New builds, major extensions, commercial development',
    available: true,
  },
  'bp': {
    label: 'Building Permit',
    code: 'BP',
    description: 'Structural changes, additions, or where detailed construction approval is needed alongside planning permission.',
    estimatedWeeks: '8–16 weeks',
    copyCount: 3,
    drawingSpec: 'A0 site plans · A1 floor plans',
    typicalFor: 'Structural work, renovations with engineering sign-off',
    available: true,
  },
  'subdivision': {
    label: 'Subdivision',
    code: 'SUB',
    description: 'Dividing land into two or more parcels for sale or individual development.',
    estimatedWeeks: '16–30 weeks',
    copyCount: 5,
    drawingSpec: 'A0 subdivision plan',
    typicalFor: 'Land division, estate development, lot creation',
    available: false,
  },
  'change-of-use': {
    label: 'Change of Use',
    code: 'CoU',
    description: 'Converting an existing structure to a different use class (e.g. residential to commercial).',
    estimatedWeeks: '10–18 weeks',
    copyCount: 3,
    drawingSpec: 'A1 existing and proposed floor plans',
    typicalFor: 'Residential to commercial, office conversions',
    available: false,
  },
};

type DocTemplate = Omit<DocItem, 'id' | 'status' | 'uploadedAt' | 'collaboratorId'>;

export const DOC_REQUIREMENTS: Record<ApplicationType, DocTemplate[]> = {
  'fdp': [
    { name: 'Certificate of Title', required: true, stamped: false, notes: 'Must be in applicant\'s name or accompanied by proof of ownership transfer.' },
    { name: 'Completed Application Form', required: true, stamped: false, notes: 'Signed by applicant. Available from KSAC/KSAMC cashier.' },
    { name: 'Site Plan', required: true, stamped: true, stampedBy: 'Licensed Land Surveyor', drawingSize: 'A0', notes: 'Must show boundaries, road frontage, north arrow, and scale.' },
    { name: 'Floor Plans', required: true, stamped: true, stampedBy: 'Registered Architect', drawingSize: 'A1', notes: 'All floors. Include roof plan.' },
    { name: 'Elevations (All 4)', required: true, stamped: true, stampedBy: 'Registered Architect', drawingSize: 'A1', notes: 'North, South, East, and West elevations.' },
    { name: 'Sections', required: true, stamped: true, stampedBy: 'Registered Architect', drawingSize: 'A1' },
    { name: 'Structural Drawings', required: true, stamped: true, stampedBy: 'Registered Engineer', drawingSize: 'A1', notes: 'Required for all load-bearing structures.' },
    { name: 'Structural Report', required: true, stamped: true, stampedBy: 'Registered Engineer', notes: 'Stamped and signed by engineer of record.' },
    { name: 'Sewage & Drainage Plan', required: true, stamped: true, stampedBy: 'Registered Engineer', drawingSize: 'A1' },
    { name: 'Agency Fee Payment Receipt', required: true, stamped: false, notes: 'Manager\'s cheque or stamped bank receipt.' },
    { name: 'Environmental Impact Assessment', required: false, stamped: false, notes: 'Required if land exceeds 1 acre or borders a protected area. Check with NEPA.' },
    { name: 'Land Valuation Roll Extract', required: false, stamped: false, notes: 'May be required by some agencies. Available from Tax Administration Jamaica.' },
    { name: 'NHT Letter of Confirmation', required: false, stamped: false, notes: 'Required if NHT financing is involved.' },
  ],
  'bp': [
    { name: 'Certificate of Title', required: true, stamped: false },
    { name: 'Completed Application Form', required: true, stamped: false },
    { name: 'Site Plan', required: true, stamped: true, stampedBy: 'Licensed Land Surveyor', drawingSize: 'A0' },
    { name: 'Floor Plans', required: true, stamped: true, stampedBy: 'Registered Architect', drawingSize: 'A1' },
    { name: 'Elevations (All 4)', required: true, stamped: true, stampedBy: 'Registered Architect', drawingSize: 'A1' },
    { name: 'Structural Drawings', required: true, stamped: true, stampedBy: 'Registered Engineer', drawingSize: 'A1' },
    { name: 'Structural Report', required: true, stamped: true, stampedBy: 'Registered Engineer' },
    { name: 'Agency Fee Payment Receipt', required: true, stamped: false },
  ],
  'subdivision': [
    { name: 'Certificate of Title', required: true, stamped: false },
    { name: 'Completed Application Form', required: true, stamped: false },
    { name: 'Subdivision Plan', required: true, stamped: true, stampedBy: 'Licensed Land Surveyor', drawingSize: 'A0' },
    { name: 'Site Analysis Report', required: true, stamped: false },
    { name: 'Infrastructure Plan', required: true, stamped: true, stampedBy: 'Registered Engineer' },
    { name: 'Drainage Plan', required: true, stamped: true, stampedBy: 'Registered Engineer' },
    { name: 'Agency Fee Payment Receipt', required: true, stamped: false },
    { name: 'Environmental Impact Assessment', required: false, stamped: false, notes: 'Required if subdivision exceeds 10 lots.' },
  ],
  'change-of-use': [
    { name: 'Certificate of Title', required: true, stamped: false },
    { name: 'Completed Application Form', required: true, stamped: false },
    { name: 'Site Plan', required: true, stamped: true, stampedBy: 'Licensed Land Surveyor', drawingSize: 'A0' },
    { name: 'Existing Floor Plans', required: true, stamped: true, stampedBy: 'Registered Architect', drawingSize: 'A1' },
    { name: 'Proposed Floor Plans', required: true, stamped: true, stampedBy: 'Registered Architect', drawingSize: 'A1' },
    { name: 'Agency Fee Payment Receipt', required: true, stamped: false },
  ],
};

export function calcAgencyFee(parish: Parish, type: ApplicationType, landAreaSqM: number): Omit<FeeBreakdown, 'serviceFee' | 'printFee' | 'deliveryFee' | 'total'> {
  const rates: Record<Parish, Record<ApplicationType, (a: number) => number>> = {
    'kingston':     { 'fdp': a => Math.max(15000, a * 45), 'bp': a => Math.max(8000, a * 30), 'subdivision': a => Math.max(20000, a * 60), 'change-of-use': () => 12000 },
    'st-andrew':    { 'fdp': a => Math.max(15000, a * 45), 'bp': a => Math.max(8000, a * 30), 'subdivision': a => Math.max(20000, a * 60), 'change-of-use': () => 12000 },
    'st-catherine': { 'fdp': a => Math.max(12000, a * 40), 'bp': a => Math.max(7000, a * 25), 'subdivision': a => Math.max(18000, a * 55), 'change-of-use': () => 10000 },
    'st-james':     { 'fdp': a => Math.max(12000, a * 40), 'bp': a => Math.max(7000, a * 25), 'subdivision': a => Math.max(18000, a * 55), 'change-of-use': () => 10000 },
  };

  const paymentMethod: Record<Parish, string> = {
    'kingston':     "Manager's cheque payable to 'Kingston & St. Andrew Corporation'",
    'st-andrew':    "Manager's cheque payable to 'Kingston & St. Andrew Municipal Corporation'",
    'st-catherine': "Manager's cheque payable to 'St. Catherine Municipal Corporation'",
    'st-james':     "Manager's cheque payable to 'St. James Municipal Corporation'",
  };

  const instructions: Record<Parish, string> = {
    'kingston':     'Deposit at any NCB branch or KSAC cashier, 79 Duke Street, Kingston.',
    'st-andrew':    'Deposit at any NCB branch or KSAMC cashier, Half Way Tree Road.',
    'st-catherine': 'Deposit at SCMC cashier only, White Church Street, Spanish Town.',
    'st-james':     'Deposit at SJMC cashier, St. James Street, Montego Bay.',
  };

  const bankName: Record<Parish, string> = {
    'kingston': 'NCB', 'st-andrew': 'NCB', 'st-catherine': 'NCB', 'st-james': 'NCB',
  };

  return {
    agencyFee: Math.round(rates[parish][type](landAreaSqM)),
    agencyLastVerified: 'May 2025',
    paymentMethod: paymentMethod[parish],
    paymentInstructions: instructions[parish],
    bankName: bankName[parish],
  };
}

export const PLANIT_FEES = {
  service: 3500,
  printA0: 1200,
  printA1: 800,
  printA4: 90,
  delivery: 2800,
  deliverOnly: 1800,
};

export function buildFee(parish: Parish, type: ApplicationType, landAreaSqM: number, path: 'print-deliver' | 'deliver-only' | 'self-deliver', docCount: { a0: number; a1: number; a4: number }): FeeBreakdown {
  const base = calcAgencyFee(parish, type, landAreaSqM);
  const printFee = path === 'print-deliver'
    ? docCount.a0 * PLANIT_FEES.printA0 + docCount.a1 * PLANIT_FEES.printA1 + docCount.a4 * PLANIT_FEES.printA4
    : 0;
  const deliveryFee = path === 'self-deliver' ? 0 : path === 'deliver-only' ? PLANIT_FEES.deliverOnly : PLANIT_FEES.delivery;
  return {
    ...base,
    serviceFee: PLANIT_FEES.service,
    printFee,
    deliveryFee,
    total: base.agencyFee + PLANIT_FEES.service + printFee + deliveryFee,
  };
}

export function generateAIFlags(docs: DocItem[]): AIFlag[] {
  const flags: AIFlag[] = [];
  const missing = docs.filter(d => d.required && d.status === 'pending');
  const unstamped = docs.filter(d => d.stamped && d.status === 'uploaded');

  if (missing.length > 0) {
    flags.push({
      id: 'f-missing',
      severity: 'critical',
      title: `${missing.length} required document${missing.length > 1 ? 's' : ''} missing`,
      description: missing.map(d => d.name).join(', '),
      dismissed: false,
    });
  }
  if (unstamped.length > 0) {
    flags.push({
      id: 'f-stamp',
      severity: 'warning',
      title: 'Stamp confirmation needed',
      description: `${unstamped.length} document${unstamped.length > 1 ? 's require' : ' requires'} a professional stamp. Confirm stamps are visible before submission.`,
      dismissed: false,
    });
  }
  flags.push({
    id: 'f-referral',
    severity: 'advisory',
    title: 'NEPA referral threshold',
    description: 'If any proposed structure exceeds 465 sq m (5,000 sq ft) gross floor area, automatic NEPA referral is triggered. Verify with your architect.',
    dismissed: false,
  });
  flags.push({
    id: 'f-nwc',
    severity: 'advisory',
    title: 'NWC water connection notice',
    description: 'Developments within NWC service areas may require a connection letter. Confirm with your engineer.',
    dismissed: false,
  });
  return flags;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function buildDocList(type: ApplicationType): DocItem[] {
  return DOC_REQUIREMENTS[type].map(t => ({
    ...t,
    id: makeId(),
    status: 'pending' as const,
  }));
}

export function seedApplications(): Application[] {
  const kingstonFdpDocs = buildDocList('fdp');
  kingstonFdpDocs[0].status = 'uploaded';
  kingstonFdpDocs[0].uploadedAt = '2025-06-10';
  kingstonFdpDocs[1].status = 'uploaded';
  kingstonFdpDocs[1].uploadedAt = '2025-06-11';
  kingstonFdpDocs[2].status = 'uploaded';
  kingstonFdpDocs[2].uploadedAt = '2025-06-12';

  const bpDocs = buildDocList('bp');
  bpDocs.forEach(d => { d.status = 'uploaded'; d.uploadedAt = '2025-05-15'; });
  bpDocs[7].status = 'pending';

  return [
    {
      id: makeId(),
      ref: 'PLN-FDP-KGN-4821',
      createdAt: '2025-06-08',
      updatedAt: '2025-06-14',
      status: 'documents',
      parish: 'kingston',
      municipality: 'Kingston & St. Andrew Corporation',
      agency: 'KSAC',
      applicationType: 'fdp',
      address: '14 Barbican Road, Kingston 6',
      lotNumber: 'Lot 47B',
      volume: '1204',
      folio: '382',
      landAreaSqM: 465,
      currentUse: 'Vacant land',
      proposedUse: '4-bedroom residential dwelling',
      docs: kingstonFdpDocs,
      collaborators: [
        {
          id: makeId(),
          name: 'Marcus Wellington',
          role: 'architect',
          email: 'mwellington@arch.com',
          status: 'active',
          invitedAt: '2025-06-09',
          lastActiveAt: '2025-06-12',
          assignedDocIds: [kingstonFdpDocs[3]?.id, kingstonFdpDocs[4]?.id, kingstonFdpDocs[5]?.id].filter(Boolean) as string[],
        },
      ],
      aiFlags: [],
      aiReviewRun: false,
      receiptUploaded: false,
      receiptVerified: false,
      planitFeePaid: false,
    },
    {
      id: makeId(),
      ref: 'PLN-BP-STA-2193',
      createdAt: '2025-05-12',
      updatedAt: '2025-06-20',
      status: 'submitted',
      parish: 'st-andrew',
      municipality: 'K&SAM Corporation (Half Way Tree)',
      agency: 'KSAMC',
      applicationType: 'bp',
      address: '7 Cherry Gardens Avenue, St. Andrew',
      lotNumber: 'Lot 12',
      volume: '988',
      folio: '140',
      landAreaSqM: 280,
      currentUse: 'Residential dwelling',
      proposedUse: 'Extension — additional bedroom and studio',
      docs: bpDocs,
      collaborators: [],
      aiFlags: generateAIFlags(bpDocs),
      aiReviewRun: true,
      fee: buildFee('st-andrew', 'bp', 280, 'print-deliver', { a0: 1, a1: 3, a4: 2 }),
      receiptUploaded: true,
      receiptVerified: true,
      planitFeePaid: true,
      submissionPath: 'print-deliver',
      submittedAt: '2025-06-20',
      trackingStatus: 'Under review at KSAMC. Expected decision window: 8–16 weeks.',
    },
  ];
}
