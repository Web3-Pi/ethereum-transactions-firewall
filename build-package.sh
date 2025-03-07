#!/bin/bash
# Usage: ./build-package.sh [version]

set -e  # Exit on any error

# Configuration
PACKAGE_NAME=w3p-firewall
VERSION=${1:-$(git describe --tags --always)}
OUTPUT_DIR="./dist-deb"

echo "Building package for $PACKAGE_NAM version $VERSION"

# Ensure we have a build to package
if [ ! -d "./dist" ]; then
  echo "Error: dist/ directory not found. Run 'npm run build' first."
  exit 1
fi

# Create package directory structure
echo "Creating package structure..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/package/DEBIAN"
mkdir -p "$OUTPUT_DIR/package/usr/local/bin"
mkdir -p "$OUTPUT_DIR/package/etc/$PACKAGE_NAME"
mkdir -p "$OUTPUT_DIR/package/var/log"

# Create config file
cat > "$OUTPUT_DIR/package/etc/$PACKAGE_NAME/w3p-firewall.conf" << EOF
NODE_ENV=production
SERVER_PORT=8454
PROXY_PORT=18500
WSS_PORT=18501
RPC_ENDPOINT='http://localhost:8545'
AUTHORIZED_ADDR_FN=/etc/$PACKAGE_NAME/auth_addr
KNOWN_CONTRACTS_FN=/etc/$PACKAGE_NAME/known_contracts
CONTRACT_ABIS_FN=/etc/$PACKAGE_NAME/contract_abis
EOF

# Create data files with initial content
cat > "$OUTPUT_DIR/package/etc/$PACKAGE_NAME/auth_addr" << EOF
{
  "0x00000000219ab540356cBB839Cbe05303d7705Fa": "Beacon Deposit Contract",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "Wrapped Ether",
  "0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429": "GLM Token Contract"
}
EOF

cat > "$OUTPUT_DIR/package/etc/$PACKAGE_NAME/known_contracts" << EOF
{
    "0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429": "glm",
    "0x00000000219ab540356cBB839Cbe05303d7705Fa": "bdc"
}
EOF

cat > "$OUTPUT_DIR/package/etc/$PACKAGE_NAME/contract_abis" << EOF
{
    "glm": [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"sender","type":"address"},{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"nonces","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"holder","type":"address"},{"name":"spender","type":"address"},{"name":"nonce","type":"uint256"},{"name":"expiry","type":"uint256"},{"name":"allowed","type":"bool"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"}],"name":"addMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"isMinter","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_migrationAgent","type":"address"},{"name":"_chainId","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"}],"name":"MinterAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"}],"name":"MinterRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}],
    "bdc": [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"pubkey","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"withdrawal_credentials","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"amount","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"signature","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"index","type":"bytes"}],"name":"DepositEvent","type":"event"},{"inputs":[{"internalType":"bytes","name":"pubkey","type":"bytes"},{"internalType":"bytes","name":"withdrawal_credentials","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"deposit_data_root","type":"bytes32"}],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"get_deposit_count","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"get_deposit_root","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"}]
}
EOF

# Create systemd service
mkdir -p "$OUTPUT_DIR/package/etc/systemd/system"

cat > "$OUTPUT_DIR/package/etc/systemd/system/$PACKAGE_NAME.service" << EOF
[Unit]
Description=Web3 Pi Firewall Service
After=network.target

[Service]
Type=simple
EnvironmentFile=/etc/$PACKAGE_NAME/w3p-firewall.conf
ExecStart=/usr/local/bin/$PACKAGE_NAME
Restart=always
RestartSec=10
StandardOutput=append:/var/log/$PACKAGE_NAME.log
StandardError=append:/var/log/$PACKAGE_NAME.log
SyslogIdentifier=$PACKAGE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Create postinst script
cat > "$OUTPUT_DIR/package/DEBIAN/postinst" << EOF
#!/bin/sh
set -e

# Create log file and set permissions
touch /var/log/$PACKAGE_NAME.log
chown root:adm /var/log/$PACKAGE_NAME.log
chmod 640 /var/log/$PACKAGE_NAME.log

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable $PACKAGE_NAME
systemctl start $PACKAGE_NAME || true

echo "Installation complete. Please ensure the following ports are open in your firewall:"
echo "  - SERVER_PORT: 8454"
echo "  - PROXY_PORT: 18500"
echo "  - WSS_PORT: 18501"

exit 0
EOF

# Create prerm script
cat > "$OUTPUT_DIR/package/DEBIAN/prerm" << EOF
#!/bin/sh
set -e

# Stop and disable service
systemctl stop $PACKAGE_NAME || true
systemctl disable $PACKAGE_NAME || true

exit 0
EOF

# Create postrm script
cat > "$OUTPUT_DIR/package/DEBIAN/postrm" << EOF
#!/bin/sh
set -e

if [ "\$1" = "purge" ]; then
    # Remove service files
    rm -f /etc/systemd/system/$PACKAGE_NAME.service

    # Remove application files and directories
    rm -rf /etc/$PACKAGE_NAME
    rm -f /usr/local/bin/$PACKAGE_NAME

    # Remove log file
    rm -f /var/log/$PACKAGE_NAME.log

    # Reload systemd configuration
    systemctl daemon-reload
fi

echo "Uninstallation complete. Please ensure the following ports are closed in your firewall if no longer needed:"
echo "  - SERVER_PORT: 8454"
echo "  - PROXY_PORT: 18500"
echo "  - WSS_PORT: 18501"

exit 0
EOF

# Add after creating the scripts
chmod 755 "$OUTPUT_DIR/package/DEBIAN/postinst"
chmod 755 "$OUTPUT_DIR/package/DEBIAN/prerm"
chmod 755 "$OUTPUT_DIR/package/DEBIAN/postrm"

# Create control file
cat > "$OUTPUT_DIR/package/DEBIAN/control" << EOF
Package: $PACKAGE_NAME
Version: $VERSION
Section: admin
Priority: optional
Architecture: all
Depends: systemd
Maintainer: Web3 Pi
Description: A firewall service to let user accept/reject ethereum transactions before it reaches RPC endpoint
EOF

# Copy build artifacts
echo "Copying build artifacts..."
cp ./dist/$PACKAGE_NAME "$OUTPUT_DIR/package/usr/local/bin/"
chmod +x "$OUTPUT_DIR/package/usr/local/bin/$PACKAGE_NAME"

# Build the package
echo "Building Debian package..."
cd "$OUTPUT_DIR"
dpkg-deb --build --root-owner-group package
mv package.deb "../$PACKAGE_NAME-$VERSION.deb"
cd ..

echo "Package built successfully: $PACKAGE_NAME-$VERSION.deb"
