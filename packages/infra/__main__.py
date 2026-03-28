"""OCI Always Free ARM VM infrastructure."""

import base64

import pulumi
import pulumi_oci as oci
from pulumi_oci.core import get_images as core_get_images
from pulumi_oci.core import get_vnic as core_get_vnic
from pulumi_oci.core import get_vnic_attachments as core_get_vnic_attachments
from pulumi_oci.identity import get_availability_domain

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
config = pulumi.Config()

compartment_id = config.require("compartment_id")
tenancy_ocid = config.require("tenancy_ocid")
ssh_public_key = config.require_secret("ssh_public_key")
mongo_uri = config.require_secret("mongo_uri")
google_client_id = config.require_secret("google_client_id")
duckdns_token = config.require_secret("duckdns_token")

# ---------------------------------------------------------------------------
# Availability Domain
# ---------------------------------------------------------------------------
ad = get_availability_domain(
    compartment_id=tenancy_ocid,
    ad_number=1,
)

# ---------------------------------------------------------------------------
# ARM image lookup (Oracle Linux 8, compatible with A1.Flex)
# ---------------------------------------------------------------------------
ol8_images = core_get_images(
    compartment_id=compartment_id,
    operating_system="Oracle Linux",
    operating_system_version="8",
    shape="VM.Standard.A1.Flex",
    sort_by="TIMECREATED",
    sort_order="DESC",
    state="AVAILABLE",
)
image_id = ol8_images.images[0].id

# ---------------------------------------------------------------------------
# Networking
# ---------------------------------------------------------------------------
vcn = oci.core.Vcn(
    "vcn",
    compartment_id=compartment_id,
    cidr_blocks=["10.0.0.0/16"],
    display_name="sogrim-vcn",
    dns_label="sogrimvcn",
)

internet_gateway = oci.core.InternetGateway(
    "igw",
    compartment_id=compartment_id,
    vcn_id=vcn.id,
    display_name="sogrim-igw",
    enabled=True,
)

route_table = oci.core.RouteTable(
    "rt",
    compartment_id=compartment_id,
    vcn_id=vcn.id,
    display_name="sogrim-rt",
    route_rules=[
        oci.core.RouteTableRouteRuleArgs(
            network_entity_id=internet_gateway.id,
            destination="0.0.0.0/0",
            destination_type="CIDR_BLOCK",
        ),
    ],
)

security_list = oci.core.SecurityList(
    "sl",
    compartment_id=compartment_id,
    vcn_id=vcn.id,
    display_name="sogrim-sl",
    ingress_security_rules=[
        oci.core.SecurityListIngressSecurityRuleArgs(
            protocol="6",  # TCP
            source="0.0.0.0/0",
            description="SSH",
            tcp_options=oci.core.SecurityListIngressSecurityRuleTcpOptionsArgs(
                min=22,
                max=22,
            ),
        ),
        oci.core.SecurityListIngressSecurityRuleArgs(
            protocol="6",
            source="0.0.0.0/0",
            description="HTTP",
            tcp_options=oci.core.SecurityListIngressSecurityRuleTcpOptionsArgs(
                min=80,
                max=80,
            ),
        ),
        oci.core.SecurityListIngressSecurityRuleArgs(
            protocol="6",
            source="0.0.0.0/0",
            description="HTTPS",
            tcp_options=oci.core.SecurityListIngressSecurityRuleTcpOptionsArgs(
                min=443,
                max=443,
            ),
        ),
    ],
    egress_security_rules=[
        oci.core.SecurityListEgressSecurityRuleArgs(
            protocol="all",
            destination="0.0.0.0/0",
            description="Allow all outbound",
        ),
    ],
)

subnet = oci.core.Subnet(
    "subnet",
    compartment_id=compartment_id,
    vcn_id=vcn.id,
    cidr_block="10.0.0.0/24",
    display_name="sogrim-subnet",
    dns_label="sogrimsub",
    route_table_id=route_table.id,
    security_list_ids=[security_list.id],
    prohibit_internet_ingress=False,
    prohibit_public_ip_on_vnic=False,
)

