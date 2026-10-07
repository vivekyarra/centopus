#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="643700104680"
EXPECTED_SUBJECT="repo:vivekyarra/centopus:ref:refs/heads/main"

command -v aws >/dev/null 2>&1 || { echo "aws CLI is required" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 1; }

actual_account="$(aws sts get-caller-identity --query Account --output text)"
if [[ "$actual_account" != "$EXPECTED_ACCOUNT_ID" ]]; then
  echo "Refusing to modify IAM in account $actual_account; expected $EXPECTED_ACCOUNT_ID." >&2
  exit 1
fi

apply_policy() {
  local role_name="$1"
  local policy_file="$2"

  if ! jq -e --arg subject "$EXPECTED_SUBJECT" '
    .Statement[]
    | select(.Action == "sts:AssumeRoleWithWebIdentity")
    | .Condition.StringLike["token.actions.githubusercontent.com:sub"]
    | if type == "array" then index($subject) != null else . == $subject end
  ' "$policy_file" >/dev/null; then
    echo "Policy $policy_file does not authorize $EXPECTED_SUBJECT." >&2
    exit 1
  fi

  echo "Updating trust policy for $role_name..."
  aws iam update-assume-role-policy     --role-name "$role_name"     --policy-document "file://$policy_file"

  aws iam get-role     --role-name "$role_name"     --query 'Role.AssumeRolePolicyDocument'     --output json >"/tmp/${role_name}-trust.json"

  if ! jq -e --arg subject "$EXPECTED_SUBJECT" '
    .Statement[]
    | select(.Action == "sts:AssumeRoleWithWebIdentity")
    | .Condition.StringLike["token.actions.githubusercontent.com:sub"]
    | if type == "array" then index($subject) != null else . == $subject end
  ' "/tmp/${role_name}-trust.json" >/dev/null; then
    echo "AWS did not return the expected GitHub OIDC subject for $role_name." >&2
    exit 1
  fi
}

apply_policy   "CentopusBackendGitHubDeployRole"   "infra/policies/backend-deploy-role-trust-policy.json"

apply_policy   "CentopusAmplifyGitHubDeployRole"   "infra/policies/amplify-deploy-role-trust-policy.json"

echo "GitHub OIDC trust is configured for $EXPECTED_SUBJECT."
echo "Set repository variable ENABLE_AWS_DEPLOYMENT=true, then rerun the production deploy workflows."
