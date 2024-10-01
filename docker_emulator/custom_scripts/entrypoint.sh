#!/bin/bash
set -e


case "$1" in
    train_mk2)
        python3 /app/custom_scripts/mk2_trainer.py "${@:2}" > /app/logs/mk2_trainer_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    import_roms)
        python3 /app/custom_scripts/import_roms.py "${@:2}" 
        ;;
    fight_and_stream)
        start_retroarch && python3 /app/custom_scripts/run_fight_and_stream.py "${@:2}" > /app/logs/fight_and_stream_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    gun_game_commands)
        python3 /app/gameProcess.js "${@:2}" --save_dir /app/gun_game_saves > /app/logs/gun_game_commands_$(date +%Y%m%d_%H%M%S).log 2>&1
        ;;
    start_gun)
        node /app/gunServer.js
        ;;
    *)
        echo "Unknown command: $1"
        exit 1
        ;;
esac