# ---------------------------------------------------------------------------
# Cloud-init script
# ---------------------------------------------------------------------------
CLOUD_INIT_TEMPLATE = """\
#!/bin/bash
set -euxo pipefail

# --- Disable SELinux (prevents systemd from executing user-built binaries) ---
setenforce 0
sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config

# --- System packages ---
dnf install -y git gcc make openssl-devel

# --- Rust toolchain (as opc user) ---
su - opc -c 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'

# --- Caddy (official repo for RHEL/Oracle Linux) ---
dnf install -y 'dnf-command(copr)'
dnf copr enable -y @caddy/caddy
dnf install -y caddy

# --- Clone and build the server ---
su - opc -c '
  source "$HOME/.cargo/env"
  git clone https://github.com/sogrim/technion-sogrim.git ~/sogrim
  cd ~/sogrim/packages/server
  cat > .env << DOTENV
SOGRIM_URI="{mongo_uri}"
SOGRIM_CLIENT_ID="{google_client_id}"
SOGRIM_PORT=5545
SOGRIM_PROFILE=release
SOGRIM_CACHE_DIR=/home/opc/cache
DOTENV
  cargo build --release
'

# --- Sogrim server systemd service ---
cat > /etc/systemd/system/sogrim.service << 'UNIT'
[Unit]
Description=Sogrim API Server
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/home/opc/sogrim/packages/server
ExecStart=/home/opc/sogrim/packages/server/target/release/sogrim-server
ExecStartPost=/bin/sh -c 'for i in 1 2 3 4 5 6; do curl -sf http://localhost:5545/healthcheck && break || sleep 5; done'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

# --- Caddyfile (reverse proxy with auto-HTTPS) ---
cat > /etc/caddy/Caddyfile << 'CADDY'
sogrim.duckdns.org {{
    reverse_proxy localhost:5545 {{
        health_uri /healthcheck
        health_interval 30s
    }}
}}
CADDY

# --- DuckDNS IP update (cron every 5 min) ---
cat > /home/opc/duckdns-update.sh << 'DUCK'
#!/bin/bash
curl -s "https://www.duckdns.org/update?domains=sogrim&token={duckdns_token}&ip="
DUCK
chmod +x /home/opc/duckdns-update.sh
chown opc:opc /home/opc/duckdns-update.sh
echo "*/5 * * * * /home/opc/duckdns-update.sh > /dev/null 2>&1" | crontab -u opc -

# --- Run DuckDNS update immediately so Caddy can get a cert ---
/home/opc/duckdns-update.sh

# --- Open firewall ports (wait for firewalld to be ready) ---
for i in 1 2 3 4 5; do
  firewall-cmd --permanent --add-service=http && break || sleep 5
done
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# --- Start services ---
systemctl daemon-reload
systemctl enable --now sogrim
systemctl enable --now caddy
"""


def build_cloud_init(
    mongo_uri: str, google_client_id: str, duckdns_token: str
) -> str:
    script = CLOUD_INIT_TEMPLATE.format(
        mongo_uri=mongo_uri,
        google_client_id=google_client_id,
        duckdns_token=duckdns_token,
    )
    return base64.b64encode(script.encode()).decode()


cloud_init_b64 = pulumi.Output.all(mongo_uri, google_client_id, duckdns_token).apply(
    lambda args: build_cloud_init(args[0], args[1], args[2])
)

# ---------------------------------------------------------------------------
# Compute instance (Always Free A1.Flex: 4 OCPUs / 24 GB)
# ---------------------------------------------------------------------------
metadata = pulumi.Output.all(ssh_public_key, cloud_init_b64).apply(
    lambda args: {
        "ssh_authorized_keys": args[0],
        "user_data": args[1],
    }
)

instance = oci.core.Instance(
    "instance",
    availability_domain=ad.name,
    compartment_id=compartment_id,
    display_name="sogrim-vm",
    shape="VM.Standard.A1.Flex",
    shape_config=oci.core.InstanceShapeConfigArgs(
        ocpus=4,
        memory_in_gbs=24,
    ),
    source_details=oci.core.InstanceSourceDetailsArgs(
        source_type="image",
        source_id=image_id,
        boot_volume_size_in_gbs="200",
    ),
    create_vnic_details=oci.core.InstanceCreateVnicDetailsArgs(
        subnet_id=subnet.id,
        assign_public_ip="true",
        display_name="sogrim-vnic",
    ),
    metadata=metadata,
)

# ---------------------------------------------------------------------------
# Retrieve the public IP from the primary VNIC
# ---------------------------------------------------------------------------
vnic_attachments = instance.id.apply(
    lambda inst_id: core_get_vnic_attachments(
        compartment_id=compartment_id,
        instance_id=inst_id,
    )
)
primary_vnic = vnic_attachments.apply(
    lambda va: core_get_vnic(vnic_id=va.vnic_attachments[0].vnic_id)
)

# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
pulumi.export("instance_id", instance.id)
pulumi.export("instance_state", instance.state)
pulumi.export("availability_domain", ad.name)
pulumi.export("image_id", image_id)
pulumi.export("public_ip", primary_vnic.apply(lambda v: v.public_ip_address))
pulumi.export("ssh_command", primary_vnic.apply(
    lambda v: f"ssh opc@{v.public_ip_address}"
))
pulumi.export("url", "https://sogrim.duckdns.org")
