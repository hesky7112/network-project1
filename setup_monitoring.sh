#!/bin/bash

# Install required packages
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx wget

# Create necessary directories
sudo mkdir -p /var/www/your-frontend
sudo mkdir -p /etc/prometheus
sudo mkdir -p /etc/alertmanager

# Install Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.2.2/node_exporter-1.2.2.linux-amd64.tar.gz
tar xvfz node_exporter-*.tar.gz
sudo cp node_exporter-*/node_exporter /usr/local/bin/

# Create systemd service for Node Exporter
cat <<EOF | sudo tee /etc/systemd/system/node_exporter.service
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.30.3/prometheus-2.30.3.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
sudo cp prometheus-*/prometheus /usr/local/bin/
sudo cp prometheus-*/promtool /usr/local/bin/

# Install Alertmanager
wget https://github.com/prometheus/alertmanager/releases/download/v0.23.0/alertmanager-0.23.0.linux-amd64.tar.gz
tar xvfz alertmanager-*.tar.gz
sudo cp alertmanager-*/alertmanager /usr/local/bin/
sudo cp alertmanager-*/amtool /usr/local/bin/

# Copy configuration files
sudo cp prometheus/prometheus.yml /etc/prometheus/
sudo cp prometheus/prometheus.rules.yml /etc/prometheus/
sudo cp prometheus/alertmanager.yml /etc/alertmanager/

# Create systemd service for Prometheus
cat <<EOF | sudo tee /etc/systemd/system/prometheus.service
[Unit]
Description=Prometheus
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for Alertmanager
cat <<EOF | sudo tee /etc/systemd/system/alertmanager.service
[Unit]
Description=Alertmanager
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/alertmanager \
    --config.file=/etc/alertmanager/alertmanager.yml \
    --storage.path=/var/lib/alertmanager/

[Install]
WantedBy=multi-user.target
EOF

# Install Grafana
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt update
sudo apt install -y grafana

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable node_exporter prometheus alertmanager grafana-server
sudo systemctl start node_exporter prometheus alertmanager grafana-server

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Set up automatic certificate renewal
(sudo crontab -l 2>/dev/null; echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q") | sudo crontab -

# Restart Nginx
sudo systemctl restart nginx

echo "Setup complete!"
echo "Access the following services:"
echo "- Your application: https://your-domain.com"
echo "- Prometheus: http://your-server-ip:9090"
echo "- Grafana: http://your-server-ip:3000 (default credentials: admin/admin)"
echo "- Node Exporter metrics: http://your-server-ip:9100/metrics"
