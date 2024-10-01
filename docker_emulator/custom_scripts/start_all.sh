#!/bin/bash
set -e

# Ensure conda is in the PATH
export PATH="/opt/conda/bin:$PATH"

# Activate conda and the retro_env
source /opt/conda/bin/activate
conda activate retro_env

# Set up the environment for RetroArch
export DISPLAY=:99

# Keep the container running
wait