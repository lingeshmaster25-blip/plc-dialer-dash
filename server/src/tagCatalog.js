/**
 * Tag catalog derived from PLCTags.xlsx.
 * Each entry: { name, address, group, type, area, byte, bit?, length? }
 *
 * Address syntax used here mirrors TIA Portal:
 *   I0.x / Q0.x / M0.x  — single bit
 *   MWxx                — 16-bit word in M area starting at byte xx
 *   DB<n>.DBWxx         — 16-bit word in DB<n>
 *   DB<n>.DBDxx         — 32-bit dword (REAL) in DB<n>
 */

const TAGS = [
  // --- Force Buttons (M0.x) ---
  { name: "Start_PB",            address: "M0.0",      group: "Force Buttons",   type: "bool" },
  { name: "Stop_PB",             address: "M0.1",      group: "Force Buttons",   type: "bool" },
  { name: "Reset_PB",            address: "M0.2",      group: "Force Buttons",   type: "bool" },
  { name: "M_Run",               address: "M0.5",      group: "Force Buttons",   type: "bool" },
  { name: "SideSelect",          address: "M0.6",      group: "Force Buttons",   type: "bool" },

  // --- Motor In-Position flags (M10.x) ---
  { name: "Y_InPos",             address: "M10.0",     group: "Motor Status",    type: "bool" },
  { name: "X_InPos",             address: "M10.1",     group: "Motor Status",    type: "bool" },
  { name: "A_InPos",             address: "M10.2",     group: "Motor Status",    type: "bool" },
  { name: "B_InPos",             address: "M10.3",     group: "Motor Status",    type: "bool" },
  { name: "Z_InPos",             address: "M10.4",     group: "Motor Status",    type: "bool" },

  // --- Outputs (QB0 / QB1) ---
  { name: "Door_Open_CMD",       address: "Q0.0",      group: "Outputs",         type: "bool" },
  { name: "Door_Close_CMD",      address: "Q0.1",      group: "Outputs",         type: "bool" },
  { name: "Y_Fwd",               address: "Q0.2",      group: "Outputs",         type: "bool" },
  { name: "Y_Rev",               address: "Q0.3",      group: "Outputs",         type: "bool" },
  { name: "X_Fwd",               address: "Q0.4",      group: "Outputs",         type: "bool" },
  { name: "X_Rev",               address: "Q0.5",      group: "Outputs",         type: "bool" },
  { name: "A_Fwd",               address: "Q0.6",      group: "Outputs",         type: "bool" },
  { name: "A_Rev",               address: "Q0.7",      group: "Outputs",         type: "bool" },
  { name: "B_Fwd",               address: "Q1.0",      group: "Outputs",         type: "bool" },
  { name: "B_Rev",               address: "Q1.1",      group: "Outputs",         type: "bool" },
  { name: "Z_Up",                address: "Q1.2",      group: "Outputs",         type: "bool" },
  { name: "Cycle_Complete",      address: "Q1.5",      group: "Outputs",         type: "bool" },
  { name: "Fault_Alarm",         address: "Q1.6",      group: "Outputs",         type: "bool" },

  // --- Sensor inputs ---
  { name: "Emergency_Stop",      address: "I1.0",      group: "Sensors",         type: "bool" },  // FIX: was I0.3 (duplicate with Door_Open_LS)
  { name: "Door_Open_LS",        address: "I0.3",      group: "Sensors",         type: "bool" },
  { name: "Door_Close_LS",       address: "I0.4",      group: "Sensors",         type: "bool" },
  { name: "Tray_Out_LS",         address: "I0.6",      group: "Sensors",         type: "bool" },
  { name: "Ext_Aisle_Area_S1",   address: "I0.5",      group: "Sensors",         type: "bool" },
  { name: "Ext_Aisle_Area_S2",   address: "I0.7",      group: "Sensors",         type: "bool" },
  { name: "Load_Cell_Overload",  address: "I1.1",      group: "Sensors",         type: "bool" },
  { name: "Light_Grid_BinMax",   address: "I1.2",      group: "Sensors",         type: "bool" },
  { name: "Tray_Pos_S1",         address: "I1.3",      group: "Sensors",         type: "bool" },
  { name: "Tray_Pos_S2",         address: "I1.4",      group: "Sensors",         type: "bool" },
  { name: "Bin_Confirm_Sensor",  address: "I1.5",      group: "Sensors",         type: "bool" },
  { name: "Ext_Aisle_Area_S3",   address: "I1.6",      group: "Sensors",         type: "bool" },
  { name: "Ext_Aisle_Area_S4",   address: "I1.7",      group: "Sensors",         type: "bool" },
  { name: "Tray_Misalignment",   address: "M2.3",      group: "Sensors",         type: "bool" },

  // --- Stage bins (DB3 words) ---
  { name: "Stage1_Bin",          address: "DB3.DBW0",  group: "Stage Bins",      type: "int" },
  { name: "Stage2_Bin",          address: "DB3.DBW2",  group: "Stage Bins",      type: "int" },
  { name: "Stage3_Bin",          address: "DB3.DBW4",  group: "Stage Bins",      type: "int" },
  { name: "Stage4_Bin",          address: "DB3.DBW6",  group: "Stage Bins",      type: "int" },
  { name: "Stage5_Bin",          address: "DB3.DBW8",  group: "Stage Bins",      type: "int" },

  // --- Target positions (DB4 REALs) ---
  { name: "Y_Target",            address: "DB4.DBD0",  group: "Target Positions", type: "real" },
  { name: "X_Target",            address: "DB4.DBD4",  group: "Target Positions", type: "real" },
  { name: "A_Target",            address: "DB4.DBD8",  group: "Target Positions", type: "real" },
  { name: "B_Target",            address: "DB4.DBD12", group: "Target Positions", type: "real" },
  { name: "Z_Target",            address: "DB4.DBD16", group: "Target Positions", type: "real" },

  // --- Actual positions (DB4 REALs) — FIX: reordered so addresses ascend Y→X→A→B→Z ---
  { name: "Y_ActualPos",         address: "DB4.DBD20", group: "Actual Positions", type: "real" },
  { name: "X_ActualPos",         address: "DB4.DBD24", group: "Actual Positions", type: "real" },
  { name: "A_ActualPos",         address: "DB4.DBD28", group: "Actual Positions", type: "real" },
  { name: "B_ActualPos",         address: "DB4.DBD32", group: "Actual Positions", type: "real" },
  { name: "Z_ActualPos",         address: "DB4.DBD36", group: "Actual Positions", type: "real" },

  // --- Watch words (M area) ---
  { name: "Step",                address: "MW100",     group: "Watch Values",    type: "int" },
  { name: "CurrentStage",        address: "MW12",      group: "Watch Values",    type: "int" },
  { name: "SelectedBin",         address: "MW14",      group: "Watch Values",    type: "int" },
  { name: "RackNo",              address: "MW16",      group: "Watch Values",    type: "int" },
  { name: "RackBin",             address: "MW18",      group: "Watch Values",    type: "int" },
];

// Parse an address string into a decode descriptor.
function parseAddress(addr) {
  let m;
  if ((m = addr.match(/^([IQM])(\d+)\.(\d+)$/))) {
    return { kind: "bit", area: m[1], byte: +m[2], bit: +m[3] };
  }
  if ((m = addr.match(/^MW(\d+)$/))) {
    return { kind: "word", area: "M", byte: +m[1] };
  }
  if ((m = addr.match(/^DB(\d+)\.DBW(\d+)$/))) {
    return { kind: "word", area: "DB", db: +m[1], byte: +m[2] };
  }
  if ((m = addr.match(/^DB(\d+)\.DBD(\d+)$/))) {
    return { kind: "dword", area: "DB", db: +m[1], byte: +m[2] };
  }
  throw new Error(`Unsupported address: ${addr}`);
}

module.exports = { TAGS, parseAddress };
