#!/bin/bash
# Quick booking creator for Mamao Club
# Usage: ./book.sh "Name" "Phone" "Email" Guests "Date" "Time" "Notes"
# Example: ./book.sh "John Smith" "0412345678" "john@example.com" 4 "2026-03-28" "21:00" "Birthday"

API="https://book.mamaogang.com"

if [ $# -lt 6 ]; then
  echo "MAMAO CLUB — Quick Booking"
  echo ""
  read -p "Name: " NAME
  read -p "Phone: " PHONE
  read -p "Email: " EMAIL
  read -p "Guests: " GUESTS
  read -p "Date (YYYY-MM-DD): " DATE
  read -p "Time (HH:MM): " TIME
  read -p "Notes (optional): " NOTES
else
  NAME="$1"
  PHONE="$2"
  EMAIL="$3"
  GUESTS="$4"
  DATE="$5"
  TIME="$6"
  NOTES="${7:-}"
fi

echo ""
echo "Booking: $NAME | $GUESTS guests | $DATE $TIME"
echo "Contact: $PHONE | $EMAIL"
[ -n "$NOTES" ] && echo "Notes: $NOTES"
echo ""

# Create booking
RESULT=$(curl -s -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$NAME\",
    \"phone\": \"$PHONE\",
    \"email\": \"$EMAIL\",
    \"guests\": $GUESTS,
    \"date\": \"$DATE\",
    \"time\": \"$TIME\",
    \"notes\": \"$NOTES\"
  }")

REF=$(echo "$RESULT" | grep -o '"ref":"[^"]*"' | cut -d'"' -f4)
TOKEN=$(echo "$RESULT" | grep -o '"cancelToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$REF" ]; then
  echo "FAILED: $RESULT"
  exit 1
fi

echo "Created: $REF"

# Send confirmation email
EMAIL_RESULT=$(curl -s -X POST "$API/api/send-confirmation" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$NAME\",
    \"email\": \"$EMAIL\",
    \"guests\": $GUESTS,
    \"date\": \"$DATE\",
    \"time\": \"$TIME\",
    \"ref\": \"$REF\",
    \"cancelToken\": \"$TOKEN\"
  }")

echo "Email sent: $EMAIL_RESULT"
echo ""
echo "Done! Booking $REF confirmed."
