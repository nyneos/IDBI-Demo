/**
 * Generates public/samples/idbi_transaction_sample.xlsx (150 rows).
 * Usage: node scripts/generate-idbi-transactions.mjs [rowCount]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'samples', 'idbi_transaction_sample.xlsx');
const ROW_COUNT = Number(process.argv[2]) || 150;
const SEED = 20260816;

const HEADERS = [
  'Transaction_ID',
  'Transaction_Date',
  'Transaction_Time',
  'Value_Date',
  'Account_Number',
  'CIF_Number',
  'Customer_Name',
  'Account_Type',
  'Customer_Segment',
  'Branch_Code',
  'Branch_Name',
  'Zone',
  'IFSC_Code',
  'Transaction_Type',
  'Transaction_Mode',
  'Transaction_Category',
  'Channel',
  'Amount',
  'Currency',
  'Available_Balance',
  'Status',
  'Reference_Number',
  'Beneficiary_Name',
  'Beneficiary_Account_Number',
  'Beneficiary_IFSC',
  'Beneficiary_Bank_Name',
  'Remitter_Name',
  'Narration',
  'Merchant_Category_Code',
  'Terminal_ID',
  'Relationship_Manager_Code',
  'KYC_Status',
  'AML_Risk_Flag',
  'Maker_ID',
  'Checker_ID',
  'Processing_System',
];

const TRANSFER_MODES = new Set(['NEFT', 'RTGS', 'IMPS', 'UPI']);
const MANUAL_MODES = new Set(['Cheque', 'Cash', 'Clearing', 'Standing Instruction', 'ECS/NACH']);
const CARD_ATM_MODES = new Set(['POS', 'Card Transaction', 'ATM Withdrawal']);

const FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Myra', 'Aarohi', 'Anika', 'Pari', 'Kiara', 'Navya',
  'Rajesh', 'Suresh', 'Priya', 'Neha', 'Amit', 'Pooja', 'Vikram', 'Kavita', 'Rahul', 'Meera',
  'Sanjay', 'Deepa', 'Nikhil', 'Shreya', 'Manoj', 'Lakshmi', 'Harish', 'Anjali', 'Rakesh', 'Sunita',
];
const LAST = [
  'Sharma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Khan', 'Singh', 'Gupta', 'Mehta', 'Joshi',
  'Desai', 'Kulkarni', 'Banerjee', 'Chatterjee', 'Pillai', 'Menon', 'Agarwal', 'Jain', 'Verma', 'Rao',
];

const BRANCHES = [
  { code: '0147', city: 'Mumbai', area: 'Fort', zone: 'West Zone' },
  { code: '0001', city: 'Mumbai', area: 'Nariman Point', zone: 'West Zone' },
  { code: '0218', city: 'Pune', area: 'Koregaon Park', zone: 'West Zone' },
  { code: '0334', city: 'Ahmedabad', area: 'Navrangpura', zone: 'West Zone' },
  { code: '0412', city: 'Surat', area: 'Ring Road', zone: 'West Zone' },
  { code: '0521', city: 'Nagpur', area: 'Sitabuldi', zone: 'West Zone' },
  { code: '1102', city: 'Delhi', area: 'Connaught Place', zone: 'North Zone' },
  { code: '1188', city: 'Delhi', area: 'Karol Bagh', zone: 'North Zone' },
  { code: '1245', city: 'Jaipur', area: 'C Scheme', zone: 'North Zone' },
  { code: '1310', city: 'Lucknow', area: 'Hazratganj', zone: 'North Zone' },
  { code: '1422', city: 'Chandigarh', area: 'Sector 17', zone: 'North Zone' },
  { code: '1550', city: 'Amritsar', area: 'Lawrence Road', zone: 'North Zone' },
  { code: '2091', city: 'Bengaluru', area: 'MG Road', zone: 'South Zone' },
  { code: '2104', city: 'Bengaluru', area: 'Whitefield', zone: 'South Zone' },
  { code: '2219', city: 'Chennai', area: 'T Nagar', zone: 'South Zone' },
  { code: '2307', city: 'Hyderabad', area: 'Banjara Hills', zone: 'South Zone' },
  { code: '2444', city: 'Kochi', area: 'MG Road', zone: 'South Zone' },
  { code: '2561', city: 'Coimbatore', area: 'RS Puram', zone: 'South Zone' },
  { code: '2680', city: 'Visakhapatnam', area: 'Dwaraka Nagar', zone: 'South Zone' },
  { code: '3103', city: 'Kolkata', area: 'Park Street', zone: 'East Zone' },
  { code: '3188', city: 'Kolkata', area: 'Salt Lake', zone: 'East Zone' },
  { code: '3255', city: 'Bhubaneswar', area: 'Saheed Nagar', zone: 'East Zone' },
  { code: '3371', city: 'Patna', area: 'Fraser Road', zone: 'East Zone' },
  { code: '3490', city: 'Guwahati', area: 'Paltan Bazaar', zone: 'East Zone' },
  { code: '3522', city: 'Ranchi', area: 'Main Road', zone: 'East Zone' },
  { code: '4108', city: 'Bhopal', area: 'MP Nagar', zone: 'Central Zone' },
  { code: '4220', city: 'Indore', area: 'Vijay Nagar', zone: 'Central Zone' },
  { code: '4333', city: 'Raipur', area: 'Pandri', zone: 'Central Zone' },
  { code: '4451', city: 'Jabalpur', area: 'Civil Lines', zone: 'Central Zone' },
  { code: '4566', city: 'Gwalior', area: 'City Centre', zone: 'Central Zone' },
  { code: '0610', city: 'Nashik', area: 'College Road', zone: 'West Zone' },
  { code: '0728', city: 'Vadodara', area: 'Alkapuri', zone: 'West Zone' },
  { code: '1633', city: 'Dehradun', area: 'Rajpur Road', zone: 'North Zone' },
  { code: '1719', city: 'Noida', area: 'Sector 18', zone: 'North Zone' },
  { code: '2735', city: 'Mysuru', area: 'Sayyaji Rao Road', zone: 'South Zone' },
  { code: '2814', city: 'Madurai', area: 'Anna Nagar', zone: 'South Zone' },
  { code: '3601', city: 'Cuttack', area: 'Buxi Bazaar', zone: 'East Zone' },
  { code: '4688', city: 'Jamshedpur', area: 'Bistupur', zone: 'East Zone' },
  { code: '0899', city: 'Thane', area: 'Naupada', zone: 'West Zone' },
  { code: '1904', city: 'Gurgaon', area: 'DLF Phase 1', zone: 'North Zone' },
].map((b) => ({
  ...b,
  name: `${b.city} ${b.area} Branch`,
  ifsc: `IBKL0${b.code.padStart(6, '0')}`,
}));

const OTHER_BANKS = [
  { prefix: 'SBIN0', name: 'State Bank of India' },
  { prefix: 'HDFC0', name: 'HDFC Bank' },
  { prefix: 'ICIC0', name: 'ICICI Bank' },
  { prefix: 'UTIB0', name: 'Axis Bank' },
  { prefix: 'PUNB0', name: 'Punjab National Bank' },
  { prefix: 'IBKL0', name: 'IDBI Bank' },
];

const MCCS = [
  { code: '5411', label: 'Grocery' },
  { code: '5812', label: 'Restaurants' },
  { code: '6011', label: 'ATM' },
  { code: '5541', label: 'Fuel' },
  { code: '5311', label: 'Department Stores' },
];

const MODES = [
  'NEFT',
  'RTGS',
  'IMPS',
  'UPI',
  'Cheque',
  'Cash',
  'ATM Withdrawal',
  'POS',
  'Internet Banking',
  'Mobile Banking',
  'Standing Instruction',
  'ECS/NACH',
  'Clearing',
  'Card Transaction',
];

const PURPOSES = [
  'SALARY AUG 2026',
  'FUND TRF',
  'VENDOR PMT',
  'RENT AUG 2026',
  'EMI HDFC',
  'INS PREM',
  'SIP MF',
  'TAX PMT',
  'UTILITY BILL',
  'MERCHANT PMT',
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);

function rand() {
  return rng();
}

function pick(list) {
  return list[Math.floor(rand() * list.length)];
}

function weighted(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let x = rand() * total;
  for (const [value, w] of pairs) {
    x -= w;
    if (x <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
}

function pad(n, w) {
  return String(n).padStart(w, '0');
}

function formatDate(d) {
  return `${pad(d.getDate(), 2)}-${pad(d.getMonth() + 1, 2)}-${d.getFullYear()}`;
}

function yyyymmdd(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function logUniform(min, max) {
  const lo = Math.log(min);
  const hi = Math.log(max);
  return Math.exp(lo + rand() * (hi - lo));
}

function money(n) {
  return Math.round(n * 100) / 100;
}

function amountFromDistribution() {
  const bucket = weighted([
    ['a', 70],
    ['b', 20],
    ['c', 8],
    ['d', 2],
  ]);
  if (bucket === 'a') return money(logUniform(200, 25000));
  if (bucket === 'b') return money(logUniform(25000, 200000));
  if (bucket === 'c') return money(logUniform(200000, 1000000));
  return money(logUniform(1000000, 5000000));
}

function balanceFor(accountType, segment) {
  if (segment === 'Priority Banking') return money(logUniform(1000000, 8000000));
  if (segment === 'Corporate' || accountType === 'Cash Credit') return money(logUniform(500000, 20000000));
  if (segment === 'SME' || accountType === 'Current') return money(logUniform(50000, 2500000));
  if (segment === 'Government') return money(logUniform(200000, 5000000));
  if (segment === 'NRI' || accountType === 'NRE' || accountType === 'NRO') return money(logUniform(80000, 2000000));
  return money(logUniform(5000, 500000));
}

function channelFor(mode) {
  switch (mode) {
    case 'ATM Withdrawal':
      return 'ATM';
    case 'POS':
    case 'Card Transaction':
      return 'POS Terminal';
    case 'UPI':
      return 'UPI App';
    case 'Internet Banking':
      return 'Internet Banking';
    case 'Mobile Banking':
      return 'Mobile Banking App';
    case 'NEFT':
    case 'RTGS':
    case 'IMPS':
      return pick(['Internet Banking', 'Mobile Banking App', 'Corporate Banking Portal', 'Branch']);
    case 'Cash':
    case 'Cheque':
    case 'Clearing':
      return 'Branch';
    case 'Standing Instruction':
    case 'ECS/NACH':
      return pick(['Branch', 'Corporate Banking Portal']);
    default:
      return pick(['Internet Banking', 'Mobile Banking App', 'Branch']);
  }
}

function processingFor(mode) {
  if (mode === 'UPI') return 'UPI Switch';
  if (mode === 'IMPS') return 'NPCI IMPS';
  if (mode === 'NEFT' || mode === 'RTGS') return 'RTGS/NEFT Gateway';
  if (mode === 'POS' || mode === 'Card Transaction') return 'POS Switch';
  if (mode === 'ATM Withdrawal') return 'ATM Switch';
  return 'Finacle Core Banking';
}

function categoryFor(type, mode) {
  if (mode === 'ATM Withdrawal') return 'Cash Withdrawal';
  if (mode === 'Cash') return type === 'Credit' ? 'Cash Deposit' : 'Cash Withdrawal';
  if (mode === 'POS' || mode === 'Card Transaction') return pick(['Merchant Payment', 'Card Payment']);
  if (mode === 'ECS/NACH' || mode === 'Standing Instruction') {
    return pick(['Loan EMI', 'Utility Bill Payment', 'Insurance Premium', 'Investment (SIP/MF)']);
  }
  if (type === 'Credit') {
    return pick(['Salary Credit', 'Interest Credit', 'Refund', 'Fund Transfer']);
  }
  return pick([
    'Fund Transfer',
    'Utility Bill Payment',
    'Merchant Payment',
    'Tax Payment',
    'Loan EMI',
    'Service Charges',
    'Insurance Premium',
    'Investment (SIP/MF)',
  ]);
}

function typeFor(mode) {
  if (mode === 'ATM Withdrawal') return 'Debit';
  if (mode === 'POS' || mode === 'Card Transaction') return 'Debit';
  if (mode === 'Cash') return weighted([['Credit', 55], ['Debit', 45]]);
  return weighted([['Credit', 48], ['Debit', 52]]);
}

function timeFor(mode, channel) {
  const branchHours = channel === 'Branch' || MANUAL_MODES.has(mode) || mode === 'Cheque';
  let h;
  let m;
  let s;
  if (branchHours) {
    h = 9 + Math.floor(rand() * 9);
    m = Math.floor(rand() * 60);
    s = Math.floor(rand() * 60);
  } else {
    h = Math.floor(rand() * 24);
    m = Math.floor(rand() * 60);
    s = Math.floor(rand() * 60);
  }
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}`;
}

function handleFrom(name) {
  const base = name.toLowerCase().replace(/\s+/g, '.');
  return `${base}@${pick(['okicici', 'oksbi', 'ybl', 'paytm'])}`;
}

function otherIfsc() {
  const bank = pick(OTHER_BANKS);
  const n = pad(100 + Math.floor(rand() * 8900), 6);
  return { ifsc: `${bank.prefix}${n}`, name: bank.name };
}

function maskedAccount() {
  return `XXXXXXXX${pad(1000 + Math.floor(rand() * 9000), 4)}`;
}

function terminalId() {
  return `T${pick(['MUM', 'DEL', 'BLR', 'CHN', 'HYD', 'KOL'])}${pad(Math.floor(rand() * 99999), 5)}`;
}

function empId() {
  return `EMP${pad(10000 + Math.floor(rand() * 2000), 5)}`;
}

function buildCustomers(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const segment = weighted([
      ['Retail', 70],
      ['SME', 12],
      ['Corporate', 10],
      ['Priority Banking', 5],
      ['NRI', 2],
      ['Government', 1],
    ]);
    let accountType;
    if (segment === 'NRI') accountType = pick(['NRE', 'NRO']);
    else if (segment === 'Corporate' || segment === 'SME') {
      accountType = pick(['Current', 'Cash Credit', 'Overdraft', 'Term Loan']);
    } else if (segment === 'Priority Banking') {
      accountType = pick(['Savings', 'Current', 'Fixed Deposit']);
    } else {
      accountType = pick(['Savings', 'Savings', 'Savings', 'Current', 'Fixed Deposit']);
    }
    out.push({
      name,
      cif: String(100000000 + i * 17 + Math.floor(rand() * 9)),
      account: maskedAccount(),
      segment,
      accountType,
      branch: pick(BRANCHES),
      kyc: weighted([
        ['Verified', 90],
        ['Pending', 7],
        ['Expired', 3],
      ]),
      aml: weighted([
        ['Low', 92],
        ['Medium', 6],
        ['High', 1.5],
        ['Flagged for Review', 0.5],
      ]),
      rm:
        segment === 'Priority Banking' || segment === 'Corporate'
          ? `RM${pad(4000 + (i % 80), 4)}`
          : '',
    });
  }
  return out;
}

function referenceFor(mode, date, seq) {
  if (mode === 'NEFT' || mode === 'RTGS') {
    return `IBKLR${yyyymmdd(date).slice(2)}${pad(seq, 5)}`.slice(0, 16);
  }
  if (mode === 'UPI' || mode === 'POS' || mode === 'Card Transaction') {
    return pad(100000000000 + (seq % 900000000000), 12);
  }
  if (mode === 'Cheque') return pad(100000 + (seq % 900000), 6);
  return '';
}

function narration({
  status,
  type,
  mode,
  ifsc,
  name,
  purpose,
  cheque,
  terminal,
  handle,
}) {
  if (status === 'Failed') {
    return pick([
      'TXN FAILED-INSUFFICIENT FUNDS',
      'TXN FAILED-INVALID BENEFICIARY',
      'TXN FAILED-NPCI TIMEOUT',
      'TXN FAILED-LIMIT EXCEEDED',
    ]);
  }
  if (status === 'Reversed') return `TXN REVERSED-${mode}`;
  if (status === 'Pending') return `${mode} PENDING-AWAIT SETTLEMENT`;
  if (status === 'Under Investigation') return `${mode} HOLD-UNDER INVESTIGATION`;

  if (mode === 'NEFT' || mode === 'RTGS' || mode === 'IMPS') {
    return `${mode}-${ifsc}-${name.toUpperCase()}-${purpose}`;
  }
  if (mode === 'UPI') return `UPI/${handle}/${purpose === 'MERCHANT PMT' ? 'Merchant Payment' : purpose}`;
  if (mode === 'Cheque') return `CHQ PAID-${cheque}`;
  if (mode === 'Cash') return type === 'Credit' ? 'CASH DEPOSIT-BRANCH' : 'CASH WITHDRAWAL-BRANCH';
  if (mode === 'ATM Withdrawal') return `ATM WDL-${terminal}`;
  if (mode === 'POS' || mode === 'Card Transaction') return `POS/${purpose}`;
  if (mode === 'ECS/NACH') return `NACH-${purpose}`;
  if (mode === 'Standing Instruction') return `SI-${purpose}`;
  return `${mode}-${purpose}`;
}

function generate() {
  const customers = buildCustomers(48);
  const start = new Date(2026, 7, 1);
  const rows = [];

  for (let i = 0; i < ROW_COUNT; i++) {
    const dayOffset = Math.floor(rand() * 16);
    const txnDate = addDays(start, dayOffset);
    const customer = pick(customers);
    const mode = pick(MODES);
    const type = typeFor(mode);
    const channel = channelFor(mode);
    const amount = amountFromDistribution();
    const status = weighted([
      ['Success', 93],
      ['Failed', 3],
      ['Pending', 2],
      ['Reversed', 1.5],
      ['Under Investigation', 0.5],
    ]);
    const purpose = pick(PURPOSES);
    const isTransfer = TRANSFER_MODES.has(mode);
    const digital = !MANUAL_MODES.has(mode) && channel !== 'Branch';
    const large = amount > 500000;
    const needsChecker = large || MANUAL_MODES.has(mode) || channel === 'Branch';
    const mcc = CARD_ATM_MODES.has(mode)
      ? mode === 'ATM Withdrawal'
        ? '6011'
        : pick(MCCS.filter((m) => m.code !== '6011')).code
      : '';
    const terminal = CARD_ATM_MODES.has(mode) ? terminalId() : '';
    const chequeNo = mode === 'Cheque' ? pad(100000 + i, 6) : '';
    const ref = referenceFor(mode, txnDate, i + 1);
    const valueLag = (mode === 'NEFT' || mode === 'Cheque' || mode === 'Clearing') && rand() < 0.22;
    const valueDate = valueLag ? addDays(txnDate, 1 + Math.floor(rand() * 2)) : txnDate;
    const counterparty = `${pick(FIRST)} ${pick(LAST)}`;
    const beneBank = otherIfsc();
    const showBene = type === 'Debit' && isTransfer;
    const showRemitter = type === 'Credit' && isTransfer;
    const maker = digital && !needsChecker ? '' : empId();
    const checker = needsChecker ? empId() : '';

    rows.push({
      Transaction_ID: `TXN${yyyymmdd(txnDate)}${pad(i + 1, 5)}`,
      Transaction_Date: formatDate(txnDate),
      Transaction_Time: timeFor(mode, channel),
      Value_Date: formatDate(valueDate),
      Account_Number: customer.account,
      CIF_Number: customer.cif,
      Customer_Name: customer.name,
      Account_Type: customer.accountType,
      Customer_Segment: customer.segment,
      Branch_Code: customer.branch.code,
      Branch_Name: customer.branch.name,
      Zone: customer.branch.zone,
      IFSC_Code: customer.branch.ifsc,
      Transaction_Type: type,
      Transaction_Mode: mode,
      Transaction_Category: categoryFor(type, mode),
      Channel: channel,
      Amount: amount,
      Currency: 'INR',
      Available_Balance: balanceFor(customer.accountType, customer.segment),
      Status: status,
      Reference_Number: ref,
      Beneficiary_Name: showBene ? counterparty : '',
      Beneficiary_Account_Number: showBene ? maskedAccount() : '',
      Beneficiary_IFSC: showBene ? beneBank.ifsc : '',
      Beneficiary_Bank_Name: showBene ? beneBank.name : '',
      Remitter_Name: showRemitter ? counterparty : '',
      Narration: narration({
        status,
        type,
        mode,
        ifsc: showBene ? beneBank.ifsc : customer.branch.ifsc,
        name: showBene || showRemitter ? counterparty : customer.name,
        purpose,
        cheque: chequeNo,
        terminal,
        handle: handleFrom(showBene || showRemitter ? counterparty : customer.name),
      }),
      Merchant_Category_Code: mcc,
      Terminal_ID: terminal,
      Relationship_Manager_Code: customer.rm,
      KYC_Status: customer.kyc,
      AML_Risk_Flag: customer.aml,
      Maker_ID: maker,
      Checker_ID: checker,
      Processing_System: processingFor(mode),
    });
  }

  return rows;
}

function assertInvariants(rows) {
  const ids = new Set(rows.map((r) => r.Transaction_ID));
  if (ids.size !== rows.length) throw new Error('Duplicate Transaction_ID');

  const branchZone = new Map();
  for (const r of rows) {
    const prev = branchZone.get(r.Branch_Code);
    if (prev && prev !== r.Zone) {
      throw new Error(`Branch ${r.Branch_Code} mapped to both ${prev} and ${r.Zone}`);
    }
    branchZone.set(r.Branch_Code, r.Zone);
  }

  const atm = rows.filter((r) => r.Transaction_Mode === 'ATM Withdrawal');
  if (atm.length === 0) throw new Error('No ATM Withdrawal rows to spot-check');
  for (const r of atm) {
    if (!r.Terminal_ID) throw new Error('ATM row missing Terminal_ID');
    if (r.Beneficiary_Name) throw new Error('ATM row has Beneficiary_Name');
    if (r.Transaction_Type !== 'Debit') throw new Error('ATM row is not Debit');
  }
}

const rows = generate();
assertInvariants(rows);

const sheetRows = [HEADERS, ...rows.map((r) => HEADERS.map((h) => r[h]))];
const ws = XLSX.utils.aoa_to_sheet(sheetRows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

const atm = rows.filter((r) => r.Transaction_Mode === 'ATM Withdrawal').length;
console.log(`Wrote ${rows.length} rows × ${HEADERS.length} columns → ${OUT}`);
console.log(`ATM Withdrawal rows: ${atm} (all have Terminal_ID, none have Beneficiary_Name)`);
console.log(`Unique Transaction_ID: ${new Set(rows.map((r) => r.Transaction_ID)).size}`);
