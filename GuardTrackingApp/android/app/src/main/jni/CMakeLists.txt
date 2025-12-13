# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Custom CMakeLists.txt to use our custom OnLoad.cpp
# This fixes the AppSpec.h redefinition issue

cmake_minimum_required(VERSION 3.13)

# Define the library name here.
project(appmodules)

# This file includes all the necessary to let you build your application with the New Architecture.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)


