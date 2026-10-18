terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.95"
    }
  }

  # State is kept locally for the classroom demo. A team would use a remote
  # backend (S3 bucket + DynamoDB lock table) so state is shared and locked.
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "taskboard"
      ManagedBy = "terraform"
      Session   = "21-devops-capstone"
    }
  }
}
