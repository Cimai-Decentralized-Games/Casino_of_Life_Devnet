# game_wrappers_mgr.py

from .game_wrappers.mk2_wrapper import MK2Wrapper

def init(args):
    if args.env == 'MortalKombatII-Genesis':
        return MK2Wrapper
    else:
        raise ValueError(f"Unsupported game: {args.env}")