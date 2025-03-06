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
