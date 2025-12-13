# Fix react-native-vector-icons codegen issue
# This script creates the missing codegen directory and CMakeLists.txt

$codegenDir = "node_modules\react-native-vector-icons\android\build\generated\source\codegen\jni"

# Create directory structure
New-Item -ItemType Directory -Force -Path $codegenDir | Out-Null

# Create CMakeLists.txt
$cmakeContent = @"
# Stub CMakeLists.txt for react-native-vector-icons
# This library doesn't use codegen, but CMake expects this target
cmake_minimum_required(VERSION 3.13)

# Create a dummy source file
file(WRITE "`${CMAKE_CURRENT_BINARY_DIR}/dummy.cpp" "// Dummy file for react-native-vector-icons codegen stub`n")

# Create a static library with the dummy source
add_library(react_codegen_RNVectorIconsSpec STATIC
    "`${CMAKE_CURRENT_BINARY_DIR}/dummy.cpp"
)
"@

Set-Content -Path "$codegenDir\CMakeLists.txt" -Value $cmakeContent -Encoding UTF8

Write-Host "Created codegen stub for react-native-vector-icons" -ForegroundColor Green

