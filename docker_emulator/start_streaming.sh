#!/bin/bash
set -x
echo "Script started at $(date)"

# Activate the conda environment
source /opt/conda/etc/profile.d/conda.sh
conda activate retro_env

# Start the Python script
echo "Starting Python script for Mortal Kombat II streaming..."
echo "Current working directory: $(pwd)"
echo "Contents of /app/hls:"
ls -l /app/hls/

# Run the Python script
python /app/custom_scripts/agent_fight.py \
    --env MortalKombatII-Genesis \
    --state Level1.LiuKangVsJax.state \
    --load_p1_model /app/models/LiuKang.pt\
    --load_p2_model /app/models/LiuKang.pt \
    --num_rounds 3 \
    --output_basedir /app/logs \
    --log-level INFO

echo "Python script exited. Check logs for details."

# Deactivate the conda environment
conda deactivate