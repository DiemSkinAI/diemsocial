# Google Cloud CLI Setup and Usage Guide

## Table of Contents
1. [Installation](#installation)
2. [Authentication](#authentication)
3. [Project Configuration](#project-configuration)
4. [Accessing Billing Data](#accessing-billing-data)
5. [Monitoring API Usage](#monitoring-api-usage)
6. [Real-Time Tracking](#real-time-tracking)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites
- macOS with Homebrew installed
- Active Google Cloud account (diemskinai@gmail.com)
- Billing account set up
- **GEMINI_API_KEY environment variable** (check your app's .env file)

## Important Security Notes
- **GEMINI_API_KEY**: This is already in your codebase environment variables - do NOT hardcode it
- **Access Tokens**: Generated dynamically via `gcloud auth print-access-token` - never store these
- **Google Account**: User must authenticate interactively via `gcloud auth login`

### Install Google Cloud CLI
```bash
# Install via Homebrew (recommended for macOS)
brew install --cask google-cloud-sdk

# Reload shell environment
source ~/.zshrc

# Verify installation
gcloud --version
```

## Authentication

### Step 1: Initial Authentication
```bash
# Authenticate with your Google account
gcloud auth login
```
- This opens a browser window
- Sign in with your Google Cloud account
- Grant necessary permissions

### Step 2: Application Default Credentials (Optional)
```bash
# For API access (if needed)
gcloud auth application-default login
```

### Step 3: Verify Authentication
```bash
# Check authenticated accounts
gcloud auth list

# Get current access token
gcloud auth print-access-token
```

## Project Configuration

### List Available Projects
```bash
gcloud projects list
```

### Set Active Project
```bash
# Replace 'your-project-id' with actual project ID
gcloud config set project your-project-id

# Example from this session:
gcloud config set project diemvision
```

### Verify Project Configuration
```bash
gcloud config get-value project
```

## Accessing Billing Data

### List Billing Accounts
```bash
gcloud billing accounts list
```

### Get Billing Account Details
```bash
# Replace with your billing account ID
gcloud billing accounts describe 01B656-F09126-E20B10
```

### Check Project Billing
```bash
gcloud billing projects list --billing-account=YOUR_BILLING_ACCOUNT_ID
```

## Monitoring API Usage

### Install Beta Components (if needed)
```bash
gcloud components install beta alpha
```

### Check Enabled Services
```bash
gcloud services list --enabled --project=YOUR_PROJECT_ID
```

### Get API Usage Metrics
```bash
# Get access token for API calls
TOKEN=$(gcloud auth print-access-token)

# Query API usage for specific date
curl -s -H "Authorization: Bearer $TOKEN" \
"https://monitoring.googleapis.com/v3/projects/YOUR_PROJECT_ID/timeSeries?filter=metric.type%3D%22generativelanguage.googleapis.com/quota/generate_requests_per_model/usage%22&interval.startTime=2025-09-07T00:00:00Z&interval.endTime=2025-09-07T23:59:59Z"
```

## Real-Time Tracking

### Count Total API Calls for a Day
```bash
TOKEN=$(gcloud auth print-access-token) && \
curl -s -H "Authorization: Bearer $TOKEN" \
"https://monitoring.googleapis.com/v3/projects/YOUR_PROJECT_ID/timeSeries?filter=metric.type%3D%22generativelanguage.googleapis.com/quota/generate_requests_per_model/usage%22&interval.startTime=2025-09-07T00:00:00Z&interval.endTime=2025-09-07T23:59:59Z" | \
grep '"int64Value"' | \
sed 's/.*"int64Value": "\(.*\)".*/\1/' | \
awk '{sum += $1} END {print "Total API calls:", sum+0}'
```

### Track Real-Time API Calls
```bash
# Check specific time window (adjust timestamps)
TOKEN=$(gcloud auth print-access-token) && \
curl -s -H "Authorization: Bearer $TOKEN" \
"https://monitoring.googleapis.com/v3/projects/YOUR_PROJECT_ID/timeSeries?filter=metric.type%3D%22generativelanguage.googleapis.com/quota/generate_requests_per_model/usage%22&interval.startTime=2025-09-07T16:45:00Z&interval.endTime=2025-09-07T16:46:00Z"
```

## Common Commands

### Project Management
```bash
# List all projects
gcloud projects list

# Set project
gcloud config set project PROJECT_ID

# Get current project
gcloud config get-value project
```

### Authentication
```bash
# Login
gcloud auth login

# List authenticated accounts
gcloud auth list

# Get access token
gcloud auth print-access-token

# Logout
gcloud auth revoke
```

### Billing
```bash
# List billing accounts
gcloud billing accounts list

# Describe billing account
gcloud billing accounts describe BILLING_ACCOUNT_ID

# List projects linked to billing account
gcloud beta billing projects list --billing-account=BILLING_ACCOUNT_ID
```

### Services
```bash
# List enabled services
gcloud services list --enabled

# Enable a service
gcloud services enable SERVICE_NAME

# Disable a service
gcloud services disable SERVICE_NAME
```

## Key Information for DiemVision Project

### Project Details
- **Project ID**: `diemvision`
- **Project Number**: `17714175233`
- **Billing Account**: `01B656-F09126-E20B10`
- **Currency**: CAD
- **Primary API**: Generative Language API (generativelanguage.googleapis.com)

### Model Used
- **Model Name**: `gemini-2.5-flash-preview-image`
- **API Endpoint**: generativelanguage.googleapis.com

### Billing Analysis Results
- **Yesterday (Sep 6)**: 146 calls = $8.30 CAD
- **Cost per call**: $0.0568 CAD
- **Pricing difference**: 45.6% higher than USD documentation pricing

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
# Re-authenticate
gcloud auth login

# Check current auth
gcloud auth list
```

#### 2. Project Not Set
```bash
# Set project explicitly
gcloud config set project YOUR_PROJECT_ID
```

#### 3. API Not Enabled
```bash
# Check enabled services
gcloud services list --enabled

# Enable required service
gcloud services enable generativelanguage.googleapis.com
```

#### 4. Billing Access Issues
```bash
# Verify billing account access
gcloud billing accounts list

# Check project billing status
gcloud beta billing projects describe PROJECT_ID
```

### Important Notes

1. **Billing Data Delay**: Real-time billing costs are NOT available via CLI. Only usage metrics update immediately. Actual costs appear 2-24 hours later.

2. **Currency**: Billing account currency affects final costs. Documentation prices are typically in USD.

3. **Rate Limits**: API calls have quotas and rate limits. Monitor usage to avoid hitting limits.

4. **Access Tokens**: Tokens expire and need refresh. Use `gcloud auth print-access-token` to get fresh tokens.

## API Endpoints Reference

### Monitoring API
```
https://monitoring.googleapis.com/v3/projects/PROJECT_ID/timeSeries
```

### Service Usage API
```
https://serviceusage.googleapis.com/v1/projects/PROJECT_ID/services/SERVICE_NAME
```

### Billing API (Limited Access)
```
https://cloudbilling.googleapis.com/v1/billingAccounts/BILLING_ACCOUNT_ID
```

## Example Complete Workflow

```bash
# 1. Set up project
gcloud config set project diemvision

# 2. Get access token
TOKEN=$(gcloud auth print-access-token)

# 3. Check today's API usage
curl -s -H "Authorization: Bearer $TOKEN" \
"https://monitoring.googleapis.com/v3/projects/diemvision/timeSeries?filter=metric.type%3D%22generativelanguage.googleapis.com/quota/generate_requests_per_model/usage%22&interval.startTime=$(date -u +%Y-%m-%d)T00:00:00Z&interval.endTime=$(date -u +%Y-%m-%d)T23:59:59Z" | \
grep '"int64Value"' | \
sed 's/.*"int64Value": "\(.*\)".*/\1/' | \
awk '{sum += $1} END {print "Total calls today:", sum+0}'

# 4. Check billing account
gcloud billing accounts describe 01B656-F09126-E20B10
```

This guide provides everything needed to set up and use Google Cloud CLI for monitoring API usage and billing data.
