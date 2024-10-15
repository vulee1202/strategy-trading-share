# Set up auto commit IN LINUX Background

cd /home/$USER/Project/strategy-trading

chmod +x ./auto-commit.sh

nohup ./auto-commit.sh > /dev/null 2>&1 &

# Remove auto commit IN LINUX Background

ps aux | grep auto-commit.sh

kill id

# Set up auto commit IN LINUX Service

ssh-keygen -p -f /home/#USER/.ssh/id_rsa

# Access with old passphrase, after that (empty for no passphrase)

# Following file with prefix: linux.auto_commit.template.service
