# strategy-trading

# Set up API IN LINUX Service
# Step 1: npm i
# Step 2: Gen SSH key github (following chat GPT)
# Step 3: Following file: linux.template.service
# Step 4: Use CLI to run service file (following promt: How to set up API service in linux)

# Set up GUI IN LINUX Service
# Step 1: cd to GUI
# Step 2: npm i
# Step 3: npm run build
# Step 4: Following file: linux.template.service
# Step 5: Likely step 4 at above

# Set up auto commit IN LINUX Background
cd /home/$USER/Project/strategy-trading

chmod +x ./auto_commit.sh

nohup ./auto_commit.sh > /dev/null 2>&1 &

# Remove auto commit IN LINUX Background
ps aux | grep auto_commit.sh

kill id

# Set up auto commit IN LINUX Service

ssh-keygen -p -f /home/#USER/.ssh/id_rsa
# Access with old passphrase, after that (empty for no passphrase)
# Following file with prefix: linux.auto_commit.template.service
