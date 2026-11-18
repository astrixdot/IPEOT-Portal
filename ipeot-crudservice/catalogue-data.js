export const catalogue = {
  "extraTypes": [
    {
      "code": "D5-LH",
      "name": "Liquid holdup estimation and liquid management strategy for trunklines",
      "department": "D5",
      "workCentre": null
    },
    {
      "code": "D5-SA",
      "name": "Surge analysis",
      "department": "D5",
      "workCentre": null
    },
    {
      "code": "D5-FH",
      "name": "Flow hydraulic study (offshore lines)",
      "department": "D5",
      "workCentre": null
    },
    {
      "code": "D5-FR",
      "name": "Field development scheme or feasibility report (offshore)",
      "department": "D5",
      "workCentre": null
    },
    {
      "code": "D5-NA",
      "name": "Nodal analysis study (offshore networks)",
      "department": "D5",
      "workCentre": null
    },
    {
      "code": "D5-TS",
      "name": "Transient simulation for deepwater networks",
      "department": "D5",
      "workCentre": null
    },
    {
      "code": "D5-VL",
      "name": "VLP studies for upcoming offshore fields",
      "department": "D5",
      "workCentre": null
    },
    {
      "code": "D5-SU",
      "name": "Field start-up studies",
      "department": "D5",
      "workCentre": null
    }
  ],
  "studies": {
    "D1-ACID": {
      "sampleReport": "2462",
      "inputs": [
        "Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"
      ],
      "specimens": [
        "Core sample",
        "formation water sample",
        "crude oil sample"
      ],
      "equipment": [
        "core flow apparatus"
      ],
      "tests": [
        "permeability test"
      ],
      "software": [],
      "formSchema": null
    },
    "D1-SAND": {
      "sampleReport": "3562",
      "inputs": [
        "Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"
      ],
      "specimens": [
        "Core sample"
      ],
      "equipment": [
        "Linear flow apparatus",
        "sieve analysis apparatus"
      ],
      "tests": [
        "sand control test",
        "particle size distribution"
      ],
      "software": [],
      "formSchema": null
    },
    "D1-SOLVENT": {
      "sampleReport": "3528",
      "inputs": [
        "Field description,production history,production plan, Reservoir Studies, well completion report, formation water analysis,CBL-VDL report, Build up study report,Gradient surveys"
      ],
      "specimens": [
        "crude oil sample"
      ],
      "equipment": [
        "Viscometer",
        "SARA analysis apparatus"
      ],
      "tests": [
        "Viscosity profile and SARA analysis"
      ],
      "software": [],
      "formSchema": null
    },
    "D1-AFRAC": {
      "sampleReport": "1870",
      "inputs": [
        "Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"
      ],
      "specimens": [
        "Core sample",
        "formation water sample",
        "crude oil sample"
      ],
      "equipment": [
        "Core Flow Appartus"
      ],
      "tests": [
        "wormhole testing"
      ],
      "software": [
        {
          "name": "Gohfer",
          "use": "Acid fracturing"
        }
      ],
      "formSchema": null
    },
    "D1-WOBRINE": {
      "sampleReport": "2711",
      "inputs": [
        "Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"
      ],
      "specimens": [
        "Core sample",
        "formation water sample",
        "crude oil sample"
      ],
      "equipment": [
        "core flow apparatus"
      ],
      "tests": [
        "permeability test"
      ],
      "software": [],
      "formSchema": null
    },
    "D1-WINTEG": {
      "sampleReport": "3599",
      "inputs": [
        "Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report"
      ],
      "specimens": [
        "software needed"
      ],
      "equipment": [
        "WellCat software"
      ],
      "tests": [
        "integrity test"
      ],
      "software": [
        {
          "name": "WellCat",
          "use": "Well integrity analysis"
        }
      ],
      "formSchema": null
    },
    "D2-HAZOP": {
      "sampleReport": "HAZOP Study - Onshore & Offshore",
      "inputs": [
        "1. Updated P&ID of the complete facility",
        "2. Detailed Process Description of the facility.",
        "3. Updated PFD of the facility.",
        "4. List of facilities/equipment with Operating and Design Pressure & temperature.",
        "5. Details of Fire & Gas detection and suppression system.",
        "6. Mention if H2S is being handled at any of these installation.",
        "7. SAFE Chart/ Cause and effect diagram (if available).",
        "8. Previous HAZOP report and its compliance status, if any.",
        "9. Audit report/Observation, if any.",
        "10. Reason for the study proposal.",
        "11. Contact person at Installation, in case any clarification is required."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "PHA-Pro",
          "use": "Study software"
        }
      ],
      "formSchema": null
    },
    "D2-QRA-ON": {
      "sampleReport": "QRA Study- Onshore",
      "inputs": [
        "1. Latest P&ID.",
        "2. Process description.",
        "3. Installation layout to the scale.",
        "4. Process Flow Diagram.",
        "5. Latest Process parameters of Oil and Gas processed in the installation (Pressure, temperature, Flow rate)",
        "6. Equipment Details - Size or capacity, Operating parameters (Pressure, Temperature)",
        "7. Storage tanks- Number of tanks , size or capacity of Tanks and Dyke Details",
        "8. Latest Well test data",
        "9. Shift wise manning details with sitting/manned location inside the installation.",
        "10. Outside population detail (approx. numbers present) within 500m",
        "11. Probable Ignition sources within the installation",
        "12. Gas composition data, Oil density data",
        "13. Flare details- flaring quantity, Flare stack height & Flare stack Diameter.",
        "14. Firefighting facility details present in the installation.",
        "15. Wind Rose data of the location",
        "16. Previous QRA/ HAZOP report.",
        "17. Any Specific OISD/ DGMS observation relevant to QRA study."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Safeti-Phast",
          "use": "Study software"
        }
      ],
      "formSchema": null
    },
    "D2-QRA-OFF": {
      "sampleReport": "QRA Study- Offshore",
      "inputs": [
        "1. Latest P&ID.",
        "2. Process description.",
        "3. Deck-wise layout to the scale.",
        "4. Process Flow Diagram.",
        "5. Current production rate of Oil/ Gas/ Condensate and dispatch pressure/temperature",
        "6. Deck wise list of Static and Rotary Equipment- with their Size or capacity, Operating Pressure & Temperature",
        "7. Latest Well test data",
        "8. Riser Data: Nos. and type of risers (oil/gas/WI) platform wise with size, operating pressure, temperature. Details of fuel gas riser, if any, on the Platform",
        "9. Distribution of total POB with below mentioned classification: Operations, Maintenance, Production and Domestic.",
        "10. No. of visits of OSV/MSV/Barge per year including stay time per year.",
        "11. Helicopter details: No. of crew changes per annum with avg. no. of passengers, flight time, number of stages. No. of fights to unmanned platforms per annum with average passengers.",
        "12. Well data: Numbers of wells Flowing in bridge connected wellhead platform, if any, and shut in/flowing Well pressure and temperature",
        "13. Gas composition data, Oil density data (including H2S)",
        "14. Latest morning DPR",
        "15. Details of deck wise Life saving Appliances (LSA) i.e. Lifeboats, life rafts along with their capacity",
        "16. Wind Rose data of the location",
        "17. Previous QRA/ HAZOP report.",
        "18. Any Specific OISD/ DGMS observation relevant to QRA study."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Phast",
          "use": "Study software"
        }
      ],
      "formSchema": null
    },
    "D2-EERA": {
      "sampleReport": "EERA Study- Offshore",
      "inputs": [
        "1. Brief process description of the process complex",
        "2. Morning DPR",
        "3. Well test data",
        "4. Deck Layout drawings & Escape route and stairways layout of the process complex",
        "5. Details of Lifeboats, its locations and capacity",
        "6. Details of Life Saving Appliances (LSA)-e.g. Life rafts, life buoys, Rescue boat, Life jackets, oxygen masks , rope ladder, Personnel Transfer basket, and other PPE items etc.",
        "7. Details of emergency lighting, Muster stations (MS)",
        "8. Location of Platform Abandon Alarm & MCPs (Manual Call points)",
        "9. Fire detection/Suppression Systems details",
        "10. POB details and deck wise manning details",
        "11. Well SBHP, FTHP, tubing size.",
        "12. Location of Living quarter, helideck & fire walls present in the complex",
        "13. ERP/DMP and Risk Register of the complex",
        "14. Previous EERA study report for the process complex."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Phast",
          "use": "Study software"
        }
      ],
      "formSchema": null
    },
    "D2-FGR": {
      "sampleReport": "FG",
      "inputs": [
        "Flare gas flow rates, Flare system deisgn datasheet, Operating Parameters",
        "Crude characterization (ASTM D86), Gas composition,",
        "PFD and P&ID",
        "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-ADEQ-FLARE": {
      "sampleReport": "ACF",
      "inputs": [
        "Flare gas flow rates, Flare system deisgn datasheet, Operating Parameters",
        "Production Profile- Oil, Water and Gas",
        "Crude characterization (ASTM D86), Gas composition,",
        "PFD and P&ID",
        "Equipment Datasheets and Drawing (GA)",
        "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-ADEQ-PROC": {
      "sampleReport": "ACS",
      "inputs": [
        "Production Profile- Oil, Water and Gas",
        "Crude characterization (ASTM D86), Gas composition,",
        "PFD and P&ID",
        "Equipment Datasheets and Drawing (GA)",
        "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-ADEQ-HX": {
      "sampleReport": "ACE",
      "inputs": [
        "Production Profile- Oil, Water and Gas",
        "Crude characterization (ASTM D86), Gas composition,",
        "PFD and P&ID",
        "Equipment Datasheets and Drawing (GA)",
        "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-GDU": {
      "sampleReport": "GDU",
      "inputs": [
        "Production Profile- Oil, Water and Gas",
        "Crude characterization (ASTM D86), Gas composition,",
        "PFD and P&ID",
        "Equipment Datasheets and Drawing (GA)",
        "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-SCHEME": {
      "sampleReport": "SF-FDP",
      "inputs": [
        "Production Profile- Oil, Water and Gas",
        "Crude characterization (ASTM D86), Gas composition,",
        "PFD and P&ID",
        "Well locations and Pipeline network"
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-MERGE": {
      "sampleReport": "FM",
      "inputs": [
        "Production Profile- Oil, Water and Gas",
        "Crude characterization (ASTM D86), Gas composition,",
        "Equipment Datasheets and Drawing (GA)",
        "Well locations and Pipeline network",
        "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-SHRINK": {
      "sampleReport": "SF",
      "inputs": [
        "Crude characterization (ASTM D86), Gas composition,",
        "PFD and P&ID",
        "Equipment Datasheets and Drawing (GA)",
        "Well locations and Pipeline network",
        "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "Aspen HYSYS",
          "use": "Process modelling and simulation"
        },
        {
          "name": "Pipesim",
          "use": "Flowline hydraulics"
        },
        {
          "name": "Flaresim",
          "use": "Flare system analysis"
        },
        {
          "name": "Iprocal",
          "use": "Separators adequacy"
        }
      ],
      "formSchema": null
    },
    "D2-FLOW": {
      "sampleReport": "",
      "inputs": [
        "Candidate crude samples, Problem statement, Samples of the flow assurance chemicals(if any), Operating Conditions( well head temperature, pressure, reservoir details, production flow rate, water cut, and any other data), existing practices."
      ],
      "specimens": [],
      "equipment": [
        "Rotatory Evaporator",
        "Low temperature Bath",
        "Dean Stark Apparatus",
        "Digital Density Meter",
        "Centrifuge",
        "Pour Point Apparatus",
        "Cross Polar Microscope with Thermal Stage",
        "SIMDIS-DHA (GC)",
        "Rheometer",
        "D-86 Apparatus"
      ],
      "tests": [
        "Sara Analysis",
        "wax Content",
        "Water Content",
        "Density",
        "BS & W",
        "Pour Point",
        "WAT",
        "Crude oil profiling",
        "Wax profiling",
        "Viscosity",
        "API Gravity",
        "Resin Content",
        "Distillation profile of Crude oil"
      ],
      "software": [],
      "formSchema": null
    },
    "D2-PPD": {
      "sampleReport": "",
      "inputs": [
        "candidate crude samples, PPDs/Flow improver, Operating Conditions(temperature and pressure, production flow rate, water cut, and any other pertinent field data), existing practices."
      ],
      "specimens": [],
      "equipment": [
        "Rotatory Evaporator",
        "Low temperature Bath",
        "Dean Stark Apparatus",
        "Digital Density Meter",
        "Centrifuge",
        "Pour Point Apparatus",
        "Cross Polar Microscope with Thermal Stage",
        "SIMDIS-DHA (GC)",
        "Rheometer",
        "D-86 Apparatus"
      ],
      "tests": [
        "Sara Analysis",
        "wax Content",
        "Water Content",
        "Density",
        "BS & W",
        "Pour Point",
        "WAT",
        "Crude oil profiling",
        "Wax profiling",
        "Viscosity",
        "API Gravity",
        "Resin Content",
        "Distillation profile of Crude oil"
      ],
      "software": [],
      "formSchema": null
    },
    "D2-GAS": {
      "sampleReport": "",
      "inputs": [
        "Gas samples"
      ],
      "specimens": [],
      "equipment": [
        "Natural Gas Analyzer (Gas Chromatography)"
      ],
      "tests": [
        "Natural gas profiling"
      ],
      "software": [],
      "formSchema": null
    },
    "D3-CA": {
      "sampleReport": "CA",
      "inputs": [
        "Material Design properties (Material grade, thickness, Size, Corrosion Allownace)",
        "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)",
        "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)",
        "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)",
        "Water Analysis (Produced water, injection water, ETP)",
        "Gas Analysis",
        "Chemical Dosing History (CI, Biocide, SI)",
        "GAD, P&ID, Bathymetry",
        "NDT Reports"
      ],
      "specimens": [
        "Water Sample"
      ],
      "equipment": [
        "Scanning Electron Microscope",
        "Wet Chemistry Lab"
      ],
      "tests": [
        "Fractography and surface morphology of failed area",
        "Water and Corrosion product analysis"
      ],
      "software": [
        {
          "name": "Predict",
          "use": "Corrosion Rate"
        },
        {
          "name": "CorrShaman",
          "use": "Material Selection, Flow Regime, Cracking Vulnerability"
        },
        {
          "name": "DownholeSAT",
          "use": "Scaling Tendency"
        },
        {
          "name": "PipeSim",
          "use": "Flow Velocity, T/P Profile"
        }
      ],
      "formSchema": null
    },
    "D3-MOC": {
      "sampleReport": "MOC",
      "inputs": [
        "Material Design properties (Material grade, thickness, Size, Corrosion Allownace)",
        "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)",
        "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)",
        "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)",
        "Water Analysis (Produced water, injection water, ETP)",
        "Gas Analysis",
        "Chemical Dosing History (CI, Biocide, SI)",
        "GAD, P&ID, Bathymetry",
        "NDT Reports"
      ],
      "specimens": [
        "Crude Oil"
      ],
      "equipment": [
        "Hardness Testing",
        "Wet Chemistry Lab"
      ],
      "tests": [
        "Hardness of material",
        "Water and Corrosion product analysis"
      ],
      "software": [
        {
          "name": "Predict",
          "use": "Corrosion Rate"
        },
        {
          "name": "CorrShaman",
          "use": "Material Selection, Flow Regime, Cracking Vulnerability"
        },
        {
          "name": "DownholeSAT",
          "use": "Scaling Tendency"
        },
        {
          "name": "PipeSim",
          "use": "Flow Velocity, T/P Profile"
        }
      ],
      "formSchema": null
    },
    "D3-RCA": {
      "sampleReport": "RCA",
      "inputs": [
        "Material Design properties (Material grade, thickness, Size, Corrosion Allownace)",
        "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)",
        "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)",
        "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)",
        "Water Analysis (Produced water, injection water, ETP)",
        "Gas Analysis",
        "Chemical Dosing History (CI, Biocide, SI)",
        "GAD, P&ID, Bathymetry",
        "NDT Reports"
      ],
      "specimens": [
        "Failed material"
      ],
      "equipment": [
        "Semi Automatic Grinding Polishing",
        "Wet Chemistry Lab"
      ],
      "tests": [
        "Sample preparation for visualising in inverted microsope",
        "Water and Corrosion product analysis"
      ],
      "software": [
        {
          "name": "Predict",
          "use": "Corrosion Rate"
        },
        {
          "name": "CorrShaman",
          "use": "Material Selection, Flow Regime, Cracking Vulnerability"
        },
        {
          "name": "DownholeSAT",
          "use": "Scaling Tendency"
        },
        {
          "name": "PipeSim",
          "use": "Flow Velocity, T/P Profile"
        }
      ],
      "formSchema": null
    },
    "D3-MT": {
      "sampleReport": "MT",
      "inputs": [
        "Material Design properties (Material grade, thickness, Size, Corrosion Allownace)",
        "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)",
        "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)",
        "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)"
      ],
      "specimens": [
        "Corrosion Inhibitor"
      ],
      "equipment": [
        "Inverted Microscope"
      ],
      "tests": [
        "Inclusions and Microstructure check"
      ],
      "software": [
        {
          "name": "Predict",
          "use": "Corrosion Rate"
        },
        {
          "name": "CorrShaman",
          "use": "Material Selection, Flow Regime, Cracking Vulnerability"
        },
        {
          "name": "DownholeSAT",
          "use": "Scaling Tendency"
        },
        {
          "name": "PipeSim",
          "use": "Flow Velocity, T/P Profile"
        }
      ],
      "formSchema": null
    },
    "D3-SM": {
      "sampleReport": "SM",
      "inputs": [
        "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)",
        "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)",
        "Water Analysis (Produced water, injection water, ETP)"
      ],
      "specimens": [
        "Sacle Inhibitor"
      ],
      "equipment": [
        "Stereo Microscope"
      ],
      "tests": [
        "surface morphology of failed area"
      ],
      "software": [
        {
          "name": "Predict",
          "use": "Corrosion Rate"
        },
        {
          "name": "CorrShaman",
          "use": "Material Selection, Flow Regime, Cracking Vulnerability"
        },
        {
          "name": "DownholeSAT",
          "use": "Scaling Tendency"
        },
        {
          "name": "PipeSim",
          "use": "Flow Velocity, T/P Profile"
        }
      ],
      "formSchema": null
    },
    "D3-PAINT": {
      "sampleReport": "Paint",
      "inputs": [
        "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)",
        "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)",
        "Chemical Dosing History (CI, Biocide, SI)"
      ],
      "specimens": [],
      "equipment": [
        "Auto Titrator"
      ],
      "tests": [
        "Water Analysis"
      ],
      "software": [
        {
          "name": "Predict",
          "use": "Corrosion Rate"
        },
        {
          "name": "CorrShaman",
          "use": "Material Selection, Flow Regime, Cracking Vulnerability"
        },
        {
          "name": "DownholeSAT",
          "use": "Scaling Tendency"
        },
        {
          "name": "PipeSim",
          "use": "Flow Velocity, T/P Profile"
        }
      ],
      "formSchema": null
    },
    "D3-CP": {
      "sampleReport": "CP",
      "inputs": [
        "Gas Analysis",
        "Jacket drawing"
      ],
      "specimens": [],
      "equipment": [
        "HPHT Autoclave / Potentiostat"
      ],
      "tests": [
        "Corrosion Rate prediction"
      ],
      "software": [
        {
          "name": "Predict",
          "use": "Corrosion Rate"
        },
        {
          "name": "CorrShaman",
          "use": "Material Selection, Flow Regime, Cracking Vulnerability"
        },
        {
          "name": "DownholeSAT",
          "use": "Scaling Tendency"
        },
        {
          "name": "PipeSim",
          "use": "Flow Velocity, T/P Profile"
        }
      ],
      "formSchema": null
    },
    "D4-CGL": {
      "sampleReport": "CGL",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)",
        "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)",
        "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-IGL": {
      "sampleReport": "IGL",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)",
        "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)",
        "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)",
        "Intermittent Cycle Data (Injection/cycle time, surface choke or controller settings, tubing/casing pressure chart)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-SRP": {
      "sampleReport": "SRP",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "SRP Data (Pumping unit, rod taper, pump size/depth, SPM, stroke length, prime mover, dynamometer card, fluid level)",
        "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)",
        "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [
        "GAP"
      ],
      "tests": [
        "Gas lift network optimization",
        "gas allocation"
      ],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-ESP": {
      "sampleReport": "ESP",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "ESP Data (Pump model & stages, motor HP/voltage/amps, cable, VSD frequency, intake pressure, ammeter chart)",
        "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)",
        "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [
        "PC-PUMP"
      ],
      "tests": [
        "PCP design and performance analysis"
      ],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-PCP": {
      "sampleReport": "PCP",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "PCP Data (Pump model, rotor/stator & elastomer, RPM, torque, drive head, rod/tubing configuration)",
        "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)",
        "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [
        "RODSTAR"
      ],
      "tests": [
        "SRP design",
        "wave-equation analysis & dynamometer diagnostics"
      ],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-PLF": {
      "sampleReport": "PLF",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)",
        "Intermittent Cycle Data (Injection/cycle time, surface choke or controller settings, tubing/casing pressure chart)",
        "Plunger Lift Data (Plunger type, tubing/casing pressure build-up cycles, GLR, line pressure, surface equipment)",
        "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)",
        "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)"
      ],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-JP": {
      "sampleReport": "JP",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)",
        "Jet Pump Data (Nozzle & throat size, power fluid type, rate & pressure, surface pump/power fluid system, return flow)",
        "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)",
        "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [
        "Software"
      ],
      "tests": [],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-GLNO": {
      "sampleReport": "GLNO",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)",
        "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)",
        "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [
        "PIPESIM"
      ],
      "tests": [
        "Well modelling",
        "nodal analysis",
        "GL design",
        "ESP/PCP",
        "T/P profile",
        "flow velocity"
      ],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D4-LMS": {
      "sampleReport": "LMS",
      "inputs": [
        "Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)",
        "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)",
        "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)",
        "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)",
        "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)",
        "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)",
        "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)",
        "Intermittent Cycle Data (Injection/cycle time, surface choke or controller settings, tubing/casing pressure chart)",
        "SRP Data (Pumping unit, rod taper, pump size/depth, SPM, stroke length, prime mover, dynamometer card, fluid level)",
        "ESP Data (Pump model & stages, motor HP/voltage/amps, cable, VSD frequency, intake pressure, ammeter chart)",
        "PCP Data (Pump model, rotor/stator & elastomer, RPM, torque, drive head, rod/tubing configuration)",
        "Plunger Lift Data (Plunger type, tubing/casing pressure build-up cycles, GLR, line pressure, surface equipment)",
        "Jet Pump Data (Nozzle & throat size, power fluid type, rate & pressure, surface pump/power fluid system, return flow)",
        "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)",
        "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)",
        "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"
      ],
      "specimens": [],
      "equipment": [
        "PROSPER",
        "GAP",
        "PC-PUMP",
        "RODSTAR"
      ],
      "tests": [
        "Well modelling",
        "nodal analysis",
        "GL design",
        "T/P profile",
        "flow velocity",
        "Gas lift network optimization",
        "gas allocation",
        "PCP design and performance analysis",
        "SRP design",
        "wave-equation analysis & dynamometer diagnostics"
      ],
      "software": [
        {
          "name": "PIPESIM",
          "use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity"
        },
        {
          "name": "PROSPER",
          "use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity"
        },
        {
          "name": "GAP",
          "use": "Gas lift network optimization, gas allocation"
        },
        {
          "name": "PC-PUMP",
          "use": "PCP design and performance analysis"
        },
        {
          "name": "RODSTAR",
          "use": "SRP design, wave-equation analysis & dynamometer diagnostics"
        }
      ],
      "formSchema": null
    },
    "D5-LH": {
      "sampleReport": "Attached",
      "inputs": [
        "Current production data",
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "Bathymetry data",
        "Fluid composition/Gas composition",
        "Equipment capacity/data sheets",
        "Pigging reports"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D5-SA": {
      "sampleReport": "Attached",
      "inputs": [
        "Current production data",
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "Bathymetry data",
        "Fluid composition/Gas composition",
        "Equipment capacity/data sheets",
        "Pigging reports"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D5-FH": {
      "sampleReport": "Attached",
      "inputs": [
        "Long term Production profile (Oil, Water and Gas)",
        "Current production data",
        "A-Lift details",
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "Back pressure at WHP",
        "Bathymetry data",
        "Fluid composition/Gas composition",
        "Equipment capacity/data sheets"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D5-FR": {
      "sampleReport": "(Prepared with MDT approach)",
      "inputs": [
        "Pressure-Production profile",
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "Bathymetry data",
        "Fluid composition/Gas composition",
        "Equipment capacity/data sheets"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D5-NA": {
      "sampleReport": "Attached",
      "inputs": [
        "Long term Production profile (Oil, Water and Gas)",
        "Current production data",
        "A-Lift details",
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "Bathymetry data",
        "FGS data(flowing gradient survey) of wells",
        "Fluid composition/Gas composition",
        "Equipment capacity/data sheets"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D5-TS": {
      "sampleReport": "Attached",
      "inputs": [
        "Pressure-Production profile",
        "Current production data",
        "A-Lift details",
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "Bathymetry data",
        "Fluid composition/Gas composition",
        "Equipment capacity/data sheets"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D5-VL": {
      "sampleReport": "(Prepared with MDT approach)",
      "inputs": [
        "Pressure-Production profile",
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "FGS data(flowing gradient survey) of wells",
        "Fluid composition/Gas composition"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D5-SU": {
      "sampleReport": "Prepared with MDT approach",
      "inputs": [
        "Crude oil Viscosity profile & API data",
        "Node Pressure and temperatures",
        "Bathymetry data",
        "Fluid composition/Gas composition",
        "Equipment capacity/data sheets"
      ],
      "specimens": [
        "Oil sample"
      ],
      "equipment": [],
      "tests": [],
      "software": [
        {
          "name": "OLGA",
          "use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc"
        },
        {
          "name": "PIPESIM",
          "use": "Nodal Analysis, Flow Assurance"
        },
        {
          "name": "Multiflash",
          "use": "Cost Estimation"
        },
        {
          "name": "Questor",
          "use": ""
        }
      ],
      "formSchema": null
    },
    "D6-SOIL-JKT": {
      "sampleReport": "SIR_PL",
      "inputs": [
        "Soil Samples collected from the borehole locations",
        "In-situ Test Results/ CPTU Raw Data",
        "On-board Lab test results",
        "Draft Soil Investigation Report",
        "Jack-up rig Specifications"
      ],
      "specimens": [
        "Soil Samples"
      ],
      "equipment": [
        "Temperature Regulated Water Bath"
      ],
      "tests": [
        "Hydrometer Analysis"
      ],
      "software": [
        {
          "name": "MATCAP",
          "use": "Mudmat Capacity Analysis"
        },
        {
          "name": "GALLOP",
          "use": "Pile Group Effect"
        },
        {
          "name": "COMPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        },
        {
          "name": "MAHAJACK",
          "use": "Jack-up Leg Penetration Analysis"
        },
        {
          "name": "Grapher",
          "use": "Graph Plotting"
        },
        {
          "name": "GRLWEAP",
          "use": "Pile Driveability Analysis"
        },
        {
          "name": "OPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        }
      ],
      "formSchema": null
    },
    "D6-SOIL-JU": {
      "sampleReport": "SIR_JCK",
      "inputs": [
        "Soil Samples collected from the borehole locations",
        "In-situ Test Results/ CPTU Raw Data",
        "On-board Lab test results",
        "Draft Soil Investigation Report",
        "Jack-up rig Specifications"
      ],
      "specimens": [],
      "equipment": [
        "Distillation Unit"
      ],
      "tests": [
        "Hydrometer Analysis"
      ],
      "software": [
        {
          "name": "MATCAP",
          "use": "Mudmat Capacity Analysis"
        },
        {
          "name": "GALLOP",
          "use": "Pile Group Effect"
        },
        {
          "name": "COMPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        },
        {
          "name": "MAHAJACK",
          "use": "Jack-up Leg Penetration Analysis"
        },
        {
          "name": "Grapher",
          "use": "Graph Plotting"
        },
        {
          "name": "GRLWEAP",
          "use": "Pile Driveability Analysis"
        },
        {
          "name": "OPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        }
      ],
      "formSchema": null
    },
    "D6-SOIL-MOOR": {
      "sampleReport": "SIR_MB",
      "inputs": [
        "Soil Samples collected from the borehole locations",
        "In-situ Test Results/ CPTU Raw Data",
        "On-board Lab test results",
        "Draft Soil Investigation Report",
        "Jack-up rig Specifications"
      ],
      "specimens": [],
      "equipment": [
        "Hydrometer"
      ],
      "tests": [
        "Hydrometer Analysis"
      ],
      "software": [
        {
          "name": "MATCAP",
          "use": "Mudmat Capacity Analysis"
        },
        {
          "name": "GALLOP",
          "use": "Pile Group Effect"
        },
        {
          "name": "COMPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        },
        {
          "name": "MAHAJACK",
          "use": "Jack-up Leg Penetration Analysis"
        },
        {
          "name": "Grapher",
          "use": "Graph Plotting"
        },
        {
          "name": "GRLWEAP",
          "use": "Pile Driveability Analysis"
        },
        {
          "name": "OPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        }
      ],
      "formSchema": null
    },
    "D6-SSA": {
      "sampleReport": "SSA",
      "inputs": [
        "Soil Samples collected from the borehole locations",
        "In-situ Test Results/ CPTU Raw Data",
        "On-board Lab test results",
        "Draft Soil Investigation Report",
        "Jack-up rig Specifications",
        "Final Soil Investigation Report"
      ],
      "specimens": [],
      "equipment": [
        "Casagrande's Apparatus",
        "Sieve Shaker/ Sieve sets"
      ],
      "tests": [
        "Liquid Limit Test",
        "Wet Seive Analysis"
      ],
      "software": [
        {
          "name": "MATCAP",
          "use": "Mudmat Capacity Analysis"
        },
        {
          "name": "GALLOP",
          "use": "Pile Group Effect"
        },
        {
          "name": "COMPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        },
        {
          "name": "MAHAJACK",
          "use": "Jack-up Leg Penetration Analysis"
        },
        {
          "name": "Grapher",
          "use": "Graph Plotting"
        },
        {
          "name": "GRLWEAP",
          "use": "Pile Driveability Analysis"
        },
        {
          "name": "OPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        }
      ],
      "formSchema": null
    },
    "D6-GEOTECH": {
      "sampleReport": "OTH",
      "inputs": [
        "Soil Samples collected from the borehole locations",
        "In-situ Test Results/ CPTU Raw Data",
        "On-board Lab test results",
        "Draft Soil Investigation Report",
        "Jack-up rig Specifications",
        "Final Soil Investigation Report"
      ],
      "specimens": [],
      "equipment": [
        "Heating Oven",
        "Sieve Shaker/ Sieve sets"
      ],
      "tests": [
        "For Sample Drying",
        "Wet Seive Analysis"
      ],
      "software": [
        {
          "name": "MATCAP",
          "use": "Mudmat Capacity Analysis"
        },
        {
          "name": "GALLOP",
          "use": "Pile Group Effect"
        },
        {
          "name": "COMPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        },
        {
          "name": "MAHAJACK",
          "use": "Jack-up Leg Penetration Analysis"
        },
        {
          "name": "Grapher",
          "use": "Graph Plotting"
        },
        {
          "name": "GRLWEAP",
          "use": "Pile Driveability Analysis"
        },
        {
          "name": "OPILE",
          "use": "Pile Capacity & Load Deformation Analysis"
        }
      ],
      "formSchema": null
    },
    "D6-SIA": {
      "sampleReport": "SIA",
      "inputs": [],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [],
      "formSchema": {
        "kind": "structure-sia",
        "categories": [
          "scheduled",
          "unscheduled"
        ],
        "platform": {
          "key": "platform",
          "label": "Jacket or platform name",
          "type": "text",
          "pattern": "^[A-Za-z0-9]+$",
          "hint": "Letters and numbers only, with no spaces or special characters."
        },
        "modifications": [
          {
            "code": "new_risers",
            "name": "New risers",
            "sampleReport": "PB",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of risers",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "size",
                "label": "Riser size in inch",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "service",
                "label": "Service of riser",
                "type": "text",
                "perItem": true
              },
              {
                "key": "riserType",
                "label": "Type of riser",
                "type": "select",
                "options": [
                  "Flexi",
                  "Normal",
                  "J/I Tube",
                  "Other"
                ],
                "perItem": true
              },
              {
                "key": "face",
                "label": "Face of the jacket",
                "type": "select",
                "options": [
                  "South",
                  "East",
                  "West",
                  "North"
                ],
                "perItem": true
              }
            ]
          },
          {
            "code": "deck_extension",
            "name": "Deck extension",
            "sampleReport": "TCPP",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of deck extensions",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "size",
                "label": "Size of deck extension in metres (length x breadth)",
                "type": "text",
                "perItem": true
              },
              {
                "key": "level",
                "label": "Deck extension level",
                "type": "select",
                "options": [
                  "Main deck",
                  "Cellar deck",
                  "Lower deck",
                  "Middle deck",
                  "Top deck"
                ],
                "perItem": true
              },
              {
                "key": "face",
                "label": "Location of deck extension",
                "type": "select",
                "options": [
                  "South",
                  "East",
                  "West",
                  "North"
                ],
                "perItem": true
              },
              {
                "key": "drawing",
                "label": "Marked-up drawing of the deck extension",
                "type": "upload",
                "perItem": true
              }
            ]
          },
          {
            "code": "clamp_on",
            "name": "Clamp-on",
            "sampleReport": "WI8",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of clamp-ons",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "size",
                "label": "Size of clamp-on conductors in inch",
                "type": "number",
                "repeat": false,
                "perItem": true
              }
            ]
          },
          {
            "code": "new_bridge",
            "name": "New bridge",
            "sampleReport": "B12-11",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "length",
                "label": "Bridge length in metres",
                "type": "number",
                "repeat": false,
                "perItem": false
              },
              {
                "key": "load",
                "label": "Intensity of bridge load in tonnes per metre",
                "type": "number",
                "repeat": false,
                "perItem": false
              },
              {
                "key": "tier",
                "label": "Tier of bridge",
                "type": "select",
                "options": [
                  "One tier",
                  "Two tier"
                ],
                "perItem": false
              },
              {
                "key": "deck",
                "label": "Deck on which the bridge is placed",
                "type": "select",
                "options": [
                  "Main deck",
                  "Cellar deck",
                  "Lower deck",
                  "Middle deck",
                  "Top deck"
                ],
                "perItem": false
              },
              {
                "key": "face",
                "label": "Location of the bridge on the deck",
                "type": "select",
                "options": [
                  "South",
                  "East",
                  "West",
                  "North",
                  "North West",
                  "South West",
                  "South East",
                  "North East"
                ],
                "perItem": false
              },
              {
                "key": "drawing",
                "label": "Marked-up drawing of the bridge support",
                "type": "upload",
                "perItem": false
              }
            ]
          },
          {
            "code": "new_equipment",
            "name": "New equipment without deck extension",
            "sampleReport": "B192-5",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "equipmentType",
                "label": "Type of equipment",
                "type": "text"
              },
              {
                "key": "footprint",
                "label": "Footprint of equipment in metres",
                "type": "text"
              },
              {
                "key": "location",
                "label": "Location of the new equipment",
                "type": "select",
                "options": [
                  "Main deck",
                  "Cellar deck",
                  "Lower deck",
                  "Middle deck",
                  "Top deck"
                ],
                "perItem": false
              },
              {
                "key": "load",
                "label": "Load intensity or load of the new equipment in tonnes",
                "type": "text"
              },
              {
                "key": "removed",
                "label": "Any existing facilities or load removed",
                "type": "text"
              },
              {
                "key": "drawing",
                "label": "Marked-up drawing of the new equipment layout",
                "type": "upload",
                "perItem": false
              }
            ]
          },
          {
            "code": "life_boat",
            "name": "Life boat",
            "sampleReport": "NLW",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of life boats",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "weight",
                "label": "Weight of life boat in kg",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "level",
                "label": "Life boat level",
                "type": "select",
                "options": [
                  "Main deck",
                  "Cellar deck",
                  "Lower deck",
                  "Middle deck",
                  "Top deck"
                ],
                "perItem": true
              },
              {
                "key": "capacity",
                "label": "Capacity of the new life boat",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "drawing",
                "label": "Marked-up drawing of the new life boat",
                "type": "upload",
                "perItem": true
              }
            ]
          },
          {
            "code": "new_crane",
            "name": "New crane",
            "sampleReport": "B-173-AB",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of cranes",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "capacity",
                "label": "Crane capacity in tonnes",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "level",
                "label": "Crane location level",
                "type": "select",
                "options": [
                  "Main deck",
                  "Cellar deck",
                  "Lower deck",
                  "Middle deck",
                  "Top deck"
                ],
                "perItem": true
              },
              {
                "key": "deadLoad",
                "label": "Crane dead load in tonnes",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "boomRest",
                "label": "Boom rest load in tonnes",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "drawing",
                "label": "Marked-up drawing of the crane and boom rest",
                "type": "upload",
                "perItem": true
              }
            ]
          },
          {
            "code": "enhanced_crane",
            "name": "Enhanced crane capacity",
            "sampleReport": "PL",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "capacity",
                "label": "Enhanced crane capacity in tonnes",
                "type": "number",
                "repeat": false,
                "perItem": false
              },
              {
                "key": "level",
                "label": "Crane location level",
                "type": "select",
                "options": [
                  "Main deck",
                  "Cellar deck",
                  "Lower deck",
                  "Middle deck",
                  "Top deck"
                ],
                "perItem": false
              },
              {
                "key": "load",
                "label": "Crane load in tonnes",
                "type": "number",
                "repeat": false,
                "perItem": false
              },
              {
                "key": "boomRest",
                "label": "Boom rest load in tonnes",
                "type": "number",
                "repeat": false,
                "perItem": false
              },
              {
                "key": "drawing",
                "label": "Marked-up drawing of the crane and boom rest",
                "type": "upload",
                "perItem": false
              }
            ]
          },
          {
            "code": "damage",
            "name": "Damage",
            "sampleReport": "NU",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "memo",
                "label": "Memo regarding damage from IMR",
                "type": "upload",
                "perItem": false
              }
            ]
          },
          {
            "code": "sump_caisson",
            "name": "External sump caisson",
            "sampleReport": "SHP",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of sump caissons",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "diameter",
                "label": "Diameter of sump caisson in inch",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "leg",
                "label": "Location of sump caisson \u2014 leg",
                "type": "text",
                "perItem": true
              }
            ]
          },
          {
            "code": "riser_protector",
            "name": "Riser protector",
            "sampleReport": "SP",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of riser protectors",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "face",
                "label": "Face of the jacket",
                "type": "select",
                "options": [
                  "South",
                  "East",
                  "West",
                  "North"
                ],
                "perItem": true
              }
            ]
          },
          {
            "code": "modular_rig",
            "name": "Modular rig",
            "sampleReport": "NLM-3",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "load",
                "label": "Modular rig load in tonnes",
                "type": "number",
                "repeat": false,
                "perItem": false
              },
              {
                "key": "drawing",
                "label": "Marked-up drawing of the modular rig",
                "type": "upload",
                "perItem": false
              }
            ]
          },
          {
            "code": "boat_landing",
            "name": "Boat landing",
            "sampleReport": "PK",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "count",
                "label": "Number of boat landings",
                "type": "number",
                "repeat": true,
                "perItem": false
              },
              {
                "key": "stage",
                "label": "Stage of boat landing",
                "type": "number",
                "repeat": false,
                "perItem": true
              },
              {
                "key": "face",
                "label": "Face of the jacket",
                "type": "select",
                "options": [
                  "South",
                  "East",
                  "West",
                  "North"
                ],
                "perItem": true
              }
            ]
          },
          {
            "code": "scour",
            "name": "Scour",
            "sampleReport": "B-55",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "memo",
                "label": "Memo regarding scour from IMR",
                "type": "upload",
                "perItem": false
              }
            ]
          },
          {
            "code": "other",
            "name": "Any other",
            "sampleReport": "HQ",
            "fields": [
              {
                "key": "scheme",
                "label": "Project or scheme under which the modification is proposed",
                "type": "text"
              },
              {
                "key": "brief",
                "label": "Brief about the modification, addition, or issue",
                "type": "textarea",
                "maxLength": 500
              },
              {
                "key": "attachment",
                "label": "Attachment",
                "type": "upload",
                "perItem": false
              }
            ]
          }
        ]
      }
    },
    "D6-LIFE": {
      "sampleReport": "BB",
      "inputs": [],
      "specimens": [],
      "equipment": [],
      "tests": [],
      "software": [],
      "formSchema": {
        "kind": "structure-life",
        "categories": [
          "scheduled",
          "unscheduled"
        ],
        "sampleReport": "BB",
        "fields": [
          {
            "key": "platform",
            "label": "Jacket or platform name",
            "type": "text",
            "pattern": "^[A-Za-z0-9]+$",
            "hint": "Letters and numbers only, with no spaces or special characters."
          },
          {
            "key": "scheme",
            "label": "Project or scheme under which the modification is proposed",
            "type": "text"
          }
        ]
      }
    }
  }
};
