variable "region" {
  description = "AWS region for every resource"
  type        = string
  default     = "ap-south-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster (also used to name the VPC)"
  type        = string
  default     = "taskboard-eks"
}

variable "cluster_version" {
  description = "Kubernetes version, e.g. \"1.34\". null lets EKS pick its current default."
  type        = string
  default     = null
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "node_instance_type" {
  description = "EC2 instance type for the managed worker nodes"
  type        = string
  default     = "t3.medium"
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_desired_size" {
  type    = number
  default = 3
}

variable "node_max_size" {
  type    = number
  default = 4
}
