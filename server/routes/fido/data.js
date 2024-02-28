const domains = [
  {
    "Domain Name": "Insurance (INS)",
    Domain: "01",
  },
  {
    "Domain Name": "Public Records (PR)",
    Domain: "02",
  },
  {
    "Domain Name": "United Kingdom (UK)",
    Domain: "03",
  },
  {
    "Domain Name": "Yogurt",
    Domain: "04",
  },
];

const activityTypes = [
  {
    "Activity Type": "Prod LZ Space Monitoring",
    "Activity ID": "0001",
    "Format Code": "01",
    Domains: ["01", "02"],
  },
  {
    "Activity Type": "Prod Thor Space Monitoring",
    "Activity ID": "0002",
    "Format Code": "02",
    Domains: ["01", "02", "03", "04"],
  },
  {
    "Activity Type": "PConland LZ Space Monitoring",
    "Activity ID": "0003",
    "Format Code": "01",
    Domains: ["01"],
  },
  {
    "Activity Type": "Dev Thor Space Monitoring",
    "Activity ID": "0004",
    "Format Code": "02",
    Domains: ["01"],
  },
  {
    "Activity Type": "Dev LZ Space Monitoring",
    "Activity ID": "0005",
    "Format Code": "01",
    Domains: ["01", "02"],
  },
  {
    "Activity Type": "Prod Windows LZ Space Monitoring",
    "Activity ID": "0006",
    "Format Code": "07",
    Domains: ["01"],
  },
  {
    "Activity Type": "ENP Directory Monitoring for File Movement",
    "Activity ID": "0007",
    "Format Code": "04",
    Domains: ["01"],
  },
  {
    "Activity Type": "Job/App Monitoring",
    "Activity ID": "0008",
    "Format Code": "03",
    Domains: ["01", "02", "03", "04"],
  },
  {
    "Activity Type": "Scrub Queue Monitoring",
    "Activity ID": "0009",
    "Format Code": "04",
    Domains: ["01"],
  },
  {
    "Activity Type": "Files Not Moving",
    "Activity ID": "0010",
    "Format Code": "04",
    Domains: ["01", "02"],
  },
  {
    "Activity Type": "Launch Stats",
    "Activity ID": "0011",
    "Format Code": "08",
    Domains: [],
  },
  {
    "Activity Type": "Orbit Profile Check",
    "Activity ID": "0012",
    "Format Code": "06",
    Domains: ["01", "02"],
  },
  {
    "Activity Type": "Scrub ENP Log Scraper",
    "Activity ID": "0013",
    "Format Code": "05",
    Domains: [],
  },
  {
    "Activity Type": "Batch File Not Sent",
    "Activity ID": "0016",
    "Format Code": "09",
    Domains: [],
  },
  {
    "Activity Type": "Thor Down Detection",
    "Activity ID": "0015",
    "Format Code": "10",
    Domains: [],
  },
];

