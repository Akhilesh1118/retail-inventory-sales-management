#!/usr/bin/env bash
set -e

REPO_HOST_PATH="github.com/Akhilesh1118/retail-inventory-sales-management.git"
TOKEN="${1:-$GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "=================================================="
  echo " GitHub Push Helper"
  echo "=================================================="
  echo "Repository: https://$REPO_HOST_PATH"
  echo ""
  echo "A GitHub Personal Access Token (PAT) is required."
  echo "Usage:"
  echo "  ./scripts/pushToGitHub.sh <YOUR_GITHUB_TOKEN>"
  echo "  or"
  echo "  GITHUB_TOKEN=<YOUR_TOKEN> ./scripts/pushToGitHub.sh"
  echo ""
  echo "How to get a token:"
  echo "1. Visit https://github.com/settings/tokens"
  echo "2. Click 'Generate new token (classic)'"
  echo "3. Give it a note and check the 'repo' scope checkbox"
  echo "4. Copy the generated token and pass it to this script"
  echo "=================================================="
  exit 1
fi

echo "Pushing commits to branch 'main' on GitHub..."
git push "https://$TOKEN@$REPO_HOST_PATH" main
echo "Push completed successfully!"
