export interface ToolItem {
  name: string;
  path?: string | null;
  version?: string | null;
  is_available: boolean;
}

export interface CCppToolchainInfo {
  c_compiler: ToolItem;
  cpp_compiler: ToolItem;
  alt_c_compiler: ToolItem;
  alt_cpp_compiler: ToolItem;
  build_cmake: ToolItem;
  build_make: ToolItem;
  build_ninja: ToolItem;
  build_meson: ToolItem;
  debugger_gdb: ToolItem;
  debugger_lldb: ToolItem;
  formatter_clang_format: ToolItem;
  linter_clang_tidy: ToolItem;
  linter_cppcheck: ToolItem;
  default_standard: string;
}

export interface CCppProjectDetails {
  is_cpp: boolean;
  is_c: boolean;
  build_system: string;
  detected_standard: string;
  build_command: string;
  test_command: string;
  has_clang_format: boolean;
  has_compile_commands: boolean;
}
