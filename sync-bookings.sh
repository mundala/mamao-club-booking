#!/bin/bash
# Sync exported Mamao Club booking CSVs to Google Drive
# Usage: ./sync-bookings.sh [path-to-csv]
#
# If no path given, syncs all mamao_bookings_*.csv from ~/Downloads

REMOTE="mygdrive:mamao-backups"

if [ -n "$1" ]; then
  rclone copy "$1" "$REMOTE" --progress
else
  shopt -s nullglob
  files=(~/Downloads/mamao_bookings_*.csv)
  if [ ${#files[@]} -eq 0 ]; then
    echo "No mamao_bookings_*.csv files found in ~/Downloads"
    exit 1
  fi
  for f in "${files[@]}"; do
    echo "Uploading: $(basename "$f")"
    rclone copy "$f" "$REMOTE" --progress
  done
fi

echo "Done. Files on Drive:"
rclone ls "$REMOTE" --include "mamao_bookings_*.csv"
