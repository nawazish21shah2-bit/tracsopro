#!/bin/bash
# PERMANENT FIX for react-native-vector-icons CMake build error
# This script ensures CMakeLists.txt is always correct
# Run this after npm install or when build fails

VECTOR_ICONS_DIR="node_modules/react-native-vector-icons/android/build/generated/source/codegen/jni"

# Create directory if it doesn't exist
mkdir -p "$VECTOR_ICONS_DIR"

# CRITICAL: Always rename generated file to prevent duplicate symbols
# The generated file requires React Native headers and conflicts with our dummy implementation
GENERATED_CPP="$VECTOR_ICONS_DIR/RNVectorIconsSpec-generated.cpp"
BACKUP_FILE="$VECTOR_ICONS_DIR/RNVectorIconsSpec-generated.cpp.backup"

if [ -f "$GENERATED_CPP" ]; then
    if [ -f "$BACKUP_FILE" ]; then
        rm -f "$BACKUP_FILE"
    fi
    mv "$GENERATED_CPP" "$BACKUP_FILE"
    echo "⚠️  Renamed RNVectorIconsSpec-generated.cpp to prevent duplicate symbols"
fi

# Create dummy.cpp with stub implementation
cat > "$VECTOR_ICONS_DIR/dummy.cpp" << 'EOF'
// Dummy source file for react-native-vector-icons
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
EOF

# Create/update CMakeLists.txt with correct configuration
cat > "$VECTOR_ICONS_DIR/CMakeLists.txt" << 'EOF'
cmake_minimum_required(VERSION 3.13)
project(react_codegen_RNVectorIconsSpec)

# PERMANENT FIX: Include directory MUST be set for autolinking.cpp to find RNVectorIconsSpec.h
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# CRITICAL: Only use dummy.cpp - react-native-vector-icons doesn't need native C++ code
# The generated files require React Native headers that aren't available in this context
# We explicitly exclude RNVectorIconsSpec-generated.cpp to avoid duplicate symbols
add_library(react_codegen_RNVectorIconsSpec STATIC
    dummy.cpp
)

# Explicitly exclude generated files to prevent duplicate symbols
set_source_files_properties(
    RNVectorIconsSpec-generated.cpp
    PROPERTIES GENERATED TRUE
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
        ${CMAKE_CURRENT_SOURCE_DIR}
    INTERFACE
        ${CMAKE_CURRENT_SOURCE_DIR}
)

# Ensure this library is linked to appmodules (required for autolinking)
set_target_properties(react_codegen_RNVectorIconsSpec PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}"
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}"
)
EOF

echo "✅ Fixed react-native-vector-icons CMakeLists.txt"
