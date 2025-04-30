#!/bin/bash

# Script to generate icons for the Selah PWA
# This script requires ImageMagick to be installed
# Install with: brew install imagemagick (on macOS)

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first."
    echo "On macOS: brew install imagemagick"
    echo "On Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Source image (high resolution)
SOURCE_IMAGE="public/icon-512.png"

# Output directory
OUTPUT_DIR="public/icons"

# Make sure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Define all the icon sizes needed
SIZES=(16 32 72 96 128 144 152 167 180 192 384 512)

echo "Generating icons for Selah PWA..."

# Generate icons for each size
for size in "${SIZES[@]}"; do
    echo "Creating ${size}x${size} icon..."
    convert "$SOURCE_IMAGE" -resize ${size}x${size} "$OUTPUT_DIR/icon-${size}.png"
done

# Create favicon.ico (16x16, 32x32)
echo "Creating favicon.ico..."
convert "$OUTPUT_DIR/icon-16.png" "$OUTPUT_DIR/icon-32.png" "$OUTPUT_DIR/favicon.ico"

# Copy the original icons to the new locations for backward compatibility
echo "Copying original icons for backward compatibility..."
cp "$SOURCE_IMAGE" "public/icons/icon-512.png"
cp "public/icon-192.png" "public/icons/icon-192.png"

echo "Done! Icons have been generated in $OUTPUT_DIR"
echo "Total icons created: $((${#SIZES[@]} + 1)) (plus favicon)" 