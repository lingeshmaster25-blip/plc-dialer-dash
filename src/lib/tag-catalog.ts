// Tag catalog (mirror of server/src/tagCatalog.js) — drives the PLC Tags panel.
export type TagType = "bool" | "int" | "real";
export type TagDef = { name: string; address: string; group: string; type: TagType };

export const TAGS: TagDef[] = [
  // Force Buttons
  { name: "Bin_Call",            address: "M0.0",      group: "Force Buttons",    type: "bool" },  // bin call
  { name: "Stop_PB",             address: "M0.1",      group: "Force Buttons",    type: "bool" },
  { name: "Reset_PB",            address: "M0.2",      group: "Force Buttons",    type: "bool" },
  { name: "M_Run",               address: "M0.5",      group: "Force Buttons",    type: "bool" },
  { name: "Tray_Call",           address: "M0.6",      group: "Force Buttons",    type: "bool" },  // tray call
  { name: "Bin_Return_Home",     address: "M6.0",      group: "Force Buttons",    type: "bool" },  // bin return home
  { name: "Tray_Return_Home",    address: "M0.7",      group: "Force Buttons",    type: "bool" },  // tray return home
  // System
  { name: "H_run",               address: "M6.1",      group: "System",           type: "bool" },
  { name: "Bin_store_complete",  address: "M8.2",      group: "System",           type: "bool" },
  { name: "Tray_store_complete", address: "M2.5",      group: "System",           type: "bool" },
  { name: "Tray_Run",            address: "M6.2",      group: "System",           type: "bool" },
  { name: "Tray_Store_Run",      address: "M2.1",      group: "System",           type: "bool" },
  { name: "Manual_Run",          address: "M2.7",      group: "System",           type: "bool" },
  { name: "Manual_Enable",       address: "M2.6",      group: "System",           type: "bool" },
  // Motor Status
  { name: "Y_InPos",             address: "M10.0",     group: "Motor Status",     type: "bool" },
  { name: "X_InPos",             address: "M10.1",     group: "Motor Status",     type: "bool" },
  { name: "A_InPos",             address: "M10.2",     group: "Motor Status",     type: "bool" },
  { name: "B_InPos",             address: "M10.3",     group: "Motor Status",     type: "bool" },
  { name: "Z_InPos",             address: "M10.4",     group: "Motor Status",     type: "bool" },
  // Outputs
  { name: "Door_Open_CMD",       address: "Q0.0",      group: "Outputs",          type: "bool" },
  { name: "Door_Close_CMD",      address: "Q0.1",      group: "Outputs",          type: "bool" },
  { name: "Y_Fwd",               address: "Q0.2",      group: "Outputs",          type: "bool" },
  { name: "Y_Rev",               address: "Q0.3",      group: "Outputs",          type: "bool" },
  { name: "X_Fwd",               address: "Q0.4",      group: "Outputs",          type: "bool" },
  { name: "X_Rev",               address: "Q0.5",      group: "Outputs",          type: "bool" },
  { name: "A_Fwd",               address: "Q0.6",      group: "Outputs",          type: "bool" },
  { name: "A_Rev",               address: "Q0.7",      group: "Outputs",          type: "bool" },
  { name: "B_Fwd",               address: "Q1.0",      group: "Outputs",          type: "bool" },
  { name: "B_Rev",               address: "Q1.1",      group: "Outputs",          type: "bool" },
  { name: "Z_Up",                address: "Q1.2",      group: "Outputs",          type: "bool" },
  { name: "Z_Down",              address: "Q1.3",      group: "Outputs",          type: "bool" },
  { name: "Cycle_Complete",      address: "Q1.5",      group: "Outputs",          type: "bool" },
  // Limit Switches
  { name: "Y_Top_LS",            address: "I0.0",      group: "Limit Switches",   type: "bool" },
  { name: "Y_Bottom_LS",         address: "I0.1",      group: "Limit Switches",   type: "bool" },
  { name: "X_Left_LS",           address: "I0.2",      group: "Limit Switches",   type: "bool" },
  { name: "X_Right_LS",          address: "I0.3",      group: "Limit Switches",   type: "bool" },
  { name: "Z_Top_LS",            address: "I0.4",      group: "Limit Switches",   type: "bool" },
  { name: "Z_Bottom_LS",         address: "I0.5",      group: "Limit Switches",   type: "bool" },
  { name: "Y_Home_LS",           address: "I0.6",      group: "Limit Switches",   type: "bool" },
  { name: "Tray_Out_LS",         address: "I0.7",      group: "Limit Switches",   type: "bool" },
  { name: "Control_Panel",       address: "I1.0",      group: "Limit Switches",   type: "bool" },
  { name: "Maintenance_Door",    address: "I1.1",      group: "Limit Switches",   type: "bool" },
  { name: "Door_Open_LS",        address: "I1.2",      group: "Limit Switches",   type: "bool" },
  { name: "Door_Close_LS",       address: "I1.3",      group: "Limit Switches",   type: "bool" },
  // Buttons
  // Sensors
  { name: "Ext_Aisle_Area_S1",   address: "I1.4",      group: "Sensors",          type: "bool" },
  { name: "Ext_Aisle_Area_S2",   address: "I1.5",      group: "Sensors",          type: "bool" },
  { name: "Ext_Aisle_Area_S3",   address: "I2.0",      group: "Sensors",          type: "bool" },
  { name: "Ext_Aisle_Area_S4",   address: "I2.1",      group: "Sensors",          type: "bool" },
  { name: "Finger_Left",         address: "I2.2",      group: "Sensors",          type: "bool" },
  { name: "Finger_Right",        address: "I2.3",      group: "Sensors",          type: "bool" },
  { name: "Tray_Pos_S1",         address: "I2.4",      group: "Sensors",          type: "bool" },
  { name: "Tray_Pos_S2",         address: "I2.5",      group: "Sensors",          type: "bool" },
  { name: "Fork_LH",             address: "I2.6",      group: "Sensors",          type: "bool" },
  { name: "Fork_RH",             address: "I2.7",      group: "Sensors",          type: "bool" },
  { name: "Bin_Confirm_Sensor",  address: "I3.0",      group: "Sensors",          type: "bool" },
  { name: "Bin_spa_Left",        address: "I3.1",      group: "Sensors",          type: "bool" },
  { name: "Bin_spa_Right",       address: "I3.2",      group: "Sensors",          type: "bool" },
  { name: "Light_Grid_BinMax",   address: "I3.3",      group: "Sensors",          type: "bool" },
  { name: "Load_Cell_Overload",  address: "I3.4",      group: "Sensors",          type: "bool" },
  // Alarms
  { name: "Over_load",               address: "M8.0", group: "Alarms", type: "bool" },  // tray over load
  { name: "Bin_over_Height",         address: "M8.1", group: "Alarms", type: "bool" },
  { name: "Tray_Misalignment",       address: "M2.3", group: "Alarms", type: "bool" },  // tray misalignment in aisle area
  { name: "Maintenance_Store_Open",  address: "M7.2", group: "Alarms", type: "bool" },  // maintenance store in open condition
  { name: "Y_Over_Travel",           address: "M4.7", group: "Alarms", type: "bool" },
  { name: "Z_Over_Travel",           address: "M5.0", group: "Alarms", type: "bool" },
  { name: "X_Over_Travel",           address: "M5.1", group: "Alarms", type: "bool" },
  { name: "Control_Panel_Door_Open", address: "M7.1", group: "Alarms", type: "bool" },
  { name: "Extractor_Misalignment",  address: "M6.6", group: "Alarms", type: "bool" },  // extractor misalignment & unbalanced
  { name: "Emergency_Stop",          address: "I3.5", group: "Alarms", type: "bool" },  // emergency stop pressed
  { name: "Bin_Pressed_Left",        address: "M7.3", group: "Alarms", type: "bool" },
  { name: "Bin_Pressed_Right",       address: "M7.4", group: "Alarms", type: "bool" },
  { name: "Y_Home_Not_Reached",      address: "M7.5", group: "Alarms", type: "bool" },
  { name: "Tray_Out_Not_Reached",    address: "M7.6", group: "Alarms", type: "bool" },
  { name: "Door_Open_Not_Reached",   address: "M7.7", group: "Alarms", type: "bool" },
  { name: "Door_Close_Not_Reached",  address: "M8.3", group: "Alarms", type: "bool" },
  { name: "Fault_Alarm",             address: "Q1.6", group: "Alarms", type: "bool" },
  { name: "Bin_Not_Seated",          address: "M8.4", group: "Alarms", type: "bool" },
  { name: "Tray_Not_Seated",         address: "M8.5", group: "Alarms", type: "bool" },
  // Stage Bins
  { name: "DB_Input_BIN1",       address: "DB3.DBW10", group: "Stage Bins",       type: "int" },
  { name: "DB_Input_BIN2",       address: "DB3.DBW12", group: "Stage Bins",       type: "int" },
  { name: "DB_Input_BIN3",       address: "DB3.DBW14", group: "Stage Bins",       type: "int" },
  { name: "DB_Input_BIN4",       address: "DB3.DBW16", group: "Stage Bins",       type: "int" },
  { name: "DB_Input_BIN5",       address: "DB3.DBW18", group: "Stage Bins",       type: "int" },
  // Target Positions
  { name: "Y_Target",            address: "DB4.DBD0",  group: "Target Positions", type: "real" },
  { name: "X_Target",            address: "DB4.DBD4",  group: "Target Positions", type: "real" },
  { name: "A_Target",            address: "DB4.DBD8",  group: "Target Positions", type: "real" },
  { name: "B_Target",            address: "DB4.DBD12", group: "Target Positions", type: "real" },
  { name: "Z_Target",            address: "DB4.DBD16", group: "Target Positions", type: "real" },
  // Actual Positions
  { name: "Y_ActualPos",         address: "DB4.DBD20", group: "Actual Positions", type: "real" },
  { name: "X_ActualPos",         address: "DB4.DBD24", group: "Actual Positions", type: "real" },
  { name: "B_ActualPos",         address: "DB4.DBD28", group: "Actual Positions", type: "real" },
  { name: "Z_ActualPos",         address: "DB4.DBD32", group: "Actual Positions", type: "real" },
  { name: "A_ActualPos",         address: "DB4.DBD36", group: "Actual Positions", type: "real" },
  // Watch Values
  { name: "Step",                address: "MW100",     group: "Watch Values",     type: "int" },
  { name: "CurrentStage",        address: "MW12",      group: "Watch Values",     type: "int" },
  { name: "SelectedBin",         address: "MW14",      group: "Watch Values",     type: "int" },
  { name: "RackNo",              address: "MW16",      group: "Watch Values",     type: "int" },
  { name: "RackBin",             address: "MW18",      group: "Watch Values",     type: "int" },
  // Rack Positions (DB11 "DB_Parameter")
  { name: "Rack_pos_1",          address: "DB11.DBW0",  group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_2",          address: "DB11.DBW2",  group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_3",          address: "DB11.DBW4",  group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_4",          address: "DB11.DBW6",  group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_5",          address: "DB11.DBW8",  group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_6",          address: "DB11.DBW10", group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_7",          address: "DB11.DBW12", group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_8",          address: "DB11.DBW14", group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_9",          address: "DB11.DBW16", group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_10",         address: "DB11.DBW18", group: "Rack Positions",   type: "int" },
  { name: "Rack_pos_11",         address: "DB11.DBW20", group: "Rack Positions",   type: "int" },
  // Bin Positions (DB11 "DB_Parameter")
  { name: "Bin_Pos_1",           address: "DB11.DBW22", group: "Bin Positions",    type: "int" },
  { name: "Bin_Pos_2",           address: "DB11.DBW24", group: "Bin Positions",    type: "int" },
  { name: "Bin_Pos_3",           address: "DB11.DBW26", group: "Bin Positions",    type: "int" },
  { name: "Bin_Pos_4",           address: "DB11.DBW28", group: "Bin Positions",    type: "int" },
  { name: "Bin_Pos_5",           address: "DB11.DBW30", group: "Bin Positions",    type: "int" },
  // Axis Parameters (DB11 "DB_Parameter")
  { name: "B_Home_Pos",          address: "DB11.DBW32", group: "Axis Parameters",  type: "int" },
  { name: "B_Unload_RH_Pos",     address: "DB11.DBW34", group: "Axis Parameters",  type: "int" },
  { name: "B_LH_Tray_Pos",       address: "DB11.DBW36", group: "Axis Parameters",  type: "int" },
  { name: "Z_Home_Pos",          address: "DB11.DBW38", group: "Axis Parameters",  type: "int" },
  { name: "Z_Lift_Step1",        address: "DB11.DBW40", group: "Axis Parameters",  type: "int" },
  { name: "Z_Lift_Step2",        address: "DB11.DBW42", group: "Axis Parameters",  type: "int" },
  { name: "A_Home",              address: "DB11.DBW44", group: "Axis Parameters",  type: "int" },
  { name: "A_LH_Retrivel",       address: "DB11.DBW46", group: "Axis Parameters",  type: "int" },
  { name: "A_RH_Retrivel",       address: "DB11.DBW48", group: "Axis Parameters",  type: "int" },
  { name: "Y_Home",              address: "DB11.DBW50", group: "Axis Parameters",  type: "int" },
];

export const TAG_GROUPS = Array.from(new Set(TAGS.map((t) => t.group)));
