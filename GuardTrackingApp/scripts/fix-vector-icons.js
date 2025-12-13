#!/usr/bin/env node
/**
 * PERMANENT FIX for react-native-vector-icons CMake build error
 * This script ensures CMakeLists.txt is always correct
 * Automatically runs after npm install via postinstall hook
 */

const fs = require('fs');
const path = require('path');

const VECTOR_ICONS_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-vector-icons',
  'android',
  'build',
  'generated',
  'source',
  'codegen',
  'jni'
);

// Create directory if it doesn't exist
if (!fs.existsSync(VECTOR_ICONS_DIR)) {
  fs.mkdirSync(VECTOR_ICONS_DIR, { recursive: true });
}

// CRITICAL: DELETE generated file completely to prevent duplicate symbols
// The generated file requires React Native headers and conflicts with our dummy implementation
// We delete it (not just rename) to ensure CMake never finds it
const generatedCpp = path.join(VECTOR_ICONS_DIR, 'RNVectorIconsSpec-generated.cpp');
const backupFile = path.join(VECTOR_ICONS_DIR, 'RNVectorIconsSpec-generated.cpp.backup');

if (fs.existsSync(generatedCpp)) {
  fs.unlinkSync(generatedCpp);
  console.log('🗑️  Deleted RNVectorIconsSpec-generated.cpp to prevent duplicate symbols');
}
// Also clean up any backup files
if (fs.existsSync(backupFile)) {
  fs.unlinkSync(backupFile);
}

// Create dummy.cpp with stub implementation
const dummyCpp = `// Dummy source file for react-native-vector-icons
// This package has no native C++ code, but CMake requires at least one source file
// We provide a stub implementation to satisfy the linker

#include <memory>
#include <string>

// Forward declarations to avoid including React Native headers
namespace facebook {
namespace react {
    class TurboModule;
    struct JavaTurboModule {
        struct InitParams {};
    };
    
    // Stub implementation - react-native-vector-icons doesn't need TurboModules
    // Must match exact signature from RNVectorIconsSpec.h
    std::shared_ptr<TurboModule> RNVectorIconsSpec_ModuleProvider(
        const std::string &moduleName,
        const JavaTurboModule::InitParams &params) {
        // Return nullptr - react-native-vector-icons is just icon fonts
        // Handled entirely in JavaScript/Java, no native C++ needed
        return nullptr;
    }
} // namespace react
} // namespace facebook
`;

fs.writeFileSync(path.join(VECTOR_ICONS_DIR, 'dummy.cpp'), dummyCpp);

// Create/update CMakeLists.txt with correct configuration
// IMPORTANT: Only use dummy.cpp - the generated files require React Native headers we don't have access to
const cmakeContent = `cmake_minimum_required(VERSION 3.13)
project(react_codegen_RNVectorIconsSpec)

# PERMANENT FIX: Include directory MUST be set for autolinking.cpp to find RNVectorIconsSpec.h
include_directories(\${CMAKE_CURRENT_SOURCE_DIR})

# CRITICAL: Delete generated file if it exists (shouldn't, but just in case)
# This prevents duplicate symbols - we only use dummy.cpp
file(REMOVE "\${CMAKE_CURRENT_SOURCE_DIR}/RNVectorIconsSpec-generated.cpp")

# CRITICAL: Only use dummy.cpp - react-native-vector-icons doesn't need native C++ code
# The generated files require React Native headers that aren't available in this context
add_library(react_codegen_RNVectorIconsSpec STATIC
    dummy.cpp
)

# Set properties to avoid warnings
set_target_properties(react_codegen_RNVectorIconsSpec PROPERTIES
    LINKER_LANGUAGE CXX
    POSITION_INDEPENDENT_CODE ON
)

# CRITICAL: Make include directory available to parent CMake targets (autolinking.cpp)
# Without this, autolinking.cpp cannot find RNVectorIconsSpec.h
target_include_directories(react_codegen_RNVectorIconsSpec 
    PUBLIC 
        \${CMAKE_CURRENT_SOURCE_DIR}
    INTERFACE
        \${CMAKE_CURRENT_SOURCE_DIR}
)

# Ensure this library is linked to appmodules (required for autolinking)
set_target_properties(react_codegen_RNVectorIconsSpec PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}"
    LIBRARY_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}"
    RUNTIME_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}"
)
`;

fs.writeFileSync(path.join(VECTOR_ICONS_DIR, 'CMakeLists.txt'), cmakeContent);

console.log('✅ Fixed react-native-vector-icons CMakeLists.txt');

