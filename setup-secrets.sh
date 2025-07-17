#!/bin/bash

# Create secrets directory if it doesn't exist
mkdir -p secrets

# Set secure permissions
chmod 700 secrets

# Create secret files with proper permissions
for secret in db_connection_string aws_access_key_id aws_secret_access_key minio_access_key minio_secret_key mongodb_uri; do
  touch "secrets/$secret.txt"
  chmod 600 "secrets/$secret.txt"
  echo "Created secrets/$secret.txt"
  echo "Please add your $secret to this file"
  echo "Example: echo 'your_${secret//_/ }' > secrets/$secret.txt"
  echo
  
  # Add to .gitignore if not already there
  grep -qxF "secrets/$secret.txt" .gitignore || echo "secrets/$secret.txt" >> .gitignore
done

echo "\nPlease edit the secret files with your actual values before starting the containers."
