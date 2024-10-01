#!/bin/bash
set -e

case "$1" in
    train)
        python3 /app/stable_retro_scripts/model_trainer.py "${@:2}" > /app/logs/train_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    model_vs_model)
        python3 /app/stable_retro_scripts/model_vs_model.py "${@:2}" > /app/logs/model_vs_model_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    import_roms)
        python3 /app/custom_scripts/import_roms.py "${@:2}" 
        ;;
    start_retroarch)
        /app/RetroArchAI/retroarch &
        ;;
    prepare_fight)
        python3 /app/custom_scripts/prepare_fight_state.py "${@:2}" > /app/logs/prepare_fight_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    start_streaming)
        /app/start_streaming.sh &
        ;;
    fight)
        python3 /app/stable_retro_scripts/agent_fight.py "${@:2}" > /app/logs/fight_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    create_mk2_state)
        python3 /app/custom_scripts/create_mk2_savestate.py "${@:2}" --save_dir /app/save_states > /app/logs/create_mk2_state_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    mk2_train)
        python3 /app/stable_retro_scripts/custom_trainers/mk2_trainer.py "${@:2}" > /app/logs/mk2_train_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    start_gun)
        node /app/gunServer.js &
        ;;
    *)
        echo "Unknown command: $1"
        exit 1
        ;;
esac