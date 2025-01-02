locals {
  hcloud_token = "${var.hcloud_token}"
}

module "kube-hetzner" {
  providers = {
    hcloud = hcloud
  }

  version = "2.0.2"
  automatically_upgrade_k3s = false
  automatically_upgrade_os = false
  cluster_name = "extenship-test"
  hcloud_token = var.hcloud_token != "" ? var.hcloud_token : local.hcloud_token
  source = "kube-hetzner/kube-hetzner/hcloud"
  ssh_public_key = file("./ssh/hetzner-k8s-extenship.pub")
  ssh_private_key = file("./ssh/hetzner-k8s-extenship")
  network_region = "eu-central"
  use_cluster_name_in_node_name = false
  cni_plugin = "calico"

  control_plane_nodepools = [
    {
      name        = "master",
      server_type = "cpx31",
      location    = "fsn1",
      labels      = [],
      taints      = [],
      count       = 1
    }
  ]

  agent_nodepools = [
    {
      name        = "app",
      server_type = "cpx31",
      location    = "nbg1",
      labels      = [],
      taints      = [],
      count       = 2
    }
  ]

  extra_firewall_rules = [
    {
      description     = "Outbound All"
      direction       = "out"
      protocol        = "tcp"
      port            = "any"
      source_ips      = []
      destination_ips = ["0.0.0.0/0", "::/0"]
    }
  ]
}

provider "hcloud" {
  token = var.hcloud_token != "" ? var.hcloud_token : local.hcloud_token
}

terraform {
  required_version = ">= 1.3.3"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = ">= 1.35.2"
    }
  }
}

output "kubeconfig" {
  value     = module.kube-hetzner.kubeconfig
  sensitive = true
}

variable "hcloud_token" {
  sensitive = true
  default   = ""
}