const productCategory = [
  {
    "Product Name": "A&R Marketing",
    "Product Category": "ANRM",
    "Display Name": "A&R Marketing",
    Tier: "No Tier",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Active Insight",
    "Product Category": "ACTI",
    "Display Name": "ACTIVE INSIGHT",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Address",
    "Product Category": "ADDR",
    "Display Name": "ADDRESS",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "ALIRtS",
    "Product Category": "ALRT",
    "Display Name": "ALIRTS",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["7", "000", "800", "110", "016"],
  },
  {
    "Product Name": "Analytics",
    "Product Category": "ANLT",
    "Display Name": "TO BE DETERMINED",
    Tier: "No Tier",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Archive",
    "Product Category": "ARCH",
    "Display Name": "ARCHIVE",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Assets",
    "Product Category": "ASST",
    "Display Name": "ASSETS",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Auto",
    "Product Category": "AUTO",
    "Display Name": "AUTO",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["80", "012"],
  },
  {
    "Product Name": "Business",
    "Product Category": "BUSI",
    "Display Name": "BUSINESS",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "California Consumer Privacy Act",
    "Product Category": "CCPA",
    "Display Name": "CALIFORNIA CONSUMER PRIVACY ACT",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["80", "010"],
  },
  {
    "Product Name": "Carrier Discovery",
    "Product Category": "CD",
    "Display Name": "CARRIER DISCOVERY",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["7", "000", "800", "120", "014"],
  },
  {
    "Product Name": "CLAIMAddrKeys",
    "Product Category": "CADK",
    "Display Name": "CLAIMADDRKEYS",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "CLAIMDFA",
    "Product Category": "CDFA",
    "Display Name": "CLAIMDFA",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Claims Discovery Auto",
    "Product Category": "CDSA",
    "Display Name": "CLAIMS DISCOVERY AUTO",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["80", "012"],
  },
  {
    "Product Name": "Claims Discovery Property",
    "Product Category": "CDSP",
    "Display Name": "CLAIMS DISCOVERY PROPERTY",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["80", "012"],
  },
  {
    "Product Name": "CLUE Auto",
    "Product Category": "CLUA",
    "Display Name": "CLUE AUTO",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["70", "008", "000", "900", "120", "000"],
  },
  {
    "Product Name": "CLUE Property",
    "Product Category": "CLUP",
    "Display Name": "CLUE PROPERTY",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["70", "008", "000", "900", "120", "000"],
  },
  {
    "Product Name": "Commercial CLUE Auto",
    "Product Category": "CCLU",
    "Display Name": "COMMERCIAL CLUE AUTO",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["70", "008", "000", "900", "120", "000"],
  },
  {
    "Product Name": "Commercial Credit",
    "Product Category": "CMCR",
    "Display Name": "COMMERCIAL CREDIT",
    Tier: "Tier 3",
    Domains: ["01"],
    "Activity Types": ["80", "012"],
  },
  {
    "Product Name": "Commercial Current Carrier",
    "Product Category": "CCCM",
    "Display Name": "COMMERCIAL CURRENT CARRIER",
    Tier: "Tier 3",
    Domains: ["01"],
    "Activity Types": ["700", "080", "014"],
  },
  {
    "Product Name": "Consumer Disclosure",
    "Product Category": "CDP",
    "Display Name": "CONSUMER DISCLOSURE",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Contributory Add-Ons",
    "Product Category": "CADO",
    "Display Name": "CONTRIBUTORY ADD-ONS",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Contributory Rejects",
    "Product Category": "CONT",
    "Display Name": "CONTRIBUTORY REJECTS",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0007"],
  },
  {
    "Product Name": "Court",
    "Product Category": "COUR",
    "Display Name": "COURT",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Criminal",
    "Product Category": "CRIM",
    "Display Name": "CRIMINAL",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "CUE",
    "Product Category": "CUE",
    "Display Name": "CUE",
    Tier: "No Tier",
    Domains: ["03"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Current Carrier",
    "Product Category": "CC",
    "Display Name": "CURRENT CARRIER",
    Tier: "Tier 1",
    Domains: ["01", "002", "03", "004"],
    "Activity Types": ["700", "080", "009", "001", "100", "000", "000"],
  },
  {
    "Product Name": "Current Carrier for Life",
    "Product Category": "CCFL",
    "Display Name": "CURRENT CARRIER FOR LIFE",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["700", "080", "014"],
  },
  {
    "Product Name": "Customer Support Logs",
    "Product Category": "CS",
    "Display Name": "CUSTOMER SUPPORT LOGS",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Customer Support Logs - SLA-Bound",
    "Product Category": "CSSL",
    "Display Name": "CUSTOMER SUPPORT LOGS - SLA-BOUND",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Databases",
    "Product Category": "DB",
    "Display Name": "TO BE DETERMINED",
    Tier: "No Tier",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Derogatory Data",
    "Product Category": "DERO",
    "Display Name": "DEROGATORY DATA",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Driver License",
    "Product Category": "DL",
    "Display Name": "DRIVER LICENSE",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["80", "012"],
  },
  {
    "Product Name": "eCrash",
    "Product Category": "ECRA",
    "Display Name": "ECRASH",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Events",
    "Product Category": "EVEN",
    "Display Name": "EVENTS",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "FIRSt",
    "Product Category": "FRST",
    "Display Name": "FIRST",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["700", "080", "011"],
  },
  {
    "Product Name": "Gong",
    "Product Category": "GONG",
    "Display Name": "GONG",
    Tier: "Tier 1",
    Domains: [],
    "Activity Types": [],
  },
  {
    "Product Name": "Healthcare",
    "Product Category": "HEAL",
    "Display Name": "HEALTHCARE",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Inquiry",
    "Product Category": "INQ",
    "Display Name": "INQUIRY",
    Tier: "Tier 1",
    Domains: ["02"],
    "Activity Types": ["800", "100", "012"],
  },
  {
    "Product Name": "Insurance Payment History",
    "Product Category": "INPH",
    "Display Name": "INSURANCE PAYMENT HISTORY",
    Tier: "Tier 2",
    Domains: ["01"],
    "Activity Types": ["7", "000", "800", "120", "014"],
  },
  {
    "Product Name": "Insurance Prescreen",
    "Product Category": "INPS",
    "Display Name": "INSURANCE PRESCREEN",
    Tier: "Tier 3",
    Domains: ["01"],
    "Activity Types": ["80", "010"],
  },
  {
    "Product Name": "Insurance Verification Services",
    "Product Category": "IVS",
    "Display Name": "INSURANCE VERIFICATION SERVICES",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Landing Zones",
    "Product Category": "LZ",
    "Display Name": "TO BE DETERMINED",
    Tier: "No Tier",
    Domains: ["01", "02", "03"],
    "Activity Types": ["1", "000", "300", "050", "006"],
  },
  {
    "Product Name": "Licenses",
    "Product Category": "LICN",
    "Display Name": "LICENSES",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Licensing",
    "Product Category": "LICG",
    "Display Name": "LICENSING",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Mapview Zurich",
    "Product Category": "MVZ",
    "Display Name": "MAPVIEW ZURICH",
    Tier: "No Tier",
    Domains: ["03"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Market Magnifier",
    "Product Category": "MMAG",
    "Display Name": "MARKET MAGNIFIER",
    Tier: "Tier 3",
    Domains: ["01"],
    "Activity Types": ["80", "010"],
  },
  {
    "Product Name": "Metadata",
    "Product Category": "META",
    "Display Name": "METADATA",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Motor Vehicle Records",
    "Product Category": "MVR",
    "Display Name": "MOTOR VEHICLE RECORDS",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "NAC",
    "Product Category": "NAC",
    "Display Name": "NAC",
    Tier: "Tier 1",
    Domains: ["02"],
    "Activity Types": ["800", "100", "012"],
  },
  {
    "Product Name": "NCD",
    "Product Category": "NCD",
    "Display Name": "NCD",
    Tier: "No Tier",
    Domains: ["03"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "No Family",
    "Product Category": "NONE",
    "Display Name": "NO FAMILY",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Orbit",
    "Product Category": "ORBT",
    "Display Name": "TO BE DETERMINED",
    Tier: "No Tier",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "People",
    "Product Category": "PEOP",
    "Display Name": "PEOPLE",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "People at Work",
    "Product Category": "PEOW",
    "Display Name": "PEOPLE AT WORK",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Phones Info",
    "Product Category": "PHIN",
    "Display Name": "Phones Info",
    Tier: "Tier 1",
    Domains: [],
    "Activity Types": [],
  },
  {
    "Product Name": "Policy Insights",
    "Product Category": "PLIN",
    "Display Name": "POLICY INSIGHTS",
    Tier: "No Tier",
    Domains: ["03"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Policy Watch",
    "Product Category": "PW",
    "Display Name": "POLICY WATCH",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["70", "008"],
  },
  {
    "Product Name": "Property",
    "Product Category": "PROP",
    "Display Name": "PROPERTY",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Sanctions",
    "Product Category": "SANC",
    "Display Name": "SANCTIONS",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "SAR",
    "Product Category": "SAR",
    "Display Name": "SAR",
    Tier: "No Tier",
    Domains: ["03"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Scoring",
    "Product Category": "SCOR",
    "Display Name": "TO BE DETERMINED",
    Tier: "No Tier",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Suppression",
    "Product Category": "SUPP",
    "Display Name": "SUPPRESSION",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Telematics",
    "Product Category": "TLUS",
    "Display Name": "TELEMATICS",
    Tier: "Tier 1",
    Domains: ["01"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Telephone",
    "Product Category": "TELE",
    "Display Name": "TELEPHONE",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Telephone and Email",
    "Product Category": "TEML",
    "Display Name": "TELEPHONE AND EMAIL",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Test Product Category",
    "Product Category": "TEST",
    "Display Name": "TO BE DETERMINED",
    Tier: "No Tier",
    Domains: ["01", "03"],
    "Activity Types": ["80", "011"],
  },
  {
    "Product Name": "Thor",
    "Product Category": "DR",
    "Display Name": "TO BE DETERMINED",
    Tier: "No Tier",
    Domains: ["01", "02", "03", "04"],
    "Activity Types": ["200", "040", "015"],
  },
  {
    "Product Name": "Tracesmart",
    "Product Category": "TRSM",
    "Display Name": "TRACESMART",
    Tier: "No Tier",
    Domains: ["03"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "UK Insurance Database",
    "Product Category": "UIDB",
    "Display Name": "UK INSURANCE DATABASE",
    Tier: "No Tier",
    Domains: ["03"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Vehicles",
    "Product Category": "VEHI",
    "Display Name": "VEHICLES",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Vital Statistics",
    "Product Category": "VITA",
    "Display Name": "VITAL STATISTICS",
    Tier: "No Tier",
    Domains: ["02"],
    "Activity Types": ["0008"],
  },
  {
    "Product Name": "Yogurt",
    "Product Category": "YGRT",
    "Display Name": "YOGURT",
    Tier: "No Tier",
    Domains: ["04"],
    "Activity Types": ["0008"],
  },
];

//Get all domains regardless of activity type
const getAllDomains = () => {
  return domains;
}

//Get all activity types
const getActivityTypesForADomain = ({domainId}) => {
  const activities = activityTypes.filter((activity) =>
    activity.Domains.includes(domainId)
  );
  return activities;
}

//Function  to return domains when activity type id is given
const getDomainFromActivityTypeId = ({activityTypeId}) => {
  const activity = activityTypes.find(
    (activity) => activity["Activity ID"] === activityTypeId
  );
  if (activity) {
    const matchingDomains = domains.filter((d) =>
      activity.Domains.includes(d.Domain)
    );

    const cleanedData = matchingDomains.map((d) => ({label: d["Domain Name"], value: d.Domain}));
    return cleanedData;
  }
  return [];
};

//Function to return an array of product categories when domains are given
function getProductCategoryFromDomainAndActivityType({
  domain,
  activityTypeId,
}) {
  const matchingItems = productCategory.filter(
    (item) =>
      item.Domains.includes(domain) &&
      item["Activity Types"].includes(activityTypeId)
  );

  const cleanedData = matchingItems.map((d) => ({
    label: d["Product Name"],
    value: d["Product Category"],
  }));
  return cleanedData;

}


module.exports = {
  activityTypes,
  productCategory,
  domains,
  getActivityTypesForADomain,
  getAllDomains,
  getDomainFromActivityTypeId,
  getProductCategoryFromDomainAndActivityType
};  
